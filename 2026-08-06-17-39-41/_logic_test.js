const fs=require('fs');
const vm=require('vm');
const html=fs.readFileSync('baby-farm/index.html','utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];

function makeEl(reg){const t={style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},value:'',textContent:'',innerHTML:'',className:'',children:[],parentNode:null};return new Proxy(t,{get(o,p){if(p in o)return o[p];switch(p){case 'appendChild':return c=>{o.children.push(c);return c;};case 'removeChild':return c=>c;case 'insertBefore':return c=>c;case 'setAttribute':return()=>{};case 'getAttribute':return()=>null;case 'addEventListener':return()=>{};case 'removeEventListener':return()=>{};case 'querySelector':return()=>makeEl(reg);case 'querySelectorAll':return()=>[];case 'cloneNode':return()=>makeEl(reg);case 'focus':return()=>{};case 'click':return()=>{};case 'remove':return()=>{};case 'getContext':return()=>{};default:return makeEl(reg);}},set(o,p,v){o[p]=v;return true;}});}
const reg={};
const doc={getElementById(id){if(!reg[id])reg[id]=makeEl(reg);return reg[id];},querySelector(){return makeEl(reg);},querySelectorAll(){return [];},createElement(){return makeEl(reg);},addEventListener(){},removeEventListener(){},body:makeEl(reg)};
const sb={window:{scrollTo(){},scroll(){}},document:doc,console,
  localStorage:(function(){const m={};return{getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=String(v);},removeItem:k=>{delete m[k];}};})(),
  setTimeout:(f)=>{ if(typeof f==='function'){ try{f();}catch(e){} } return 0; }, clearTimeout(){}, setInterval(){}, clearInterval(){},
  Date, Math, JSON, parseInt, parseFloat, isNaN, String, Number, Array, Object, Boolean,
  SpeechSynthesisUtterance:function(){}};
sb.global=sb; vm.createContext(sb); vm.runInContext(js,sb,{filename:'app.js'});
const A=sb.App, DB=sb.DB;

// ---- logic: 6 correct -> checkIn + jump ----
A.go('homework'); A.hwSwitch('logic');
let jumped=false; const origSwitch=A.hwSwitch;
A.hwSwitch=function(id){ if(id==='adventure') jumped=true; return origSwitch(id); };
for(let i=0;i<6;i++){ const q=sb.LG.q; const ci=q.opts.findIndex(o=>o.right); A.answerLogic(ci); }
console.log('logic 打卡完成 =', DB.homework.subj['逻辑'].items['逻辑挑战']===true, '| 跳转闯关 =', jumped===true);

// ---- math wrong -> dialog ----
A.go('homework'); A.hwSwitch('numbers'); A.nmMode('math'); sb.NM.mathCount=0;
let dlgText=''; A.dialog=function(t,b){ dlgText=t+'|'+b; };
const q=sb.NM.q; const wi=q.opts.findIndex(v=>v!==q.ans);   // 数学选项是数字，比较值
A.answerMath(wi);
console.log('math 答错弹窗含[答错啦] =', /答错啦/.test(dlgText), '| 弹窗显示正确答案 =', /正确答案是/.test(dlgText));

// ---- math 8 correct -> count mode ----
A.go('homework'); A.hwSwitch('numbers'); A.nmMode('math'); sb.NM.mathCount=0;
let toCount=false; const origMode=A.nmMode; A.nmMode=function(m){ if(m==='count') toCount=true; return origMode(m); };
let guard=0;
while(sb.NM.mathCount<8 && sb.NM.q && guard++<20){ const qq=sb.NM.q; const ci=qq.opts.indexOf(qq.ans); A.answerMath(ci); }
console.log('math 8题后跳转数一数 =', toCount===true, '| mathCount重置 =', sb.NM.mathCount===0);

// ---- badges count ----
const cnt=(js.slice(js.indexOf('var BADGES = ['), js.indexOf('];', js.indexOf('var BADGES = ['))).match(/id:'/g)||[]).length;
console.log('BADGES 数量 =', cnt, cnt===24?'OK':'FAIL');
