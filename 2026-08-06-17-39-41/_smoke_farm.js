/* 冒烟测试：DOM 桩 + vm 执行页面脚本，验证本轮 5 项改造 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'baby-farm', 'index.html'), 'utf8');
const js = html.match(/<script>([\s\S]*)<\/script>/)[1];

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? '  -> ' + extra : '')); }
};

/* ---------- DOM 桩 ---------- */
const store = {};
function mkEl(id) {
  const el = {
    id, innerHTML: '', textContent: '', value: '', className: '', style: {},
    children: [], onclick: null, onkeydown: null, onchange: null, disabled: false,
    classList: { add(){}, remove(){}, contains(){ return false; } },
    querySelectorAll(){ return []; }, querySelector(){ return null; },
    appendChild(c){ this.children.push(c); }, removeChild(c){}, focus(){},
    getAttribute(){ return null; }, setAttribute(){}, click(){}
  };
  return el;
}
const els = {};
function $el(id){ if(!els[id]) els[id] = mkEl(id); return els[id]; }

const document = {
  getElementById: (id) => $el(id),
  querySelectorAll: () => [],
  querySelector: () => null,
  createElement: (t) => mkEl('new_' + t),
  addEventListener(){}, removeEventListener(){},
  body: { appendChild(){}, removeChild(){} }
};

const speeches = [];
const timers = [];
const window = {
  speechSynthesis: {
    cancel(){}, speak(u){ speeches.push(u); },
    getVoices(){ return []; }, onvoiceschanged: null
  },
  scrollTo(){}, addEventListener(){}, removeEventListener(){}
};
function SpeechSynthesisUtterance(t){ this.text = t; this.lang=''; this.rate=1; this.pitch=1; }
window.SpeechSynthesisUtterance = SpeechSynthesisUtterance;

const localStorage = {
  _d: {},
  getItem(k){ return this._d[k] === undefined ? null : this._d[k]; },
  setItem(k, v){ this._d[k] = String(v); },
  removeItem(k){ delete this._d[k]; }
};

const sandbox = {
  window, document, localStorage, SpeechSynthesisUtterance,
  console,
  Blob: function(){}, URL: { createObjectURL(){ return 'blob:x'; }, revokeObjectURL(){} },
  FileReader: function(){ this.readAsText = function(){}; },
  Math, Date, JSON, parseInt, parseFloat, isNaN, Array, Object, String, Number, RegExp, Boolean,
  setTimeout: (fn) => { timers.push(fn); fn(); return timers.length; },   // 同步执行回调
  clearTimeout(){}, setInterval(){ return 0; }, clearInterval(){}
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(js, sandbox, { filename: 'app.js' });

const { App, DB, TABS, LETTERS, LG, NM, TASK_CATS } = sandbox;

/* ---------- 通用工具 ---------- */
function balanced(h) {
  const open = (h.match(/<div\b/g) || []).length;
  const close = (h.match(/<\/div>/g) || []).length;
  return { open, close, okay: open === close };
}
function speechTexts(){ return speeches.map(u => u.text); }

console.log('\n=== 1. 字母乐园 ===');
ok('26 个字母', LETTERS.length === 26);
ok('sayLetter 停顿 2 秒（源码 2000）', /Speech\.say\((?:L\[2\]|w\[1\])[^)]*\);\s*\}, 2000\)/.test(js));
ok('朗读只念单词不念字母', /Speech\.say\((?:L\[1\]|w\[0\])[^)]*,'en-US'/.test(js) && !/ch\+'\. '\+(?:L\[1\]|w\[0\])/.test(js));
sandbox.App.hwMod = 'letters';
sandbox.App.renderLetters();
const lh = els['hwContent'].innerHTML;
ok('已删除「大小写配对」按钮', lh.indexOf('大小写配对') < 0);
ok('已删除配对区 match-wrap', lh.indexOf('matchWrap') < 0);
ok('字母卡渲染 26 张', (lh.match(/class="lcard/g) || []).length === 26);
ok('字母页 div 平衡', balanced(lh).okay, JSON.stringify(balanced(lh)));
ok('配对相关函数已移除', !sandbox.App.newMatch && !sandbox.App.mDrop);

console.log('\n=== 2. 数字王国 ===');
ok('sayNum 停顿 2 秒', /Speech\.say\(numEN\(n\),'en-US',0\.72\); \}, 2000\)/.test(js));
ok('先中文后英文', /App\.sayNum = function\(n\)\{ Speech\.say\(numCN\(n\)/.test(js));
sandbox.NM.mode = 'know';
sandbox.App.renderNumbers();
let nh = els['hwContent'].innerHTML;
ok('seg 无「数一数」', nh.indexOf('数一数') < 0);
ok('认数字 10 个卡片', (nh.match(/class="ncard"/g) || []).length === 10);
ok('认数字页 div 平衡', balanced(nh).okay, JSON.stringify(balanced(nh)));
ok('数一数函数已移除', !sandbox.App.answerCount && !sandbox.App.skipCount);
ok('newCount 保留（闯关关卡用）', typeof sandbox.App.newCount === 'function');

// 加减法：答错语音
sandbox.DB.homework = sandbox.freshHomework(sandbox.today());
sandbox.NM.mode = 'math'; sandbox.NM.mathCount = 0; sandbox.NM.locked = false;
sandbox.NM.q = sandbox.App.newMath();
speeches.length = 0;
(function(){
  const q = sandbox.NM.q;
  let wrongIdx = q.opts.findIndex(v => v !== q.ans);
  sandbox.App.answerMath(wrongIdx);
})();
ok('答错语音「你答错啦，继续加油哦」', speechTexts().indexOf('你答错啦，继续加油哦') >= 0, speechTexts().join('|'));

// 加减法 8 题 → 自动打卡 + 跳逻辑
sandbox.DB.homework = sandbox.freshHomework(sandbox.today());
sandbox.NM.mode = 'math'; sandbox.NM.mathCount = 0; sandbox.NM.locked = false;
sandbox.App.hwMod = 'numbers';
for (let i = 0; i < 8; i++) {
  sandbox.NM.locked = false;
  if (!sandbox.NM.q) sandbox.NM.q = sandbox.App.newMath();
  const q = sandbox.NM.q;
  sandbox.App.answerMath(q.opts.indexOf(q.ans));
}
ok('8 题后数字王国自动打卡', sandbox.DB.homework.subj.数学.items['数字王国'] === true);
ok('8 题后跳转逻辑挑战', sandbox.App.hwMod === 'logic', 'hwMod=' + sandbox.App.hwMod);

console.log('\n=== 3. 逻辑挑战 ===');
ok('副标题标注 8 题', /\/ 8（找规律·图形配对·排序·专注力/.test(js));
// 6 种题型都能出题且只有 1 个正确
const kinds = { ok: true, msg: '' };
for (let i = 0; i < 400; i++) {
  const q = sandbox.App.newLogic();
  const rights = q.opts.filter(o => o.right).length;
  if (q.opts.length !== 4 || rights !== 1) { kinds.ok = false; kinds.msg = JSON.stringify({ n: q.opts.length, rights, t: q.title }); break; }
}
ok('400 次出题恒为 4 选项 / 1 正解', kinds.ok, kinds.msg);
const titles = new Set();
for (let i = 0; i < 600; i++) titles.add(sandbox.App.newLogic().title.slice(0, 6));
const tArr = [...titles].join('|');
ok('含排序题', /排队/.test(tArr) || /排好队/.test(tArr), tArr);
ok('含专注力抗干扰题', /专注力/.test(tArr), tArr);
ok('含图形配对题', /图形配对/.test(tArr), tArr);
// 8 题打卡跳转
sandbox.DB.homework = sandbox.freshHomework(sandbox.today());
sandbox.LG.right = 0; sandbox.LG.locked = false; sandbox.App.hwMod = 'logic';
for (let i = 0; i < 8; i++) {
  sandbox.LG.locked = false;
  if (!sandbox.LG.q) sandbox.LG.q = sandbox.App.newLogic();
  const q = sandbox.LG.q;
  sandbox.App.answerLogic(q.opts.findIndex(o => o.right));
}
ok('答对 8 题自动打卡逻辑挑战', sandbox.DB.homework.subj.逻辑.items['逻辑挑战'] === true);
ok('答对 8 题跳转闯关冒险', sandbox.App.hwMod === 'adventure', 'hwMod=' + sandbox.App.hwMod);
sandbox.App.renderLogic();
ok('逻辑页 div 平衡', balanced(els['hwContent'].innerHTML).okay);

console.log('\n=== 4. 底部导航 / 设置 ===');
ok('导航 5 栏', TABS.length === 5);
ok('已删除错题本', TABS.every(t => t.id !== 'wrong'));
ok('新增设置栏（第 5 顺位在农场前）', TABS[3].id === 'settings' && TABS[3].name === '设置');
ok('顺序：计划/作业/统计/设置/农场', TABS.map(t => t.id).join(',') === 'plan,homework,stats,settings,farm');
ok('错题本函数已移除', !sandbox.App.renderWrong && !sandbox.App.clearWrong && !sandbox.App.addWrong);
ok('页面无 view-wrong 容器', html.indexOf('view-wrong') < 0 && html.indexOf('view-settings') > 0);
ok('顶栏已移除导出/导入/清空按钮', html.indexOf('>导出备份</button>') < 0 && html.indexOf('>清空数据</button>') < 0);

// 家长验证
sandbox.App.parentOK = false; sandbox.App.gate = null;
sandbox.App.renderSettings();
let sh = els['view-settings'].innerHTML;
ok('未验证时显示家长验证', sh.indexOf('家长验证') >= 0 && sh.indexOf('打卡内容管理') < 0);
els['gateIn'].value = String(sandbox.App.gate.ans + 1);
sandbox.App.checkGate();
ok('答错不放行', sandbox.App.parentOK === false);
els['gateIn'].value = String(sandbox.App.gate.ans);
sandbox.App.checkGate();
ok('答对进入设置', sandbox.App.parentOK === true);
sh = els['view-settings'].innerHTML;
ok('设置含打卡内容管理', sh.indexOf('打卡内容管理') >= 0);
ok('设置含奖励管理', sh.indexOf('奖励管理') >= 0);
ok('设置含萌可昵称', sh.indexOf('萌可昵称') >= 0);
ok('设置含导出/导入/清空', sh.indexOf('导出 JSON 备份') >= 0 && sh.indexOf('导入恢复') >= 0 && sh.indexOf('清空全部数据') >= 0);
ok('设置页 div 平衡', balanced(sh).okay, JSON.stringify(balanced(sh)));

/* 打卡内容 增删改 */
const n0 = sandbox.DB.settings.tasks.length;
function dlgConfirm(label) {  // 触发 dialog 中指定按钮
  const btns = sandbox._lastDlgBtns || [];
  const b = btns.filter(x => x.txt === label)[0];
  if (b && b.fn) b.fn();
}
// 包装 dialog 以捕获按钮
const rawDialog = sandbox.App.dialog;
sandbox.App.dialog = function (t, b, btns) { sandbox._lastDlgBtns = btns; };
sandbox.App.editTask('');
$el('tkName').value = '收拾书包'; $el('tkScore').value = '5'; $el('tkCat').value = '学习';
dlgConfirm('保存');
ok('新增打卡内容', sandbox.DB.settings.tasks.length === n0 + 1);
const newT = sandbox.DB.settings.tasks[sandbox.DB.settings.tasks.length - 1];
ok('新增字段正确（名称/分值/分类）', newT.name === '收拾书包' && newT.score === 5 && newT.cat === '学习');
sandbox.App.editTask(newT.id);
$el('tkName').value = '收拾书包和文具'; $el('tkScore').value = '7'; $el('tkCat').value = '生活习惯';
dlgConfirm('保存');
ok('修改打卡内容生效', sandbox.App.findTask(newT.id).name === '收拾书包和文具' && sandbox.App.findTask(newT.id).score === 7);
sandbox.App.delTask(newT.id); dlgConfirm('确定删除');
ok('删除打卡内容', sandbox.DB.settings.tasks.length === n0);
ok('分类共 4 类', TASK_CATS.length === 4);

/* 奖励 增删改 */
const r0 = sandbox.DB.settings.rewards.length;
sandbox.App.editReward('');
$el('rwName').value = '看一场电影'; $el('rwCost').value = '80';
dlgConfirm('保存');
ok('新增奖励', sandbox.DB.settings.rewards.length === r0 + 1);
const newR = sandbox.DB.settings.rewards[sandbox.DB.settings.rewards.length - 1];
ok('奖励字段正确（名称/爱心值）', newR.name === '看一场电影' && newR.cost === 80);
sandbox.App.editReward(newR.id);
$el('rwName').value = '看电影 + 爆米花'; $el('rwCost').value = '120';
dlgConfirm('保存');
ok('修改奖励生效', sandbox.App.findReward(newR.id).cost === 120);
sandbox.App.delReward(newR.id); dlgConfirm('确定删除');
ok('删除奖励', sandbox.DB.settings.rewards.length === r0);

/* 萌可昵称 */
$el('petNameIn').value = '小雪萌可';
sandbox.App.savePetName();
ok('萌可昵称保存', sandbox.DB.settings.petName === '小雪萌可');
sandbox.App.cur = 'farm'; sandbox.App.renderFarm();
ok('农场页显示新昵称', els['view-farm'].innerHTML.indexOf('小雪萌可') >= 0);
ok('农场页有爱心奖励入口', els['view-farm'].innerHTML.indexOf('爱心奖励') >= 0);
ok('农场页 div 平衡', balanced(els['view-farm'].innerHTML).okay, JSON.stringify(balanced(els['view-farm'].innerHTML)));

/* 自定义打卡 → 爱心 */
sandbox.DB.homework.custom = {};
const heart0 = sandbox.DB.farm.heart;
const task1 = sandbox.DB.settings.tasks[0];
sandbox.App.doCustomTask(task1.id);
ok('自定义打卡加爱心', sandbox.DB.farm.heart === heart0 + task1.score, heart0 + '->' + sandbox.DB.farm.heart);
sandbox.App.doCustomTask(task1.id);
ok('同一天不能重复打卡', sandbox.DB.farm.heart === heart0 + task1.score);
sandbox.App.renderPlan();
const ph = els['view-plan'].innerHTML;
ok('今日计划展示自定义打卡', ph.indexOf('生活好习惯打卡') >= 0);
ok('今日计划 div 平衡', balanced(ph).okay, JSON.stringify(balanced(ph)));

/* 爱心兑换奖励 */
sandbox.DB.farm.heart = 200;
const rw = sandbox.DB.settings.rewards[0];
sandbox.App.redeemReward(rw.id);
ok('兑换奖励扣爱心', sandbox.DB.farm.heart === 200 - rw.cost);
ok('兑换记入奖状墙', sandbox.DB.farm.certificates.some(c => c.name === rw.name));
sandbox.DB.farm.heart = 0;
sandbox.App.redeemReward(rw.id);
ok('爱心不足不可兑换', sandbox.DB.farm.heart === 0);
sandbox.App.dialog = rawDialog;

console.log('\n=== 5. 数据兼容 / 通用 ===');
ok('ensureSettings 存在', typeof sandbox.App.ensureSettings === 'function');
delete sandbox.DB.settings;
sandbox.App.ensureSettings();
ok('老数据自动补齐 settings', !!sandbox.DB.settings && sandbox.DB.settings.tasks.length > 0 && sandbox.DB.settings.rewards.length > 0);
ok('freshHomework 含 custom', JSON.stringify(sandbox.freshHomework('2026-01-01')).indexOf('"custom"') >= 0);
ok('无外部资源引用', !/(src|href)\s*=\s*["']https?:/i.test(html));
ok('导出/导入函数保留', typeof sandbox.App.exportData === 'function' && typeof sandbox.App.importData === 'function');
ok('清空需二次确认', /最后确认一次/.test(js));

console.log('\n================  ' + pass + ' 通过 / ' + fail + ' 失败  ================\n');
process.exit(fail ? 1 : 0);
