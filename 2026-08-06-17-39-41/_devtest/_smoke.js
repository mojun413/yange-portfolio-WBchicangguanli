// 冒烟测试：用最小 DOM mock 跑一遍页面逻辑，确保无运行时异常
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/_check.js', 'utf8');

function mkEl(id) {
  const el = {
    id, _html: '', textContent: '', className: '', style: {}, value: '',
    files: null, href: '', download: '',
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, contains(c) { return this._s.has(c); }
    },
    setAttribute() {}, getAttribute() { return null; },
    appendChild() {}, removeChild() {}, click() {},
    querySelectorAll: () => [],
    scrollIntoView() {}
  };
  Object.defineProperty(el, 'innerHTML', { get() { return el._html; }, set(v) { el._html = String(v); } });
  return el;
}
const store = {};
const els = {};
function getEl(id) { if (!els[id]) els[id] = mkEl(id); return els[id]; }

global.window = {
  speechSynthesis: { cancel() {}, speak() {}, getVoices: () => [], onvoiceschanged: null },
  scrollTo() {}, addEventListener() {}
};
global.SpeechSynthesisUtterance = function (t) { this.text = t; };
global.document = {
  getElementById: getEl,
  querySelectorAll: () => [],
  createElement: () => mkEl('tmp'),
  body: { appendChild() {}, removeChild() {} },
  addEventListener() {}, removeEventListener() {}
};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};
global.Blob = function () {};
global.URL = { createObjectURL: () => 'blob:x', revokeObjectURL() {} };
global.setInterval = () => 0;
const realTimeout = global.setTimeout;
global.setTimeout = (fn) => { try { fn(); } catch (e) { throw e; } return 0; }; // 同步执行，暴露延迟回调里的错误

const errs = [];
function T(name, fn) { try { fn(); } catch (e) { errs.push(name + ' -> ' + e.message + '\n   ' + (e.stack || '').split('\n')[1]); } }

// 执行页面脚本
T('boot', () => { (0, eval)(src); });

const App = global.App, DB0 = global.DB;
if (!App) { console.log('!! App 未定义'); process.exit(1); }

console.log('初始星星:', DB.stars, '| 示例已学字母:', DB.learnedLetters.join(','), '| 徽章:', DB.badges.join(','));
console.log('今日任务日期:', DB.tasks.date, '| 顺延标记:', DB.tasks.items.map(i => i.id + (i.late ? '(逾期)' : '')).join(' '));

T('renderAll', () => App.renderAll());
T('go 各模块', () => ['letters', 'poems', 'numbers', 'logic', 'adventure'].forEach(m => App.go(m)));

// 字母
T('sayLetter', () => App.sayLetter('Z'));
T('配对流程', () => { App.ltMode('match'); App.newMatch(); const c = global.LT.pairs[0]; App.mPick(c); App.mDrop(c); });
T('配对错误分支', () => { App.newMatch(); App.mPick(global.LT.pairs[0]); App.mDrop(global.LT.pairs[1]); });

// 古诗
T('古诗全流程', () => {
  global.POEMS.forEach(p => { App.openPoem(p.id); App.sayLine(0); App.sayPoem(); App.memoPoem(); });
  App.closePoem();
});

// 数字
T('认数字 0-20', () => { App.nmMode('know'); for (let i = 0; i <= 20; i++) App.sayNum(i); });
T('算术 200 题', () => {
  App.nmMode('math');
  for (let i = 0; i < 200; i++) {
    const q = global.NM.q;
    if (!q || q.opts.length !== 4) throw new Error('算术选项数异常: ' + JSON.stringify(q && q.opts));
    if (q.opts.indexOf(q.ans) < 0) throw new Error('算术正确答案不在选项里');
    if (q.op === '+' && q.a + q.b > 10) throw new Error('加法超过10: ' + q.a + '+' + q.b);
    if (q.op === '−' && q.a - q.b < 0) throw new Error('减法出现负数');
    global.NM.locked = false;
    App.answerMath(q.opts.indexOf(q.ans));
  }
});
T('数数 100 题', () => {
  App.nmMode('count');
  for (let i = 0; i < 100; i++) {
    const q = global.NM.cq;
    if (q.opts.indexOf(q.n) < 0) throw new Error('数数正确答案不在选项里');
    global.NM.locked = false;
    App.answerCount(q.opts.indexOf(q.n));
  }
});

// 逻辑
T('逻辑 300 题', () => {
  for (let i = 0; i < 300; i++) {
    const q = global.LG.q;
    if (!q.opts || q.opts.length < 3 || q.opts.length > 4) throw new Error('逻辑选项数异常: ' + q.opts.length);
    const rights = q.opts.filter(o => o.right).length;
    if (rights !== 1) throw new Error('逻辑题正确答案数=' + rights + ' | ' + q.title);
    global.LG.locked = false;
    App.answerLogic(q.opts.findIndex(o => o.right));
  }
});

// 闯关
T('闯关 5 关全通', () => {
  for (let lv = 1; lv <= 5; lv++) {
    App.startLevel(lv);
    for (let i = 0; i < 5; i++) {
      const q = global.AV.qs[global.AV.idx];
      const rights = q.opts.filter(o => o.right).length;
      if (rights !== 1) throw new Error('第' + lv + '关题目正确答案数=' + rights + ' | ' + q.title);
      global.AV.locked = false;
      App.answerAdv(q.opts.findIndex(o => o.right));
    }
    if (!global.AV.over) throw new Error('第' + lv + '关未结算');
  }
  App.quitLevel();
});
T('闯关全答错', () => {
  App.startLevel(1);
  for (let i = 0; i < 5; i++) {
    const q = global.AV.qs[global.AV.idx];
    global.AV.locked = false;
    App.answerAdv(q.opts.findIndex(o => !o.right));
  }
  App.quitLevel();
});

// 备份 / 清空
T('导出', () => App.exportData());
T('跨天顺延', () => {
  DB.tasks.date = '2020-01-01';
  DB.tasks.items.forEach(i => { i.done = false; });
  App.rollTasks();
  const lates = DB.tasks.items.filter(i => i.late).length;
  if (lates !== 5) throw new Error('顺延标记数应为5，实际' + lates);
  if (DB.tasks.date !== (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0')))
    throw new Error('日期未刷新');
});
T('持久化', () => {
  if (!store['wb_baby_data_v1']) throw new Error('localStorage 未写入');
  const back = JSON.parse(store['wb_baby_data_v1']);
  if (typeof back.stars !== 'number') throw new Error('星星未持久化');
});

console.log('\n最终星星:', DB.stars, '| 徽章:', DB.badges.length + '/' + global.BADGES.length,
  '| 关卡:', JSON.stringify(DB.levels), '| 算术对/总:', DB.stats.mathRight + '/' + DB.stats.mathTotal);
console.log('localStorage 体积:', (store['wb_baby_data_v1'] || '').length, 'bytes');

if (errs.length) { console.log('\n❌ 失败 ' + errs.length + ' 项:\n' + errs.join('\n')); process.exit(1); }
console.log('\n✅ 全部冒烟测试通过');
