'use strict';
/* NovaLearn AI — core: helpers, storage, state, i18n helpers, icons */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));

/* ---------- storage (device-local; falls back to memory when blocked) ---------- */
let memStore={},storageOK=true;
function lsGet(k){try{return window.localStorage.getItem(k)}catch(e){storageOK=false;return Object.prototype.hasOwnProperty.call(memStore,k)?memStore[k]:null}}
function lsSet(k,v){try{window.localStorage.setItem(k,v)}catch(e){storageOK=false;memStore[k]=v}}
function lsDel(k){try{window.localStorage.removeItem(k)}catch(e){storageOK=false;delete memStore[k]}}

/* ---------- state ---------- */
const KEY='novalearn.v1';
const DASH_IDS=['continue','progress','spark','rewards','syncs'];
const DASH_ESSENTIAL=['continue'];
function defaults(){return{
  v:1,user:null,returnTo:'',
  prefs:{lang:'ar',theme:'auto',accent:'sky',density:'comfortable',textScale:100,motion:'auto',lowData:false,numerals:'auto',cardStyle:'grid',
    notif:{learning:true,announcements:true,system:true},dash:{order:DASH_IDS.slice(),hidden:[]},dialect:false},
  progress:{lessons:{},quiz:{},labs:{},ex:{}},
  drafts:{},queue:[],
  server:{processed:{},xp:0,coins:0,lessons:{},quiz:{},labs:{}},
  notifs:[],companion:{mode:'guide',msgs:[]},community:[],
  ui:{collapsed:false,annDismissed:false,spark:{}},audit:[]
}}
function loadState(){
  let s=null;
  try{const raw=lsGet(KEY);if(raw)s=JSON.parse(raw)}catch(e){s=null}
  const d=defaults();
  if(!s||typeof s!=='object')return d;
  for(const k of Object.keys(d)){
    if(s[k]===undefined)s[k]=d[k];
    else if(d[k]&&typeof d[k]==='object'&&!Array.isArray(d[k])&&s[k]&&typeof s[k]==='object')s[k]=Object.assign({},d[k],s[k]);
  }
  s.prefs.notif=Object.assign({},d.prefs.notif,s.prefs.notif||{});
  s.prefs.dash=Object.assign({},d.prefs.dash,s.prefs.dash||{});
  DASH_IDS.forEach(id=>{if(!s.prefs.dash.order.includes(id))s.prefs.dash.order.push(id)});
  return s;
}
let ST=loadState();
function save(){lsSet(KEY,JSON.stringify(ST))}

/* ---------- preferences -> document ---------- */
function applyPrefs(){
  const p=ST.prefs,r=document.documentElement;
  r.lang=p.lang;r.dir=p.lang==='ar'?'rtl':'ltr';
  if(p.theme==='auto')r.removeAttribute('data-nl-theme');else r.setAttribute('data-nl-theme',p.theme);
  r.setAttribute('data-accent',p.accent);
  r.setAttribute('data-density',p.density);
  r.setAttribute('data-motion',p.motion==='reduce'?'reduce':'auto');
  r.setAttribute('data-lowdata',p.lowData?'1':'0');
  r.style.setProperty('--ts',String(p.textScale/100));
}

/* ---------- i18n helpers (strings live in strings.js) ---------- */
const lang=()=>ST.prefs.lang;
function t(k,p){
  const e=STR[k];
  if(!e)return k;
  let s=(lang()==='ar'?e[1]:e[0])||e[0];
  if(p)s=s.replace(/\{(\w+)\}/g,(m,x)=>p[x]==null?'':p[x]);
  return s;
}
const T=(k,p)=>esc(t(k,p));
const L=o=>o?(o[lang()]||o.en||''):'';
const LE=o=>esc(L(o));
const numLocale=()=>(lang()==='ar'?'ar':'en')+(ST.prefs.numerals==='latin'?'-u-nu-latn':'');
function nf(n,o){try{return new Intl.NumberFormat(numLocale(),o).format(n)}catch(e){return String(n)}}
const pctf=n=>nf(Math.round(n)/100,{style:'percent',maximumFractionDigits:0});
function fmtDate(ts,withTime){
  try{return new Intl.DateTimeFormat(numLocale(),withTime?{dateStyle:'medium',timeStyle:'short'}:{dateStyle:'medium'}).format(ts)}
  catch(e){return new Date(ts).toLocaleString()}
}

/* ---------- icons (line style, one stroke weight) ---------- */
const ICONS={
home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
book:'<path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M4 16a4 4 0 0 1 4-4h10"/>',
layers:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
flask:'<path d="M9 3h6"/><path d="M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7.5 15h9"/>',
badge:'<circle cx="12" cy="9" r="5"/><path d="M8.5 13.5L7 21l5-3 5 3-1.5-7.5"/>',
users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14a6.5 6.5 0 0 1 3.5 6"/>',
bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21h4"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
sync:'<path d="M20 7a8 8 0 0 0-14-2L4 7"/><path d="M4 3v4h4"/><path d="M4 17a8 8 0 0 0 14 2l2-2"/><path d="M20 21v-4h-4"/>',
shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
close:'<path d="M6 6l12 12M18 6L6 18"/>',
chevron:'<path d="M9 5l7 7-7 7"/>',
arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
alert:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
xcircle:'<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
wifi:'<path d="M2.5 9a14 14 0 0 1 19 0"/><path d="M5.5 12.5a9.5 9.5 0 0 1 13 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><path d="M12 19.5v.5"/>',
wifiOff:'<path d="M3 3l18 18"/><path d="M8.5 16a5 5 0 0 1 5-1.3"/><path d="M5.5 12.5a9.5 9.5 0 0 1 4-2.4"/><path d="M12 19.5v.5"/>',
spark:'<path d="M12 3c.8 4.6 2.4 6.2 7 7-4.6.8-6.2 2.4-7 7-.8-4.6-2.4-6.2-7-7 4.6-.8 6.2-2.4 7-7z"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>',
moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
auto:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
search:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
send:'<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>',
mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
up:'<path d="M6 15l6-6 6 6"/>',
down:'<path d="M6 9l6 6 6-6"/>',
eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
eyeOff:'<path d="M3 3l18 18"/><path d="M10.5 6.2A9.5 9.5 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.7M6.3 7.8C3.8 9.6 2 12 2 12s4 7 10 7c1.2 0 2.3-.2 3.3-.6"/>',
trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
code:'<path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',
logout:'<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>',
grid:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
list:'<path d="M9 6h11M9 12h11M9 18h11M4 6h.5M4 12h.5M4 18h.5"/>',
scroll:'<rect x="3" y="7" width="7" height="10" rx="1.5"/><rect x="12" y="7" width="7" height="10" rx="1.5"/><path d="M21 9v6"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
chart:'<path d="M4 20V4M4 20h16M8 16v-5M13 16V8M18 16v-8"/>',
help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17v.5"/>',
star:'<path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17l-5.6 3 1.3-6.2L3 9.5l6.3-.7z"/>',
dots:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
stop:'<rect x="6" y="6" width="12" height="12" rx="2"/>',
refresh:'<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/>'
};
function icon(n,size,cls){
  return '<svg class="ic'+(cls?' '+cls:'')+'" width="'+(size||20)+'" height="'+(size||20)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(ICONS[n]||'')+'</svg>';
}
/* Nova shape semantics: oval=learning/content, circle=AI/help, sq=tools/settings, nova=signature moments */
function shape(kind,ic,size){return '<span class="shp shp-'+kind+'" aria-hidden="true">'+icon(ic,size||22)+'</span>'}
function logo(size){
  const s=size||34;
  return '<svg class="ic" width="'+s+'" height="'+s+'" viewBox="0 0 40 40" role="img" aria-label="NovaLearn AI"><path d="M20 3c9 2 15 9 15 17 0 9-7 16-15 17C11 36 5 29 5 20 5 11 11 4 20 3z" fill="var(--primary)"/><path d="M20 11c.9 5 2.6 6.6 7.5 7.5-4.9.9-6.6 2.6-7.5 7.5-.9-4.9-2.6-6.6-7.5-7.5 4.9-.9 6.6-2.5 7.5-7.5z" fill="var(--on-primary)"/></svg>';
}
function chip(kind,ic,text){return '<span class="chip '+kind+'">'+icon(ic,16)+'<span>'+esc(text)+'</span></span>'}
function bar(p,label,cls){
  const v=clamp(Math.round(p),0,100);
  return '<div class="barwrap"><div class="bar '+(cls||'')+'" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+v+'" aria-label="'+esc(label)+'"><i style="width:'+v+'%"></i></div><span class="bar-txt">'+pctf(v)+'</span></div>';
}
function alertBox(kind,ic,html,role){return '<div class="alert '+kind+'"'+(role?' role="'+role+'"':'')+'>'+icon(ic,20)+'<div class="grow">'+html+'</div></div>'}
function sw(act,arg,on,labelId){
  return '<button type="button" class="sw" role="switch" aria-checked="'+(on?'true':'false')+'" aria-labelledby="'+labelId+'" data-act="'+act+'" data-a="'+esc(arg||'')+'"></button><span class="sw-state" aria-hidden="true">'+t(on?'on':'off')+'</span>';
}
