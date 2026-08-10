
/* ================= 核心：存储 / 导航 / 今日任务 ================= */
var K = {
  data: 'wb_baby_data_v1'
};
var MODULES = [
  {id:'letters',  name:'字母乐园', c:'c1', color:'#FF7FB0',
   icon:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="CUR" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V7a3 3 0 0 1 3-3h9a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H7a3 3 0 0 1-3-3z"/><path d="M4 19a3 3 0 0 1 3-3h10"/><path d="M9.5 12h4M10 9.5l1.5-3 1.5 3"/></svg>'},
  {id:'poems',    name:'古诗花园', c:'c2', color:'#4CCB8B',
   icon:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="CUR" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c0-5 3-8 8-8 0 5-3 8-8 8z"/><path d="M12 21c0-5-3-8-8-8 0 5 3 8 8 8z"/><path d="M12 21V9"/><circle cx="12" cy="5.5" r="2.8"/></svg>'},
  {id:'numbers',  name:'数字王国', c:'c3', color:'#4FC3F7',
   icon:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="CUR" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 8.5L9.7 7.4V16"/><path d="M14 8.2a2.2 2.2 0 1 1 3.4 2.6L14 16h4"/></svg>'},
  {id:'logic',    name:'逻辑挑战', c:'c4', color:'#A87FF0',
   icon:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="CUR" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="3.4"/><rect x="13.4" y="3.6" width="6.8" height="6.8" rx="1.6"/><path d="M7 13.8l3.6 6.6H3.4z"/><rect x="13.4" y="13.6" width="6.8" height="6.8" rx="3.4"/></svg>'},
  {id:'adventure',name:'闯关冒险', c:'c5', color:'#FFAE22',
   icon:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="CUR" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v8a6 6 0 0 0 12 0V3z"/><path d="M6 5H3.2a3 3 0 0 0 3 4M18 5h2.8a3 3 0 0 1-3 4"/><path d="M12 17v3M8.5 21h7"/></svg>'}
];

var TASK_DEF = [
  {id:'t_letter', label:'认识 5 个字母',  target:5, mod:'letters',   color:'#FF7FB0', bg:'#FFE3EE'},
  {id:'t_poem',   label:'朗读 1 首古诗',  target:1, mod:'poems',     color:'#4CCB8B', bg:'#DCF7EA'},
  {id:'t_math',   label:'做对 10 道算术', target:10,mod:'numbers',   color:'#4FC3F7', bg:'#DCF3FD'},
  {id:'t_logic',  label:'挑战 3 道逻辑题',target:3, mod:'logic',     color:'#A87FF0', bg:'#EEE5FF'},
  {id:'t_adv',    label:'闯关 1 次',      target:1, mod:'adventure', color:'#FFAE22', bg:'#FFF3D1'}
];

function today(){
  var d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function yesterday(){
  var d = new Date(); d.setDate(d.getDate()-1);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function rnd(n){ return Math.floor(Math.random()*n); }
function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){var j=rnd(i+1);var t=a[i];a[i]=a[j];a[j]=t;} return a; }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function $(id){ return document.getElementById(id); }

/* 默认（示例）数据：首次打开就有内容，含 1 条逾期任务 */
function demoData(){
  return {
    ver: 1,
    isDemo: true,
    stars: 15,
    learnedLetters: ['A','B','C','D','E'],
    memoPoems: ['jys'],
    levels: {1:3, 2:0, 3:0, 4:0, 5:0},
    badges: ['first'],
    stats: {mathRight:6, mathTotal:8, logicRight:2, countRight:3, matchRight:2, days:['2026-08-05'], poemRead:4},
    tasks: {
      date: yesterday(),
      items: [
        {id:'t_letter', cur:5, done:true,  late:false},
        {id:'t_poem',   cur:0, done:false, late:false},
        {id:'t_math',   cur:6, done:false, late:false},
        {id:'t_logic',  cur:3, done:true,  late:false},
        {id:'t_adv',    cur:1, done:true,  late:false}
      ]
    }
  };
}

var DB = null;
var App = {};

App.load = function(){
  try{
    var raw = localStorage.getItem(K.data);
    DB = raw ? JSON.parse(raw) : demoData();
  }catch(e){ DB = demoData(); }
  if(!DB || typeof DB !== 'object') DB = demoData();
  // 兼容缺字段
  if(!DB.levels) DB.levels = {1:0,2:0,3:0,4:0,5:0};
  if(!DB.badges) DB.badges = [];
  if(!DB.stats)  DB.stats  = {mathRight:0,mathTotal:0,logicRight:0,countRight:0,matchRight:0,days:[],poemRead:0};
  if(!DB.stats.days) DB.stats.days = [];
  if(!DB.learnedLetters) DB.learnedLetters = [];
  if(!DB.memoPoems) DB.memoPoems = [];
  if(typeof DB.stars !== 'number') DB.stars = 0;
  App.rollTasks();
};

App.save = function(){
  try{ localStorage.setItem(K.data, JSON.stringify(DB)); }
  catch(e){ App.toast('保存失败，浏览器存储可能已满'); }
};

/* 铁律5：昨天没做完的自动顺延到今天，标红提醒 */
App.rollTasks = function(){
  var t = today();
  if(!DB.tasks || DB.tasks.date !== t){
    var prev = (DB.tasks && DB.tasks.items) ? DB.tasks.items : [];
    var map = {}; prev.forEach(function(i){ map[i.id] = i; });
    DB.tasks = {
      date: t,
      items: TASK_DEF.map(function(d){
        var old = map[d.id];
        return { id:d.id, cur:0, done:false, late: !!(old && !old.done) };
      })
    };
    if(DB.stats.days.indexOf(t) < 0) DB.stats.days.push(t);
    App.save();
  } else {
    if(DB.stats.days.indexOf(t) < 0){ DB.stats.days.push(t); App.save(); }
  }
};

App.task = function(id){
  for(var i=0;i<DB.tasks.items.length;i++){ if(DB.tasks.items[i].id===id) return DB.tasks.items[i]; }
  return null;
};
App.def = function(id){
  for(var i=0;i<TASK_DEF.length;i++){ if(TASK_DEF[i].id===id) return TASK_DEF[i]; }
  return null;
};
App.bumpTask = function(id, n){
  var t = App.task(id), d = App.def(id);
  if(!t || !d || t.done) { App.renderToday(); return; }
  t.cur += (n||1);
  if(t.cur >= d.target){ t.cur = d.target; t.done = true; App.addStar(3, '完成任务「'+d.label+'」'); }
  App.save(); App.renderToday();
};

App.addStar = function(n, why){
  DB.stars += n;
  App.save(); App.paintStars();
  App.toast('<svg width="20" height="20" viewBox="0 0 24 24" fill="#FFC431" style="vertical-align:-4px"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg> +'+n+' 颗星星！'+(why?'<br><span style="font-size:13px;color:#8B7E9B">'+why+'</span>':''), true);
  App.checkBadges();
};
App.paintStars = function(){
  $('starTop').textContent = DB.stars;
  $('starSide').textContent = DB.stars;
};

App.toast = function(html, win){
  var el = $('toast');
  el.innerHTML = html;
  el.className = win ? 'show win' : 'show';
  clearTimeout(App._tt);
  App._tt = setTimeout(function(){ el.className = ''; }, 2100);
};

App.dialog = function(title, body, btns){
  var h = '<h3>'+title+'</h3>' + (body?'<p>'+body+'</p>':'') + '<div class="dlg-btns">';
  btns.forEach(function(b,i){ h += '<button class="'+b.cls+'" data-i="'+i+'">'+b.txt+'</button>'; });
  h += '</div>';
  $('dlg').innerHTML = h;
  $('mask').className = 'mask on';
  var nodes = $('dlg').querySelectorAll('.dlg-btns button');
  for(var i=0;i<nodes.length;i++){
    (function(node, fn){
      node.onclick = function(){ $('mask').className='mask'; if(fn) fn(); };
    })(nodes[i], btns[i].fn);
  }
};

/* ===== 朗读引擎（Web Speech API） ===== */
var Speech = {
  ok: ('speechSynthesis' in window),
  voices: [],
  init: function(){
    if(!Speech.ok) return;
    var load = function(){ Speech.voices = window.speechSynthesis.getVoices() || []; };
    load();
    if(window.speechSynthesis.onvoiceschanged !== undefined){
      window.speechSynthesis.onvoiceschanged = load;
    }
  },
  pick: function(lang){
    var vs = Speech.voices;
    for(var i=0;i<vs.length;i++){ if(vs[i].lang && vs[i].lang.replace('_','-').toLowerCase().indexOf(lang.toLowerCase())===0) return vs[i]; }
    var p = lang.split('-')[0].toLowerCase();
    for(var j=0;j<vs.length;j++){ if(vs[j].lang && vs[j].lang.toLowerCase().indexOf(p)===0) return vs[j]; }
    return null;
  },
  say: function(text, lang, rate){
    if(!Speech.ok){ App.toast('这个浏览器不支持朗读，换 Chrome / Safari 试试～'); return; }
    try{
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang || 'zh-CN';
      u.rate = rate || 0.85;
      u.pitch = 1.15;
      var v = Speech.pick(u.lang);
      if(v) u.voice = v;
      window.speechSynthesis.speak(u);
    }catch(e){}
  }
};
function flash(el){
  if(!el) return;
  el.classList.add('speaking');
  setTimeout(function(){ el.classList.remove('speaking'); }, 700);
}

/* ===== 导航 ===== */
App.cur = 'letters';
App.buildNav = function(){
  var nav = '', tab = '';
  MODULES.forEach(function(m){
    nav += '<button class="nav-btn '+m.c+'" data-m="'+m.id+'"><span class="nav-ico '+m.c+'">'+m.icon.replace('CUR', m.color)+'</span>'+m.name+'</button>';
    tab += '<button class="tab-btn '+m.c+'" data-m="'+m.id+'"><span class="ti">'+m.icon.replace('CUR','currentColor')+'</span>'+m.name.slice(0,2)+'</button>';
  });
  $('navBox').innerHTML = nav;
  $('tabBox').innerHTML = tab;
  var all = document.querySelectorAll('[data-m]');
  for(var i=0;i<all.length;i++){
    (function(n){ n.onclick = function(){ App.go(n.getAttribute('data-m')); }; })(all[i]);
  }
};
App.go = function(id){
  App.cur = id;
  try{ window.speechSynthesis.cancel(); }catch(e){}
  MODULES.forEach(function(m){
    var v = $('view-'+m.id);
    if(v) v.className = 'view' + (m.id===id ? ' on' : '');
  });
  var btns = document.querySelectorAll('[data-m]');
  for(var i=0;i<btns.length;i++){
    var b = btns[i], on = b.getAttribute('data-m')===id;
    var base = b.classList.contains('tab-btn') ? 'tab-btn ' : 'nav-btn ';
    var mm = MODULES.filter(function(x){return x.id===b.getAttribute('data-m');})[0];
    b.className = base + mm.c + (on ? ' on' : '');
  }
  var m = MODULES.filter(function(x){return x.id===id;})[0];
  $('pageTitle').innerHTML = '<span style="display:inline-flex;width:30px;height:30px;border-radius:10px;align-items:center;justify-content:center;background:'+m.color+'22">'+m.icon.replace('CUR',m.color)+'</span>'+m.name;
  window.scrollTo({top:0, behavior:'smooth'});
};

/* ===== 今日任务渲染 ===== */
App.renderToday = function(){
  var html = '', done = 0;
  DB.tasks.items.forEach(function(t){
    var d = App.def(t.id);
    if(!d) return;
    if(t.done) done++;
    var pct = Math.min(100, Math.round(t.cur / d.target * 100));
    html += '<div class="tk'+(t.done?' done':'')+(t.late&&!t.done?' over':'')+'">'
      + '<span class="tk-dot" style="background:'+d.bg+'">'
      + (t.done
          ? '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4CCB8B" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
          : '<svg width="17" height="17" viewBox="0 0 24 24" fill="'+d.color+'"><circle cx="12" cy="12" r="7"/></svg>')
      + '</span>'
      + '<div class="tk-body"><div class="tk-name">'+d.label
      + (t.late && !t.done ? '<span class="badge-late">昨天没做完</span>' : '')
      + '</div>'
      + (t.done ? '' : '<div class="pbar"><i style="width:'+pct+'%;background:'+d.color+'"></i></div>')
      + '</div>'
      + (t.done
          ? '<span class="tk-ok"><svg width="18" height="18" viewBox="0 0 24 24" fill="#4CCB8B"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg></span>'
          : '<button class="tk-go" data-go="'+d.mod+'">去完成 '+t.cur+'/'+d.target+'</button>')
      + '</div>';
  });
  $('todayList').innerHTML = html;
  $('todayCnt').textContent = done + '/' + DB.tasks.items.length;
  var gs = $('todayList').querySelectorAll('[data-go]');
  for(var i=0;i<gs.length;i++){
    (function(n){ n.onclick = function(){ App.go(n.getAttribute('data-go')); }; })(gs[i]);
  }
  App.checkTip();
};

/* 备份提醒 */
App.checkTip = function(){
  var n = DB.learnedLetters.length + DB.memoPoems.length + DB.stats.mathTotal + DB.stats.logicRight + DB.badges.length;
  if(n >= 30){
    $('backupTip').className = 'tip-bar';
    $('backupTipTxt').textContent = '学习记录已积累 '+n+' 条，建议导出备份一下，换手机也不怕丢～';
  } else {
    $('backupTip').className = 'tip-bar hidden';
  }
};

/* ===== 导出 / 导入 / 清空 ===== */
App.exportData = function(){
  var out = JSON.stringify(DB, null, 2);
  var blob = new Blob([out], {type:'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '宝贝学习乐园-备份-' + today() + '.json';
  document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 300);
  App.toast('备份已下载，收好啦！');
};
App.importData = function(ev){
  var f = ev.target.files && ev.target.files[0];
  if(!f) return;
  var r = new FileReader();
  r.onload = function(){
    try{
      var o = JSON.parse(r.result);
      if(!o || typeof o !== 'object') throw 0;
      DB = o; DB.isDemo = false;
      App.load(); App.save(); App.renderAll();
      App.toast('恢复成功！继续加油～', true);
    }catch(e){ App.toast('文件读不懂，请选择本工作台导出的 JSON'); }
    ev.target.value = '';
  };
  r.readAsText(f);
};
App.askClear = function(){
  App.dialog('确定要清空全部数据吗？', '星星、闯关进度、徽章都会消失，无法找回。建议先点「导出备份」。', [
    {txt:'我再想想', cls:'b-gray'},
    {txt:'先导出备份', cls:'b-purple', fn:App.exportData},
    {txt:'确定清空', cls:'b-red', fn:function(){
      App.dialog('最后确认一次', '真的要全部清空吗？', [
        {txt:'取消', cls:'b-gray'},
        {txt:'确定清空', cls:'b-red', fn:function(){
          localStorage.removeItem(K.data);
          DB = { ver:1, isDemo:false, stars:0, learnedLetters:[], memoPoems:[], levels:{1:0,2:0,3:0,4:0,5:0},
                 badges:[], stats:{mathRight:0,mathTotal:0,logicRight:0,countRight:0,matchRight:0,days:[today()],poemRead:0},
                 tasks:{date:today(), items:TASK_DEF.map(function(d){return {id:d.id,cur:0,done:false,late:false};})} };
          App.save(); App.renderAll();
          App.toast('已清空，从头开始吧！');
        }}
      ]);
    }}
  ]);
};
App.clearDemo = function(){
  App.dialog('清空示例数据？', '会清掉预置的 15 颗星星、已学字母等演示记录，换成全新空白进度。', [
    {txt:'保留', cls:'b-gray'},
    {txt:'清空示例', cls:'b-purple', fn:function(){
      DB.isDemo = false; DB.stars = 0; DB.learnedLetters = []; DB.memoPoems = [];
      DB.levels = {1:0,2:0,3:0,4:0,5:0}; DB.badges = [];
      DB.stats = {mathRight:0,mathTotal:0,logicRight:0,countRight:0,matchRight:0,days:[today()],poemRead:0};
      DB.tasks = {date:today(), items:TASK_DEF.map(function(d){return {id:d.id,cur:0,done:false,late:false};})};
      App.save(); App.renderAll();
      App.toast('示例已清空，全新开始～');
    }}
  ]);
};
/* ================= 模块1：字母乐园 ================= */
var LETTERS = [
  ['A','Apple','苹果'],['B','Bear','小熊'],['C','Cat','小猫'],['D','Dog','小狗'],
  ['E','Egg','鸡蛋'],['F','Fish','小鱼'],['G','Grape','葡萄'],['H','Hat','帽子'],
  ['I','Ice','冰块'],['J','Juice','果汁'],['K','Kite','风筝'],['L','Lion','狮子'],
  ['M','Moon','月亮'],['N','Nose','鼻子'],['O','Orange','橙子'],['P','Panda','熊猫'],
  ['Q','Queen','女王'],['R','Rabbit','兔子'],['S','Sun','太阳'],['T','Tiger','老虎'],
  ['U','Umbrella','雨伞'],['V','Violin','小提琴'],['W','Water','水'],['X','Xylophone','木琴'],
  ['Y','Yellow','黄色'],['Z','Zebra','斑马']
];
var CANDY = [
  {bg:'#FFE3EE', bd:'#FFB6D2', tx:'#E8437F'},
  {bg:'#DCF3FD', bd:'#9BDDF8', tx:'#1B8FC7'},
  {bg:'#FFF3D1', bd:'#FFDC8A', tx:'#C98800'},
  {bg:'#DCF7EA', bd:'#96E6BE', tx:'#219C64'},
  {bg:'#EEE5FF', bd:'#C9B0F7', tx:'#7B47D8'},
  {bg:'#FFE9DC', bd:'#FFC0A0', tx:'#D2661F'}
];

var LT = { mode:'learn', pairs:[], sel:null, okCount:0 };

App.renderLetters = function(){
  var learned = DB.learnedLetters;
  var h = '<div class="seg">'
    + '<button class="'+(LT.mode==='learn'?'on':'')+'" onclick="App.ltMode(\'learn\')">认字母</button>'
    + '<button class="'+(LT.mode==='match'?'on':'')+'" onclick="App.ltMode(\'match\')">大小写配对</button>'
    + '</div>';

  if(LT.mode === 'learn'){
    h += '<div class="card"><div class="card-h">'
      + '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#FF7FB0" stroke-width="2.6" stroke-linecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>'
      + '点一点，听发音'
      + '<span class="sub">已学 '+learned.length+'/26</span></div>'
      + '<div class="pbar" style="margin-bottom:14px"><i style="width:'+Math.round(learned.length/26*100)+'%;background:linear-gradient(90deg,#FF9BC0,#FF6BA6)"></i></div>'
      + '<div class="grid-l">';
    LETTERS.forEach(function(L, i){
      var c = CANDY[i % CANDY.length];
      var on = learned.indexOf(L[0]) >= 0;
      h += '<button class="lcard'+(on?' learned':'')+'" id="lc_'+L[0]+'" style="background:'+c.bg+';border-color:'+c.bd+';color:'+c.tx+'" onclick="App.sayLetter(\''+L[0]+'\')">'
        + '<span class="big">'+L[0]+L[0].toLowerCase()+'</span>'
        + '<span class="wd">'+L[1]+'</span><span class="cn">'+L[2]+'</span></button>';
    });
    h += '</div><div class="center mt"><button class="big-btn bb-pink" onclick="App.sayAllLetters()">从 A 唱到 Z</button></div></div>';
  } else {
    h += '<div class="card"><div class="card-h">'
      + '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#A87FF0" stroke-width="2.6" stroke-linecap="round"><path d="M4 7h6M4 17h6M14 7h6M14 17h6"/><path d="M7 4v6M17 14v6"/></svg>'
      + '把大写和小写连起来<span class="sub">配对 '+LT.okCount+'/5</span></div>'
      + '<p class="center" style="color:var(--muted);font-size:14px;margin:0 0 14px">先点左边的大写字母，再点右边对应的小写字母</p>'
      + '<div class="match-wrap" id="matchWrap"></div>'
      + '<div class="center mt"><button class="big-btn bb-purple" onclick="App.newMatch()">换一批</button></div></div>';
  }
  $('view-letters').innerHTML = h;
  if(LT.mode === 'match'){ if(!LT.pairs.length) App.newMatch(); else App.paintMatch(); }
};

App.ltMode = function(m){ LT.mode = m; if(m==='match'){ LT.pairs=[]; LT.okCount=0; } App.renderLetters(); };

App.sayLetter = function(ch){
  var L = LETTERS.filter(function(x){return x[0]===ch;})[0];
  Speech.say(ch + '. ' + L[1], 'en-US', 0.75);
  flash($('lc_'+ch));
  if(DB.learnedLetters.indexOf(ch) < 0){
    DB.learnedLetters.push(ch);
    App.save();
    App.bumpTask('t_letter', 1);
    App.addStar(1, '认识了字母 '+ch);
    App.renderLetters();
  }
};
App.sayAllLetters = function(){
  Speech.say(LETTERS.map(function(x){return x[0];}).join(' '), 'en-US', 0.7);
};

App.newMatch = function(){
  var pick = shuffle(LETTERS).slice(0,5).map(function(x){return x[0];});
  LT.pairs = pick; LT.sel = null; LT.okCount = 0; LT.matched = [];
  LT.right = shuffle(pick);
  App.renderLetters();
};
App.paintMatch = function(){
  var w = $('matchWrap'); if(!w) return;
  var l = '<div class="mcol">', r = '<div class="mcol">';
  LT.pairs.forEach(function(c){
    var ok = LT.matched.indexOf(c) >= 0;
    l += '<button class="mbtn'+(ok?' ok':'')+(LT.sel===c?' sel':'')+'" id="mL_'+c+'" onclick="App.mPick(\''+c+'\')">'+c+'</button>';
  });
  LT.right.forEach(function(c){
    var ok = LT.matched.indexOf(c) >= 0;
    r += '<button class="mbtn'+(ok?' ok':'')+'" id="mR_'+c+'" onclick="App.mDrop(\''+c+'\')">'+c.toLowerCase()+'</button>';
  });
  w.innerHTML = l + '</div>' + r + '</div>';
};
App.mPick = function(c){
  LT.sel = c;
  Speech.say(c, 'en-US', 0.8);
  App.paintMatch();
};
App.mDrop = function(c){
  if(!LT.sel){ App.toast('先点左边的大写字母哦～'); return; }
  if(LT.sel === c){
    LT.matched.push(c); LT.sel = null; LT.okCount++;
    DB.stats.matchRight = (DB.stats.matchRight||0) + 1;
    App.save();
    App.paintMatch();
    App.addStar(1, '配对成功 '+c+c.toLowerCase());
    if(LT.okCount >= 5){
      setTimeout(function(){
        App.addStar(3, '5 组全部配对成功！');
        App.dialog('太棒啦！全部配对成功', '小手真快，要不要再来一批？', [
          {txt:'休息一下', cls:'b-gray'},
          {txt:'再来一批', cls:'b-purple', fn:App.newMatch}
        ]);
      }, 400);
    } else { App.renderLetters(); }
  } else {
    var el = $('mR_'+c);
    if(el){ el.classList.add('bad'); setTimeout(function(){ el.classList.remove('bad'); }, 400); }
    App.toast('再看看哦，这个不是 '+LT.sel+' 的小写～');
  }
};
/* ================= 模块2：古诗花园 ================= */
var POEMS = [
  {id:'jys', t:'静夜思', tp:'jìng yè sī', a:'唐·李白', c:0, lines:[
    ['床前明月光','chuáng qián míng yuè guāng','，'],
    ['疑是地上霜','yí shì dì shàng shuāng','。'],
    ['举头望明月','jǔ tóu wàng míng yuè','，'],
    ['低头思故乡','dī tóu sī gù xiāng','。']
  ]},
  {id:'ye', t:'咏鹅', tp:'yǒng é', a:'唐·骆宾王', c:1, lines:[
    ['鹅鹅鹅','é é é','，'],
    ['曲项向天歌','qū xiàng xiàng tiān gē','。'],
    ['白毛浮绿水','bái máo fú lǜ shuǐ','，'],
    ['红掌拨清波','hóng zhǎng bō qīng bō','。']
  ]},
  {id:'cx', t:'春晓', tp:'chūn xiǎo', a:'唐·孟浩然', c:2, lines:[
    ['春眠不觉晓','chūn mián bù jué xiǎo','，'],
    ['处处闻啼鸟','chù chù wén tí niǎo','。'],
    ['夜来风雨声','yè lái fēng yǔ shēng','，'],
    ['花落知多少','huā luò zhī duō shǎo','。']
  ]},
  {id:'mn', t:'悯农', tp:'mǐn nóng', a:'唐·李绅', c:3, lines:[
    ['锄禾日当午','chú hé rì dāng wǔ','，'],
    ['汗滴禾下土','hàn dī hé xià tǔ','。'],
    ['谁知盘中餐','shuí zhī pán zhōng cān','，'],
    ['粒粒皆辛苦','lì lì jiē xīn kǔ','。']
  ]},
  {id:'dgql', t:'登鹳雀楼', tp:'dēng guàn què lóu', a:'唐·王之涣', c:4, lines:[
    ['白日依山尽','bái rì yī shān jìn','，'],
    ['黄河入海流','huáng hé rù hǎi liú','。'],
    ['欲穷千里目','yù qióng qiān lǐ mù','，'],
    ['更上一层楼','gèng shàng yī céng lóu','。']
  ]},
  {id:'jx', t:'江雪', tp:'jiāng xuě', a:'唐·柳宗元', c:5, lines:[
    ['千山鸟飞绝','qiān shān niǎo fēi jué','，'],
    ['万径人踪灭','wàn jìng rén zōng miè','。'],
    ['孤舟蓑笠翁','gū zhōu suō lì wēng','，'],
    ['独钓寒江雪','dú diào hán jiāng xuě','。']
  ]},
  {id:'cs', t:'池上', tp:'chí shàng', a:'唐·白居易', c:1, lines:[
    ['小娃撑小艇','xiǎo wá chēng xiǎo tǐng','，'],
    ['偷采白莲回','tōu cǎi bái lián huí','。'],
    ['不解藏踪迹','bù jiě cáng zōng jì','，'],
    ['浮萍一道开','fú píng yí dào kāi','。']
  ]},
  {id:'cj', t:'村居', tp:'cūn jū', a:'清·高鼎', c:3, lines:[
    ['草长莺飞二月天','cǎo zhǎng yīng fēi èr yuè tiān','，'],
    ['拂堤杨柳醉春烟','fú dī yáng liǔ zuì chūn yān','。'],
    ['儿童散学归来早','ér tóng sàn xué guī lái zǎo','，'],
    ['忙趁东风放纸鸢','máng chèn dōng fēng fàng zhǐ yuān','。']
  ]}
];
var PM = { open:null };

function poemFull(p){
  return p.lines.map(function(l){ return l[0] + l[2]; }).join('');
}
App.renderPoems = function(){
  var h = '';
  if(!PM.open){
    h += '<div class="card"><div class="card-h">'
      + '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4CCB8B" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
      + '挑一首古诗读一读<span class="sub">会背 '+DB.memoPoems.length+'/8</span></div>'
      + '<div class="poem-list">';
    POEMS.forEach(function(p){
      var c = CANDY[p.c];
      var memo = DB.memoPoems.indexOf(p.id) >= 0;
      h += '<button class="pcard'+(memo?' memo':'')+'" style="background:'+c.bg+';border-color:'+c.bd+';color:'+c.tx+'" onclick="App.openPoem(\''+p.id+'\')">'
        + '<div class="pt">'+p.t+'</div><div class="pa">'+p.a+'</div>'
        + '<div class="pf">'+p.lines[0][0].slice(0,5)+'…</div></button>';
    });
    h += '</div></div>';
  } else {
    var p = POEMS.filter(function(x){return x.id===PM.open;})[0];
    var c = CANDY[p.c];
    var memo = DB.memoPoems.indexOf(p.id) >= 0;
    h += '<div class="card poem-view" style="background:linear-gradient(170deg,#fff,'+c.bg+')">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">'
      + '<button class="chip" onclick="App.closePoem()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>返回</button>'
      + '<span class="spacer"></span>'
      + (memo ? '<span class="chip" style="background:var(--green-l);border-color:#96E6BE;color:#219C64">已经会背啦</span>' : '')
      + '</div>'
      + '<div style="font-size:12px;color:'+c.tx+';font-weight:700;letter-spacing:1px">'+p.tp+'</div>'
      + '<div style="font-size:26px;font-weight:900;color:'+c.tx+'">'+p.t+'</div>'
      + '<div style="font-size:13px;color:var(--muted);font-weight:700;margin-top:2px">'+p.a+'</div>'
      + '<div class="poem-lines">';
    p.lines.forEach(function(l, i){
      var chars = l[0].split(''), pys = l[1].split(' ');
      var line = '<div class="pline" id="pl_'+i+'" onclick="App.sayLine('+i+')">';
      chars.forEach(function(ch, j){
        line += '<ruby><span class="hz" style="color:'+c.tx+'">'+ch+'</span><rt>'+(pys[j]||'')+'</rt></ruby>';
      });
      line += '<span class="punc" style="color:'+c.tx+'">'+l[2]+'</span></div>';
      h += line;
    });
    h += '</div><div class="row-btns">'
      + '<button class="big-btn bb-green" onclick="App.sayPoem()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" style="vertical-align:-3px"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg> 朗读整首</button>'
      + (memo ? '' : '<button class="big-btn bb-yellow" onclick="App.memoPoem()">我会背啦 +3星</button>')
      + '</div><p style="color:var(--muted);font-size:13px;margin:14px 0 0">点每一句可以单独听哦～</p></div>';
  }
  $('view-poems').innerHTML = h;
};
App.openPoem = function(id){ PM.open = id; App.renderPoems(); window.scrollTo({top:0,behavior:'smooth'}); };
App.closePoem = function(){ PM.open = null; try{window.speechSynthesis.cancel();}catch(e){} App.renderPoems(); };
App.sayLine = function(i){
  var p = POEMS.filter(function(x){return x.id===PM.open;})[0];
  var els = document.querySelectorAll('.pline');
  for(var k=0;k<els.length;k++) els[k].classList.remove('active');
  var el = $('pl_'+i); if(el) el.classList.add('active');
  Speech.say(p.lines[i][0], 'zh-CN', 0.72);
  setTimeout(function(){ if(el) el.classList.remove('active'); }, 2600);
};
App.sayPoem = function(){
  var p = POEMS.filter(function(x){return x.id===PM.open;})[0];
  Speech.say(p.t + '。' + p.a + '。' + poemFull(p), 'zh-CN', 0.72);
  DB.stats.poemRead = (DB.stats.poemRead||0) + 1;
  App.save();
  App.bumpTask('t_poem', 1);
};
App.memoPoem = function(){
  var p = POEMS.filter(function(x){return x.id===PM.open;})[0];
  if(DB.memoPoems.indexOf(p.id) < 0){
    DB.memoPoems.push(p.id);
    App.save();
    App.addStar(3, '《'+p.t+'》会背啦');
    App.bumpTask('t_poem', 1);
    App.renderPoems();
  }
};
/* ================= 模块3：数字王国 ================= */
var CN_NUM = ['零','一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十'];
var EN_NUM = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
var NM = { mode:'know', q:null, locked:false, streak:0, cq:null };

var FRUIT = [
  '<svg width="30" height="30" viewBox="0 0 24 24" fill="#FF6B81"><circle cx="12" cy="14" r="7.4"/><path d="M12 6.6c0-2 1.4-3.4 3.4-3.6-.2 2-1.5 3.3-3.4 3.6z" fill="#4CCB8B"/></svg>',
  '<svg width="30" height="30" viewBox="0 0 24 24" fill="#FFC431"><path d="M12 2.6l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.9 5.9 21.2l1.4-6.8L2.2 9.7l6.9-.8z"/></svg>',
  '<svg width="30" height="30" viewBox="0 0 24 24" fill="#4FC3F7"><circle cx="12" cy="12" r="8.4"/></svg>',
  '<svg width="30" height="30" viewBox="0 0 24 24" fill="#A87FF0"><path d="M12 20.6l-1.4-1.3C5.4 14.6 2 11.6 2 7.9 2 5 4.2 2.9 7 2.9c1.6 0 3.2.8 4 2 .9-1.2 2.4-2 4-2 2.8 0 5 2.1 5 5 0 3.7-3.4 6.7-8.6 11.4z"/></svg>'
];

App.renderNumbers = function(){
  var h = '<div class="seg">'
    + '<button class="'+(NM.mode==='know'?'on':'')+'" onclick="App.nmMode(\'know\')">认数字</button>'
    + '<button class="'+(NM.mode==='math'?'on':'')+'" onclick="App.nmMode(\'math\')">加减法</button>'
    + '<button class="'+(NM.mode==='count'?'on':'')+'" onclick="App.nmMode(\'count\')">数一数</button>'
    + '</div>';

  if(NM.mode === 'know'){
    h += '<div class="card"><div class="card-h">'
      + '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" stroke-width="2.6" stroke-linecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>'
      + '0 到 20，点着读<span class="sub">中文 + 英文</span></div><div class="grid-n">';
    for(var i=0;i<=20;i++){
      var c = CANDY[i % CANDY.length];
      h += '<button class="ncard" id="nc_'+i+'" style="background:'+c.bg+';border-color:'+c.bd+';color:'+c.tx+'" onclick="App.sayNum('+i+')">'
        + '<span class="nn">'+i+'</span><span class="nc">'+CN_NUM[i]+'</span></button>';
    }
    h += '</div></div>';
  }
  else if(NM.mode === 'math'){
    if(!NM.q) NM.q = App.newMath();
    var q = NM.q;
    h += '<div class="card"><div class="card-h">'
      + '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" stroke-width="2.6" stroke-linecap="round"><path d="M4 8h6M7 5v6M14.5 7.5h5M14.5 16.5h5M4.5 17.5l4-4M8.5 17.5l-4-4"/></svg>'
      + '10 以内加减法'
      + '<span class="sub">答对 '+DB.stats.mathRight+' / 共 '+DB.stats.mathTotal+' 题</span></div>'
      + (NM.streak>1 ? '<div class="center" style="margin-bottom:10px"><span class="streak"><svg width="15" height="15" viewBox="0 0 24 24" fill="#FF9455"><path d="M12 2c1 4-3 5-3 9a5 5 0 0 0 10 0c0-1.6-.6-3-1.6-4.2.2 2-1 3.2-2.4 3.2 1.2-3.4-1-6.4-3-8z"/></svg>连对 '+NM.streak+' 题</span></div>' : '')
      + '<div class="qbox"><div class="qtitle">算一算，答案是多少？</div>'
      + '<div class="qmain" style="color:#1B8FC7">'+q.a+' '+q.op+' '+q.b+' = ?</div>'
      + '<div class="opts">';
    q.opts.forEach(function(o, i){
      h += '<button class="opt" id="mo_'+i+'" onclick="App.answerMath('+i+')">'+o+'</button>';
    });
    h += '</div><div class="mt"><button class="chip" onclick="App.skipMath()">换一题</button></div></div></div>';
  }
  else {
    if(!NM.cq) NM.cq = App.newCount();
    var cq = NM.cq;
    h += '<div class="card"><div class="card-h">'
      + '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" stroke-width="2.6" stroke-linecap="round"><circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><circle cx="7" cy="17" r="3"/><circle cx="17" cy="17" r="3"/></svg>'
      + '数一数，有几个？<span class="sub">数对 '+(DB.stats.countRight||0)+' 次</span></div>'
      + '<div class="count-area">';
    for(var k=0;k<cq.n;k++) h += FRUIT[cq.icon];
    h += '</div><div class="opts">';
    cq.opts.forEach(function(o, i){
      h += '<button class="opt" id="co_'+i+'" onclick="App.answerCount('+i+')">'+o+'</button>';
    });
    h += '</div><div class="mt center"><button class="chip" onclick="App.skipCount()">换一题</button></div></div>';
  }
  $('view-numbers').innerHTML = h;
};
App.nmMode = function(m){ NM.mode = m; NM.locked = false; App.renderNumbers(); };

App.sayNum = function(n){
  Speech.say(CN_NUM[n], 'zh-CN', 0.75);
  flash($('nc_'+n));
  setTimeout(function(){ Speech.say(EN_NUM[n], 'en-US', 0.75); }, 900);
};

App.newMath = function(){
  var a, b, op, ans;
  if(rnd(2) === 0){
    a = rnd(9) + 1; b = rnd(10 - a) + 1; op = '+'; ans = a + b;
  } else {
    a = rnd(9) + 2; b = rnd(a - 1) + 1; op = '−'; ans = a - b;
  }
  var set = [ans];
  while(set.length < 4){
    var d = ans + rnd(7) - 3;
    if(d >= 0 && d <= 20 && set.indexOf(d) < 0) set.push(d);
  }
  return { a:a, b:b, op:op, ans:ans, opts:shuffle(set) };
};
App.answerMath = function(i){
  if(NM.locked) return;
  NM.locked = true;
  var q = NM.q, val = q.opts[i], right = (val === q.ans);
  DB.stats.mathTotal++;
  var el = $('mo_'+i);
  if(right){
    DB.stats.mathRight++;
    NM.streak++;
    if(el) el.className = 'opt ok';
    App.save();
    Speech.say(q.a + (q.op==='+'?' 加 ':' 减 ') + q.b + ' 等于 ' + q.ans, 'zh-CN', 0.8);
    App.addStar(1, '算对啦：'+q.a+' '+q.op+' '+q.b+' = '+q.ans);
    App.bumpTask('t_math', 1);
    setTimeout(function(){ NM.q = App.newMath(); NM.locked = false; App.renderNumbers(); }, 1100);
  } else {
    NM.streak = 0;
    if(el) el.className = 'opt no';
    for(var k=0;k<q.opts.length;k++){ if(q.opts[k] === q.ans){ var g = $('mo_'+k); if(g) g.className = 'opt ok'; } }
    App.save();
    App.toast('差一点点，正确答案是 '+q.ans+' 哦～');
    setTimeout(function(){ NM.q = App.newMath(); NM.locked = false; App.renderNumbers(); }, 1500);
  }
};
App.skipMath = function(){ NM.q = App.newMath(); NM.locked = false; App.renderNumbers(); };

App.newCount = function(){
  var n = rnd(9) + 3;
  var set = [n];
  while(set.length < 4){
    var d = n + rnd(5) - 2;
    if(d >= 1 && d <= 20 && set.indexOf(d) < 0) set.push(d);
  }
  return { n:n, icon:rnd(FRUIT.length), opts:shuffle(set) };
};
App.answerCount = function(i){
  if(NM.locked) return;
  NM.locked = true;
  var q = NM.cq, val = q.opts[i], el = $('co_'+i);
  if(val === q.n){
    if(el) el.className = 'opt ok';
    DB.stats.countRight = (DB.stats.countRight||0) + 1;
    App.save();
    Speech.say('一共 ' + CN_NUM[q.n] + ' 个', 'zh-CN', 0.8);
    App.addStar(1, '数对啦，一共 '+q.n+' 个');
    setTimeout(function(){ NM.cq = App.newCount(); NM.locked = false; App.renderNumbers(); }, 1100);
  } else {
    if(el) el.className = 'opt no';
    for(var k=0;k<q.opts.length;k++){ if(q.opts[k] === q.n){ var g = $('co_'+k); if(g) g.className = 'opt ok'; } }
    App.toast('再数一遍试试，一共是 '+q.n+' 个～');
    setTimeout(function(){ NM.cq = App.newCount(); NM.locked = false; App.renderNumbers(); }, 1500);
  }
};
App.skipCount = function(){ NM.cq = App.newCount(); NM.locked = false; App.renderNumbers(); };
/* ================= 模块4：逻辑挑战 ================= */
var SHAPES = ['circle','square','triangle','star','heart'];
var SCOLOR = ['#FF7FB0','#4FC3F7','#FFC431','#4CCB8B','#A87FF0','#FF9455'];
function shapeSvg(type, color, size){
  var s = size || 34, p = '';
  if(type==='circle')        p = '<circle cx="12" cy="12" r="9"/>';
  else if(type==='square')   p = '<rect x="3.4" y="3.4" width="17.2" height="17.2" rx="3.4"/>';
  else if(type==='triangle') p = '<path d="M12 3l9.2 16.4H2.8z"/>';
  else if(type==='star')     p = '<path d="M12 2.4l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.7 5.9 21l1.4-6.8L2.2 9.5l6.9-.8z"/>';
  else                       p = '<path d="M12 20.8l-1.4-1.3C5.3 14.7 2 11.7 2 8a5 5 0 0 1 9-3.1A5 5 0 0 1 20 8c0 3.7-3.3 6.7-8.6 11.5z"/>';
  return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="'+color+'">'+p+'</svg>';
}
var LG = { q:null, locked:false, right:0, total:0 };

App.newLogic = function(){
  var kind = rnd(4);
  var q = { opts:[] };

  if(kind === 0){ /* 图形循环找规律 */
    var pool = shuffle(SHAPES).slice(0, 2 + rnd(2));
    var cols = shuffle(SCOLOR).slice(0, pool.length);
    var seq = [];
    for(var i=0;i<5;i++) seq.push(i % pool.length);
    var nextIdx = 5 % pool.length;
    q.title = '看看排队的规律，问号处应该是哪个？';
    var show = '<div class="shape-row">';
    seq.forEach(function(s){ show += '<div class="shape-box">'+shapeSvg(pool[s], cols[s])+'</div>'; });
    show += '<div class="shape-box q">?</div></div>';
    q.show = show;
    q.opts.push({html: shapeSvg(pool[nextIdx], cols[nextIdx], 32), right:true});
    // 干扰项：循环里的其它图形（保持各自颜色）优先，再用没出现过的图形补足，保证 4 个形状互不相同
    var usedShape = [pool[nextIdx]];
    pool.forEach(function(s, si){
      if(q.opts.length < 4 && usedShape.indexOf(s) < 0){
        usedShape.push(s);
        q.opts.push({html: shapeSvg(s, cols[si], 32), right:false});
      }
    });
    var rest = shuffle(SHAPES.filter(function(s){ return usedShape.indexOf(s) < 0; }));
    var restCol = shuffle(SCOLOR);
    for(var k=0; q.opts.length<4 && k<rest.length; k++){
      q.opts.push({html: shapeSvg(rest[k], restCol[k % restCol.length], 32), right:false});
    }
  }
  else if(kind === 1){ /* 找不同 */
    var pair = shuffle(SHAPES).slice(0,2);
    var c1 = SCOLOR[rnd(SCOLOR.length)];
    var c2 = shuffle(SCOLOR.filter(function(c){return c!==c1;}))[0];
    q.title = '下面 4 个图形里，哪一个和其它的不一样？';
    q.show = '';
    var pos = rnd(4);
    for(var m=0;m<4;m++){
      q.opts.push(m===pos
        ? {html: shapeSvg(pair[1], c2, 32), right:true}
        : {html: shapeSvg(pair[0], c1, 32), right:false});
    }
    q.noShuffle = true;
  }
  else if(kind === 2){ /* 数字规律 */
    var step = [1,2,2,3,5][rnd(5)];
    var start = rnd(4) + 1;
    var arr = [start, start+step, start+step*2, start+step*3];
    var ans = start + step*4;
    q.title = '数字排队走，下一个是几？';
    q.show = '<div class="qmain" style="color:#7B47D8">'+arr.join('、')+'、?</div>';
    var set = [ans];
    while(set.length < 4){
      var d = ans + rnd(7) - 3;
      if(d > 0 && set.indexOf(d) < 0) set.push(d);
    }
    shuffle(set).forEach(function(v){ q.opts.push({html:'<b style="font-size:24px">'+v+'</b>', right:(v===ans)}); });
    q.noShuffle = true;
  }
  else{ /* 比大小 / 排序 */
    var nums = [];
    while(nums.length < 4){ var v = rnd(20) + 1; if(nums.indexOf(v)<0) nums.push(v); }
    var askMax = rnd(2) === 0;
    var target = askMax ? Math.max.apply(null, nums) : Math.min.apply(null, nums);
    q.title = askMax ? '哪个数字最大呀？' : '哪个数字最小呀？';
    q.show = '<div style="color:var(--muted);font-size:15px;font-weight:700;margin-bottom:6px">'+nums.join('　')+'</div>';
    nums.forEach(function(v){ q.opts.push({html:'<b style="font-size:24px">'+v+'</b>', right:(v===target)}); });
    q.noShuffle = true;
  }

  if(!q.noShuffle) q.opts = shuffle(q.opts);
  q.opts = q.opts.slice(0,4);
  return q;
};

App.renderLogic = function(){
  if(!LG.q) LG.q = App.newLogic();
  var q = LG.q;
  var h = '<div class="card"><div class="card-h">'
    + '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#A87FF0" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9.7 18h4.6M10.4 21h3.2"/><path d="M12 3a6 6 0 0 1 3.6 10.8c-.6.5-.9 1.1-.9 1.8v.4H9.3v-.4c0-.7-.3-1.3-.9-1.8A6 6 0 0 1 12 3z"/></svg>'
    + '动动小脑筋<span class="sub">本次答对 '+LG.right+' / '+LG.total+'</span></div>'
    + '<div class="qbox"><div class="qtitle">'+q.title+'</div>'
    + (q.show || '')
    + '<div class="opts" style="margin-top:14px">';
  q.opts.forEach(function(o, i){
    h += '<button class="opt sm" id="lo_'+i+'" onclick="App.answerLogic('+i+')">'+o.html+'</button>';
  });
  h += '</div><div class="mt"><button class="chip" onclick="App.skipLogic()">换一题</button></div></div></div>';
  $('view-logic').innerHTML = h;
};
App.answerLogic = function(i){
  if(LG.locked) return;
  LG.locked = true;
  LG.total++;
  var q = LG.q, el = $('lo_'+i);
  if(q.opts[i].right){
    LG.right++;
    DB.stats.logicRight = (DB.stats.logicRight||0) + 1;
    if(el) el.className = 'opt sm ok';
    App.save();
    App.addStar(2, '逻辑题答对啦');
    App.bumpTask('t_logic', 1);
    setTimeout(function(){ LG.q = App.newLogic(); LG.locked = false; App.renderLogic(); }, 1000);
  } else {
    if(el) el.className = 'opt sm no';
    for(var k=0;k<q.opts.length;k++){ if(q.opts[k].right){ var g = $('lo_'+k); if(g) g.className = 'opt sm ok'; } }
    App.toast('再想想～看看绿色的那个才对哦');
    setTimeout(function(){ LG.q = App.newLogic(); LG.locked = false; App.renderLogic(); }, 1600);
  }
};
App.skipLogic = function(){ LG.q = App.newLogic(); LG.locked = false; App.renderLogic(); };
/* ================= 模块5：闯关冒险 + 徽章墙 ================= */
var LEVELS = [
  {n:1, name:'字母启程', desc:'26 个字母', kind:'letter', c:0},
  {n:2, name:'数字小径', desc:'10 以内算术', kind:'math',   c:1},
  {n:3, name:'古诗小桥', desc:'背诗接龙',   kind:'poem',   c:3},
  {n:4, name:'逻辑森林', desc:'动脑筋',     kind:'logic',  c:4},
  {n:5, name:'智慧城堡', desc:'全部混合',   kind:'mix',    c:2}
];
var BADGES = [
  {id:'first',  name:'初来乍到', desc:'打开乐园',      chk:function(){return true;}},
  {id:'abc10',  name:'字母小达人', desc:'认识10个字母', chk:function(){return DB.learnedLetters.length>=10;}},
  {id:'abc26',  name:'字母全通关', desc:'26个全认识',   chk:function(){return DB.learnedLetters.length>=26;}},
  {id:'poem3',  name:'古诗小才子', desc:'会背3首诗',    chk:function(){return DB.memoPoems.length>=3;}},
  {id:'poem8',  name:'诗词小状元', desc:'8首全会背',    chk:function(){return DB.memoPoems.length>=8;}},
  {id:'math20', name:'算术小超人', desc:'算对20道题',   chk:function(){return DB.stats.mathRight>=20;}},
  {id:'logic10',name:'逻辑小天才', desc:'逻辑对10题',   chk:function(){return (DB.stats.logicRight||0)>=10;}},
  {id:'lv3',    name:'闯关小勇士', desc:'通过第3关',    chk:function(){return (DB.levels[3]||0)>0;}},
  {id:'lv5',    name:'城堡征服者', desc:'通关全部5关',  chk:function(){return (DB.levels[5]||0)>0;}},
  {id:'star50', name:'星光闪闪',   desc:'攒够50颗星',   chk:function(){return DB.stars>=50;}},
  {id:'star150',name:'超级明星',   desc:'攒够150颗星',  chk:function(){return DB.stars>=150;}},
  {id:'day3',   name:'坚持之星',   desc:'学习满3天',    chk:function(){return DB.stats.days.length>=3;}}
];
var BICON = '<svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>';

var AV = { lv:null, idx:0, qs:[], right:0, locked:false, over:false };

App.checkBadges = function(){
  var got = [];
  BADGES.forEach(function(b){
    if(DB.badges.indexOf(b.id) < 0 && b.chk()){ DB.badges.push(b.id); got.push(b); }
  });
  if(got.length){
    App.save();
    setTimeout(function(){
      App.dialog('解锁新徽章！',
        got.map(function(b){return '「'+b.name+'」—— '+b.desc;}).join('<br>'),
        [{txt:'去徽章墙看看', cls:'b-purple', fn:function(){ App.go('adventure'); App.renderAdventure(); }},
         {txt:'知道啦', cls:'b-gray'}]);
    }, 800);
    if(App.cur === 'adventure') App.renderAdventure();
  }
};

/* --- 出题机 --- */
function qLetter(){
  var L = LETTERS[rnd(26)];
  var mode = rnd(2);
  var q = {opts:[]};
  if(mode === 0){
    q.title = '这个小写字母，大写长什么样？';
    q.show = '<div class="qmain" style="color:#E8437F">'+L[0].toLowerCase()+'</div>';
    var wrong = shuffle(LETTERS.filter(function(x){return x[0]!==L[0];})).slice(0,3);
    q.opts.push({html:'<b style="font-size:26px">'+L[0]+'</b>', right:true});
    wrong.forEach(function(w){ q.opts.push({html:'<b style="font-size:26px">'+w[0]+'</b>', right:false}); });
  } else {
    q.title = '「'+L[2]+'」的英文，是哪个字母开头？';
    q.show = '<div class="qmain" style="color:#E8437F;font-size:26px">'+L[1]+'</div>';
    var wr = shuffle(LETTERS.filter(function(x){return x[0]!==L[0];})).slice(0,3);
    q.opts.push({html:'<b style="font-size:26px">'+L[0]+'</b>', right:true});
    wr.forEach(function(w){ q.opts.push({html:'<b style="font-size:26px">'+w[0]+'</b>', right:false}); });
  }
  q.opts = shuffle(q.opts);
  q.speak = {t:L[1], l:'en-US'};
  return q;
}
function qMath(){
  var m = App.newMath(), q = {opts:[]};
  q.title = '算一算，等于几？';
  q.show = '<div class="qmain" style="color:#1B8FC7">'+m.a+' '+m.op+' '+m.b+' = ?</div>';
  m.opts.forEach(function(v){ q.opts.push({html:'<b style="font-size:24px">'+v+'</b>', right:(v===m.ans)}); });
  return q;
}
function qPoem(){
  var p = POEMS[rnd(POEMS.length)];
  var i = rnd(p.lines.length - 1);
  var q = {opts:[], title:'下一句是什么呀？'};
  q.show = '<div style="font-size:13px;color:var(--muted);font-weight:700">《'+p.t+'》</div>'
         + '<div class="qmain" style="color:#219C64;font-size:28px">'+p.lines[i][0]+p.lines[i][2]+'</div>';
  var right = p.lines[i+1][0];
  var pool = [];
  POEMS.forEach(function(o){ o.lines.forEach(function(l){ if(l[0] !== right) pool.push(l[0]); }); });
  q.opts.push({html:'<span style="font-size:16px;font-weight:800">'+right+'</span>', right:true});
  shuffle(pool).slice(0,3).forEach(function(t){
    q.opts.push({html:'<span style="font-size:16px;font-weight:800">'+t+'</span>', right:false});
  });
  q.opts = shuffle(q.opts);
  q.speak = {t:p.lines[i][0], l:'zh-CN'};
  return q;
}
function qLogic(){ var q = App.newLogic(); return q; }
function qCount(){
  var c = App.newCount(), q = {opts:[], title:'数一数，一共有几个？'};
  var s = '<div class="count-area" style="max-width:340px">';
  for(var i=0;i<c.n;i++) s += FRUIT[c.icon];
  s += '</div>';
  q.show = s;
  c.opts.forEach(function(v){ q.opts.push({html:'<b style="font-size:24px">'+v+'</b>', right:(v===c.n)}); });
  return q;
}
function genQuestions(kind, n){
  var out = [];
  for(var i=0;i<n;i++){
    var k = kind;
    if(kind === 'mix') k = ['letter','math','poem','logic','count'][rnd(5)];
    if(k === 'letter')      out.push(qLetter());
    else if(k === 'math')   out.push(rnd(3)===0 ? qCount() : qMath());
    else if(k === 'poem')   out.push(qPoem());
    else if(k === 'logic')  out.push(qLogic());
    else                    out.push(qCount());
  }
  return out;
}

App.renderAdventure = function(){
  var h = '';
  if(AV.lv === null){
    /* 关卡地图 */
    h += '<div class="card"><div class="card-h">'
      + '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#FFAE22" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20V6l6-3 6 3 6-3v14l-6 3-6-3-6 3z"/><path d="M9 3v14M15 6v14"/></svg>'
      + '闯关地图<span class="sub">每关 5 题，答对 3 题即可通关</span></div><div class="lv-grid">';
    LEVELS.forEach(function(L, i){
      var got = DB.levels[L.n] || 0;
      var prev = i === 0 ? 1 : (DB.levels[LEVELS[i-1].n] || 0);
      var lock = prev === 0;
      var c = CANDY[L.c];
      var stars = '';
      for(var s=1;s<=3;s++){
        stars += '<svg width="16" height="16" viewBox="0 0 24 24" fill="'+(s<=got?'#FFC431':'#DDD3E2')+'"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>';
      }
      h += '<button class="lv'+(lock?' lock':'')+'" '
        + (lock ? '' : 'style="background:'+c.bg+';border-color:'+c.bd+';color:'+c.tx+'" onclick="App.startLevel('+L.n+')"')
        + '>'
        + (lock
            ? '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B7ACC0" stroke-width="2.6"><rect x="4" y="10.5" width="16" height="10.5" rx="2.6"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>'
            : '<div style="font-size:22px;font-weight:900">第 '+L.n+' 关</div>')
        + '<div class="lvn">'+L.name+'</div><div class="lvd">'+L.desc+'</div>'
        + (lock ? '<div class="lvd">先过上一关</div>' : '<div class="lv-stars">'+stars+'</div>')
        + '</button>';
    });
    h += '</div></div>';

    /* 徽章墙 */
    h += '<div class="card"><div class="card-h">'
      + '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#FFAE22" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="M8.2 14.2L7 22l5-2.6L17 22l-1.2-7.8"/></svg>'
      + '我的成就徽章墙<span class="sub">已获得 '+DB.badges.length+'/'+BADGES.length+'</span></div><div class="badges">';
    BADGES.forEach(function(b){
      var got = DB.badges.indexOf(b.id) >= 0;
      h += '<div class="bdg'+(got?' got':'')+'"><div class="bi">'+BICON.replace('#fff', got?'#fff':'#B7ACC0')+'</div>'
        + '<div class="bn">'+b.name+'</div><div class="bd">'+b.desc+'</div></div>';
    });
    h += '</div></div>';

    if(DB.isDemo){
      h += '<div class="center" style="margin:6px 0 20px"><button class="chip" onclick="App.clearDemo()">清空示例数据，从零开始</button></div>';
    }
  }
  else if(!AV.over){
    /* 答题中 */
    var L = LEVELS[AV.lv - 1], c = CANDY[L.c], q = AV.qs[AV.idx];
    var dots = '';
    for(var i=0;i<AV.qs.length;i++){
      dots += '<span style="display:inline-block;width:11px;height:11px;border-radius:50%;margin:0 3px;background:'+(i<AV.idx?'#4CCB8B':(i===AV.idx?c.tx:'#E6DEEA'))+'"></span>';
    }
    h += '<div class="card" style="background:linear-gradient(170deg,#fff,'+c.bg+')">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'
      + '<button class="chip" onclick="App.quitLevel()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>退出</button>'
      + '<span style="font-weight:900;font-size:17px;color:'+c.tx+'">第 '+L.n+' 关 · '+L.name+'</span>'
      + '<span class="spacer"></span><span class="chip gold">答对 '+AV.right+'</span></div>'
      + '<div class="center" style="margin-bottom:6px">'+dots+'</div>'
      + '<div class="qbox"><div class="qtitle">第 '+(AV.idx+1)+' / '+AV.qs.length+' 题 · '+q.title+'</div>'
      + (q.show || '') + '<div class="opts" style="margin-top:12px">';
    q.opts.forEach(function(o, i){
      h += '<button class="opt sm" id="ao_'+i+'" onclick="App.answerAdv('+i+')">'+o.html+'</button>';
    });
    h += '</div></div></div>';
  }
  else {
    /* 结算 */
    var L2 = LEVELS[AV.lv - 1], c2 = CANDY[L2.c];
    var got = AV.right >= 5 ? 3 : (AV.right === 4 ? 2 : (AV.right >= 3 ? 1 : 0));
    var stars2 = '';
    for(var s2=1;s2<=3;s2++){
      stars2 += '<svg width="44" height="44" viewBox="0 0 24 24" fill="'+(s2<=got?'#FFC431':'#E4DCE8')+'"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>';
    }
    h += '<div class="card center" style="background:linear-gradient(170deg,#fff,'+c2.bg+')">'
      + '<div style="font-size:23px;font-weight:900;color:'+c2.tx+';margin-bottom:4px">'
      + (got>0 ? '通关成功！' : '差一点点～') + '</div>'
      + '<div style="color:var(--muted);font-weight:700;margin-bottom:12px">第 '+L2.n+' 关 · '+L2.name+'　答对 '+AV.right+' / '+AV.qs.length+' 题</div>'
      + '<div style="margin:10px 0 18px">'+stars2+'</div>'
      + '<div class="row-btns">'
      + '<button class="big-btn bb-purple" onclick="App.startLevel('+AV.lv+')">再玩一次</button>'
      + (got>0 && AV.lv<5 ? '<button class="big-btn bb-yellow" onclick="App.startLevel('+(AV.lv+1)+')">挑战下一关</button>' : '')
      + '<button class="big-btn bb-green" onclick="App.quitLevel()">回到地图</button>'
      + '</div></div>';
  }
  $('view-adventure').innerHTML = h;
};

App.startLevel = function(n){
  var L = LEVELS[n-1];
  AV = { lv:n, idx:0, qs:genQuestions(L.kind, 5), right:0, locked:false, over:false };
  App.renderAdventure();
  window.scrollTo({top:0, behavior:'smooth'});
};
App.quitLevel = function(){ AV.lv = null; AV.over = false; App.renderAdventure(); };
App.answerAdv = function(i){
  if(AV.locked) return;
  AV.locked = true;
  var q = AV.qs[AV.idx], el = $('ao_'+i);
  if(q.opts[i].right){
    AV.right++;
    if(el) el.className = 'opt sm ok';
    if(q.speak) Speech.say(q.speak.t, q.speak.l, 0.78);
  } else {
    if(el) el.className = 'opt sm no';
    for(var k=0;k<q.opts.length;k++){ if(q.opts[k].right){ var g = $('ao_'+k); if(g) g.className = 'opt sm ok'; } }
  }
  setTimeout(function(){
    AV.locked = false;
    if(AV.idx < AV.qs.length - 1){ AV.idx++; App.renderAdventure(); }
    else { App.finishLevel(); }
  }, q.opts[i].right ? 850 : 1500);
};
App.finishLevel = function(){
  AV.over = true;
  var got = AV.right >= 5 ? 3 : (AV.right === 4 ? 2 : (AV.right >= 3 ? 1 : 0));
  var old = DB.levels[AV.lv] || 0;
  if(got > old){ DB.levels[AV.lv] = got; }
  App.save();
  App.renderAdventure();
  if(got > 0){
    App.bumpTask('t_adv', 1);
    App.addStar(got * 4, '第 '+AV.lv+' 关拿到 '+got+' 颗星');
  } else {
    App.toast('再试一次就能过关啦，加油！');
  }
  App.checkBadges();
};
/* ================= 启动 ================= */
App.renderAll = function(){
  App.paintStars();
  App.renderToday();
  App.renderLetters();
  App.renderPoems();
  App.renderNumbers();
  App.renderLogic();
  App.renderAdventure();
};

(function boot(){
  Speech.init();
  App.load();
  App.buildNav();
  App.renderAll();
  App.go('letters');
  App.checkBadges();
  // iOS 需要用户手势后才允许朗读，首次点击时唤醒一下语音引擎
  var wake = function(){
    if(Speech.ok){
      try{
        var u = new SpeechSynthesisUtterance(' ');
        u.volume = 0; window.speechSynthesis.speak(u);
      }catch(e){}
    }
    document.removeEventListener('touchstart', wake);
    document.removeEventListener('click', wake);
  };
  document.addEventListener('touchstart', wake, {passive:true});
  document.addEventListener('click', wake);
  // 跨天自动顺延
  setInterval(function(){
    if(DB.tasks.date !== today()){ App.rollTasks(); App.renderToday(); }
  }, 60000);
})();
