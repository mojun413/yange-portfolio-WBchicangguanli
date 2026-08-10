/* DOM-mock 逻辑冒烟测试：在 Node vm 中跑通整个 app，校验联动逻辑 */
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('baby-farm/index.html', 'utf8');
const js = html.match(/<script>([\s\S]*?)<\/script>/)[1];

/* ---------- 通用 DOM 桩 ---------- */
function makeEl(reg) {
  const t = { style: {}, dataset: {}, classList: { add(){}, remove(){}, toggle(){}, contains(){return false;} },
    value: '', textContent: '', innerHTML: '', className: '', children: [], parentNode: null };
  return new Proxy(t, {
    get(o, p) {
      if (p in o) return o[p];
      switch (p) {
        case 'appendChild': return c => { o.children.push(c); o.parentNode = o; return c; };
        case 'removeChild': return c => c;
        case 'insertBefore': return c => c;
        case 'setAttribute': return () => {};
        case 'getAttribute': return () => null;
        case 'addEventListener': return () => {};
        case 'removeEventListener': return () => {};
        case 'querySelector': return () => makeEl(reg);
        case 'querySelectorAll': return () => [];
        case 'cloneNode': return () => makeEl(reg);
        case 'focus': return () => {};
        case 'click': return () => {};
        case 'remove': return () => {};
        case 'getContext': return () => ({});
        default: return makeEl(reg);
      }
    },
    set(o, p, v) { o[p] = v; return true; }
  });
}
const reg = {};
const doc = {
  getElementById(id) { if (!reg[id]) reg[id] = makeEl(reg); return reg[id]; },
  querySelector() { return makeEl(reg); },
  querySelectorAll() { return []; },
  createElement() { return makeEl(reg); },
  addEventListener() {}, removeEventListener() {},
  body: null
};
doc.body = makeEl(reg);

const sandbox = {
  window: { scrollTo(){}, scroll(){} }, // 故意不含 speechSynthesis -> Speech.ok=false
  document: doc,
  console,
  localStorage: (function () { const m = {}; return {
    getItem: k => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: k => { delete m[k]; }
  }; })(),
  setTimeout, clearTimeout, setInterval, clearInterval,
  Date, Math, JSON, parseInt, parseFloat, isNaN, String, Number, Array, Object, Boolean,
  SpeechSynthesisUtterance: function () {}
};
sandbox.global = sandbox;
vm.createContext(sandbox);

const results = [];
function ok(name, cond, extra) { results.push({ name, pass: !!cond, extra: extra || '' }); }
function section(t) { results.push({ sep: true, name: t }); }

try {
  vm.runInContext(js, sandbox, { filename: 'app.js' });
  ok('boot: 脚本整体执行无异常', true);
} catch (e) {
  ok('boot: 脚本整体执行无异常', false, e.message);
  console.log(JSON.stringify(results, null, 2));
  process.exit(1);
}

const A = sandbox.App, DB = sandbox.DB;
const today = sandbox.today;

/* ---------- 1. demoData 结构 ---------- */
section('数据结构');
ok('demoData.ver===3', DB.ver === 3, 'ver=' + DB.ver);
ok('农场用 heart 字段(非 rice)', 'heart' in DB.farm && !('rice' in DB.farm));
ok('种子含5个学科键', ['英语','语文','数学','逻辑','闯关'].every(k => k in DB.farm.seeds));
ok('宠物字段为 pet(非 chicken)', !!DB.farm.pet && !('chicken' in DB.farm));
ok('noHarvest 字段为布尔', typeof DB.farm.noHarvest === 'boolean');
ok('freshHomework 返回5科', Object.keys(sandbox.freshHomework(today())).length >= 0 &&
  Object.keys(sandbox.freshHomework(today()).subj).length === 5);

/* ---------- 2. 每日随机古诗/数字 ---------- */
section('每日随机内容');
const poems = sandbox.dailyPoems();
ok('dailyPoems 返回5首', Array.isArray(poems) && poems.length === 5);
ok('古诗含译文字段 mean', poems[0] && Array.isArray(poems[0].lines) && 'mean' in poems[0]);
const nums = sandbox.dailyNums();
ok('dailyNums 返回10个', Array.isArray(nums) && nums.length === 10);
ok('dailyNums 均在0-100', nums.every(n => n >= 0 && n <= 100));

/* ---------- 3. 作业完成奖励 ---------- */
section('作业完成奖励');
DB.homework = sandbox.freshHomework(today()); // 5科全未完成
const sun0 = DB.farm.sun, heart0 = DB.farm.heart;
const seeds0 = Object.assign({}, DB.farm.seeds);
['英语','语文','数学','逻辑','闯关'].forEach(s => A.checkIn(s, {英语:'字母乐园',语文:'古诗花园',数学:'数字王国',逻辑:'逻辑挑战',闯关:'闯关冒险'}[s]));
ok('5科全部标记 done', ['英语','语文','数学','逻辑','闯关'].every(s => DB.homework.subj[s].done));
ok('单模块完成 +1 阳光 (共+5)', DB.farm.sun === sun0 + 5, 'sun '+sun0+'->'+DB.farm.sun);
ok('细分打卡 +2爱心/项 (共+10)', DB.farm.heart === heart0 + 10, 'heart '+heart0+'->'+DB.farm.heart);
ok('每科解锁1颗专属种子', ['英语','语文','数学','逻辑','闯关'].every(s => DB.farm.seeds[s] === seeds0[s] + 1));

/* ---------- 4. 跨天结算：狗熊惩罚 ---------- */
section('跨天结算：狗熊惩罚');
function plantMature(i){ DB.farm.plots[i].crop = {name:'萝卜', stage:3, gold:5, health:3, withered:false}; }
function setUnfinished(n){ // n = 未完成模块数(0~5)
  DB.homework = sandbox.freshHomework(today());
  const subs = ['英语','语文','数学','逻辑','闯关'];
  for (let i=0;i<subs.length-n;i++) DB.homework.subj[subs[i]].done = true;
  DB.farm.bears = []; DB.farm.noHarvest = false;
}

// 1 个未完成
setUnfinished(1); plantMature(0);
A.rollDay();
ok('1未完成→1只狗熊', DB.farm.bears.length === 1, 'bears='+DB.farm.bears.length);
ok('1未完成→noHarvest=false', DB.farm.noHarvest === false);
ok('1未完成→作物健康-1', DB.farm.plots[0].crop.health === 2, 'hp='+DB.farm.plots[0].crop.health);

// 2 个未完成
setUnfinished(2); plantMature(0); DB.farm.plots[0].crop.health = 3;
A.rollDay();
ok('2未完成→2只狗熊', DB.farm.bears.length === 2, 'bears='+DB.farm.bears.length);
ok('2未完成→成熟作物降一级', DB.farm.plots[0].crop.stage === 2, 'stage='+DB.farm.plots[0].crop.stage);

// 3 个未完成
setUnfinished(3); plantMature(0);
A.rollDay();
ok('3未完成→3只狗熊(上限)', DB.farm.bears.length === 3, 'bears='+DB.farm.bears.length);
ok('3未完成→noHarvest=true', DB.farm.noHarvest === true);
ok('3未完成→成熟作物枯萎', DB.farm.plots[0].crop.withered === true);

// 全部完成 → 无狗熊 + 连续天数+1
setUnfinished(0);
var sd0 = DB.farm.streakDays;
A.rollDay();
ok('0未完成→无狗熊', DB.farm.bears.length === 0);
ok('0未完成→连续打卡天数+1', DB.farm.streakDays === sd0 + 1, sd0+'->'+DB.farm.streakDays);

// 护盾抵挡
setUnfinished(2); DB.farm.shield = 1; DB.farm.bears = [];
A.rollDay();
ok('有护盾→狗熊不出现', DB.farm.bears.length === 0);
ok('有护盾→护盾消耗1', DB.farm.shield === 0);

/* ---------- 5. 收获被禁 / 杀虫剂 ---------- */
section('收获与杀虫剂');
setUnfinished(3); plantMature(0); A.rollDay(); // noHarvest=true, 3 bears
var gold0 = DB.farm.gold;
A.harvestPlot(0); // 应被拦截
ok('noHarvest 时收获被拦截', DB.farm.gold === gold0 && DB.farm.plots[0].crop !== null);
var bearsBefore = DB.farm.bears.length;
DB.farm.potion = 1;
A.usePotion();
ok('杀虫剂清除狗熊', DB.farm.bears.length === 0);
ok('杀虫剂解除 noHarvest', DB.farm.noHarvest === false);
ok('杀虫剂恢复作物', DB.farm.plots[0].crop.withered === false && DB.farm.plots[0].crop.health === 3);

/* ---------- 6. 补作业发杀虫剂 ---------- */
section('补作业修复机制');
setUnfinished(3); plantMature(0); A.rollDay(); // 3 bears, incompleteAtReset=[3科]
DB.farm.potion = 0;
DB.homework = sandbox.freshHomework(today());
['英语','语文','数学','逻辑','闯关'].forEach(s => A.checkIn(s, {英语:'字母乐园',语文:'古诗花园',数学:'数字王国',逻辑:'逻辑挑战',闯关:'闯关冒险'}[s]));
ok('补完全部作业→得杀虫剂', DB.farm.potion === 1, 'potion='+DB.farm.potion);

/* ---------- 7. 宠物 优雅萌可 ---------- */
section('萌可宠物');
DB.farm.heart = 20; DB.farm.soap = 2; DB.farm.pet.feed = 10; DB.farm.pet.clean = 10;
var hb = DB.farm.heart, sp = DB.farm.soap;
A.feedPet();
ok('喂食-10爱心+30%饱食', DB.farm.heart === hb - 10 && DB.farm.pet.feed === 40, 'heart '+hb+'->'+DB.farm.heart+' feed='+DB.farm.pet.feed+' (10+30)');
A.bathePet();
ok('洗澡-1肥皂+清洁', DB.farm.soap === sp - 1 && DB.farm.pet.clean === 100);
let patOk = true; try { A.patPet(); } catch(e){ patOk = false; }
ok('摸头不报错', patOk);

/* ---------- 8. 自定义奖励 ---------- */
section('金币商城-自定义奖励');
reg['cName'] = reg['cName'] || makeEl(reg);
reg['cName'].value = '周末去公园';
reg['cCost'] = reg['cCost'] || makeEl(reg);
reg['cCost'].value = '5';
var g0 = DB.farm.gold;
A.addCustomReward();
ok('自定义奖励扣5金币', DB.farm.gold === g0 - 5, g0+'->'+DB.farm.gold);
ok('自定义奖励写入奖状', DB.farm.certificates.some(c => c.name === '周末去公园'));

/* ---------- 9. 古诗朗读门控 ---------- */
section('古诗门控');
DB.memoPoems = []; // 清空，避免 jys 已存在导致 no-op
sandbox.PM.open = 'jys'; sandbox.PM.read = false;
var mp0 = DB.memoPoems.length;
A.memoPoem(); // 未朗读应被拒
ok('未朗读不能点亮会背', DB.memoPoems.length === mp0);
A.sayPoem();  // 朗读后解锁
ok('朗读后 PM.read=true', sandbox.PM.read === true);
A.memoPoem(); // 现在可点亮
ok('朗读后可点亮会背', DB.memoPoems.length === mp0 + 1);

/* ---------- 汇总 ---------- */
let pass = 0, fail = 0;
const lines = [];
for (const r of results) {
  if (r.sep) { lines.push('\n【' + r.name + '】'); continue; }
  if (r.pass) { pass++; lines.push('  ✅ ' + r.name); }
  else { fail++; lines.push('  ❌ ' + r.name + (r.extra ? '  (' + r.extra + ')' : '')); }
}
console.log(lines.join('\n'));
console.log('\n结果：' + pass + ' 通过, ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
