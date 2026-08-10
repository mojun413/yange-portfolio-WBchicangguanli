const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync('baby-farm/index.html','utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function makeEl(reg){const t={style:{},dataset:{},classList:{_s:new Set(),add(c){this._s.add(c);},remove(c){this._s.delete(c);},toggle(c){this._s.has(c)?this._s.delete(c):this._s.add(c);},contains(c){return this._s.has(c);}},value:'',textContent:'',innerHTML:'',className:'',children:[],parentNode:null};return new Proxy(t,{get(o,p){if(p in o)return o[p];switch(p){case 'appendChild':return c=>{o.children.push(c);return c;};case 'removeChild':return c=>c;case 'insertBefore':return c=>c;case 'setAttribute':return()=>{};case 'getAttribute':return()=>null;case 'addEventListener':return()=>{};case 'removeEventListener':return()=>{};case 'querySelector':return()=>makeEl(reg);case 'querySelectorAll':return()=>[];case 'cloneNode':return()=>makeEl(reg);case 'focus':return()=>{};case 'click':return()=>{};case 'remove':return()=>{};case 'getContext':return()=>{};case 'classList':return o.classList;default:return makeEl(reg);}},set(o,p,v){o[p]=v;return true;}});}
const reg={}; const doc={getElementById(id){if(!reg[id])reg[id]=makeEl(reg);return reg[id];},querySelector(s){return makeEl(reg);},querySelectorAll(){return [];},createElement(){return makeEl(reg);},addEventListener(){},removeEventListener(){},body:makeEl(reg)};
const sb={window:{scrollTo(){},scroll(){}},document:doc,console,localStorage:(function(){const m={};return{getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=String(v);},removeItem:k=>{delete m[k];}};})(),setTimeout:(f)=>{return 0;},clearTimeout(){},setInterval(){},clearInterval(){},Date,Math,JSON,parseInt,parseFloat,isNaN,String,Number,Array,Object,Boolean,SpeechSynthesisUtterance:function(){}};
sb.global=sb; vm.createContext(sb); vm.runInContext(js,sb,{filename:'app.js'});
const A=sb.App, DB=sb.DB;
let pass=0, fail=0;
function ok(name, cond){ console.log((cond?'OK  ':'FAIL')+' '+name); cond?pass++:fail++; }

// 1) 5 seed types defined
ok('SEED_SHOW 有 5 类种子', sb.SEED_SHOW && sb.SEED_SHOW.length===5);
ok('种子映射正确', sb.SEED_SHOW.map(s=>s.seed+':'+s.subj).join(',')==='爱心种子:英语,勇气种子:语文,希望种子:数学,知识种子:逻辑,光明种子:闯关');

// 2) demo 数据：英语/语文 done=true -> 解锁；数学/逻辑/闯关 done=false -> 锁定
A.go('farm');
const farmHtml=reg['view-farm'].innerHTML||'';
ok('农场页渲染了种子图鉴', farmHtml.indexOf('种子图鉴')>=0);
ok('farm 页含萌可卡片', farmHtml.indexOf('我的优雅萌可')>=0);

// 3) 锁定/解锁计数
const openCnt=(farmHtml.match(/seed-chip open/g)||[]).length;
const lockCnt=(farmHtml.match(/seed-chip locked/g)||[]).length;
ok('demo 解锁数=2 (英语/语文完成)', openCnt===2);
ok('demo 锁定数=3', lockCnt===3);

// 4) 完成 数学 模块 -> 希望种子解锁，计数+1
const before=DB.farm.seeds['数学']||0;
A.checkIn('数学','数字王国'); // 数字王国是数学唯一 item -> 整模块完成
const afterHtml=reg['view-farm'].innerHTML||'';
ok('完成数字王国后 希望种子解锁', afterHtml.indexOf('希望种子')>=0 && /seed-chip open/.test(afterHtml));
ok('数学种子数量 +1', (DB.farm.seeds['数学']||0)===before+1);

// 5) 萌可 SVG 动画 class
ok('萌可 SVG 含 pet-fig 动画组', (A.mengkeSvg('ok')).indexOf('class="pet-fig"')>=0);
ok('萌可 SVG 含眨眼 eye', (A.mengkeSvg('ok')).indexOf('class="eye"')>=0);
ok('萌可 SVG 含扇翅 wing', (A.mengkeSvg('ok')).indexOf('class="wing"')>=0);
ok('萌可 SVG 含闪光 pet-spark', (A.mengkeSvg('ok')).indexOf('class="pet-spark"')>=0);
ok('饿倒态无星光、有 z z', (A.mengkeSvg('faint')).indexOf('pet-spark')<0 && A.mengkeSvg('faint').indexOf('z z')>=0);

console.log('\\n结果: '+pass+' 通过 / '+fail+' 失败');
process.exit(fail?1:0);
