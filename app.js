'use strict';
/* NovaLearn AI — app: router, shell, overlays, Companion UI, events, boot */

/* ---------- routing ---------- */
const PUBLIC=['auth'];
const ADMIN_ONLY=['admin'];
function parseHash(){
  const h=(location.hash||'').replace(/^#/,'');
  if(!h)return{name:'home',args:[]};
  const p=h.split('-');
  return{name:p[0],args:p.slice(1)};
}
function navigate(h){if(location.hash==='#'+h)route();else location.hash='#'+h}
function titleOf(r){
  const m={home:'nav_home',tracks:'nav_tracks',labs:'nav_labs',passport:'nav_passport',community:'nav_community',notifications:'nav_notifications',prefs:'nav_prefs',sync:'nav_sync',admin:'nav_admin',system:'nav_system'};
  if(m[r.name])return t(m[r.name]);
  if((r.name==='course'||r.name==='quiz')&&COURSES[r.args[0]])return L(COURSES[r.args[0]].title);
  if(r.name==='lesson'&&COURSES[r.args[0]]){const l=COURSES[r.args[0]].lessons[(+r.args[1]||1)-1];if(l)return L(l.title)}
  if(r.name==='lab'&&LABS[r.args[0]])return L(LABS[r.args[0]].title);
  return t('nf_title');
}
function routeView(){
  const r=R;
  if(r.name==='admin'&&(!ST.user||ST.user.role!=='admin'))return viewForbidden();
  switch(r.name){
    case'home':return viewHome();
    case'tracks':return viewTracks();
    case'course':return viewCourse(r.args[0]);
    case'lesson':return viewLesson(r.args[0],r.args[1]);
    case'quiz':return viewQuiz(r.args[0]);
    case'labs':return viewLabs();
    case'lab':return viewLab(r.args[0]);
    case'passport':return viewPassport();
    case'community':return viewCommunity();
    case'notifications':return viewNotifications();
    case'prefs':return viewPrefs();
    case'sync':return viewSync();
    case'admin':return viewAdmin();
    case'system':return viewSystem();
    case'auth':return null;
    default:return viewNotFound();
  }
}
function route(){
  R=parseHash();
  if(!ST.user&&!PUBLIC.includes(R.name)){
    ST.returnTo=location.hash.replace(/^#/,'');save();
    if(location.hash!=='#auth'){location.replace('#auth');return}
    R={name:'auth',args:[]};
  }
  if(ST.user&&R.name==='auth'){navigate('home');return}
  renderAll();
  const h=$('#h1')||$('#main');
  if(h){try{h.focus({preventScroll:true})}catch(e){}}
  window.scrollTo(0,0);
  announce(titleOf(R));
}

/* ---------- shell ---------- */
const NAV=[
  {id:'home',ic:'home',k:'nav_home',g:'main'},{id:'tracks',ic:'book',k:'nav_tracks',g:'main'},{id:'labs',ic:'flask',k:'nav_labs',g:'main'},
  {id:'passport',ic:'badge',k:'nav_passport',g:'main'},{id:'community',ic:'users',k:'nav_community',g:'more'},
  {id:'notifications',ic:'bell',k:'nav_notifications',g:'more',count:1},{id:'sync',ic:'sync',k:'nav_sync',g:'more'},{id:'prefs',ic:'gear',k:'nav_prefs',g:'more'},
  {id:'system',ic:'layers',k:'nav_system',g:'more'},{id:'admin',ic:'shield',k:'nav_admin',g:'admin',admin:1}
];
function section(){
  const n=R.name;
  if(['course','lesson','quiz'].includes(n))return'tracks';
  if(n==='lab')return'labs';
  return n;
}
function navItems(group){
  return NAV.filter(x=>x.g===group&&(!x.admin||(ST.user&&ST.user.role==='admin'))).map(x=>{
    const cnt=x.count?unreadCount():0;
    const cur=section()===x.id;
    return `<li><a class="nl" href="#${x.id}"${cur?' aria-current="page"':''} data-close="1">${icon(x.ic,22)}<span class="lbl">${T(x.k)}</span>${cnt?`<span class="cnt" aria-label="${esc(t('unread_n',{n:nf(cnt)}))}">${nf(cnt)}</span>`:''}</a></li>`;
  }).join('');
}
function navBlock(){
  const adm=navItems('admin');
  return `<nav aria-label="${T('nav_main')}"><ul class="navlist"><li class="nav-h" aria-hidden="true">${T('nav_learn')}</li>${navItems('main')}<li class="nav-h" aria-hidden="true">${T('nav_more')}</li>${navItems('more')}${adm?`<li class="nav-h" aria-hidden="true">${T('nav_admin_h')}</li>${adm}`:''}</ul></nav>`;
}
function langBtn(){
  return `<button type="button" class="btn btn-secondary btn-sm" data-act="pref-lang" data-a="${lang()==='ar'?'en':'ar'}" lang="${lang()==='ar'?'en':'ar'}" aria-label="${esc(t('switch_lang'))}">${icon('globe',18)}<span>${lang()==='ar'?'English':'العربية'}</span></button>`;
}
function themeBtn(){
  const cur=ST.prefs.theme,nx=cur==='auto'?'light':cur==='light'?'dark':'auto';
  return `<button type="button" class="btn btn-secondary btn-icon" data-act="pref-theme" data-a="${nx}" aria-label="${esc(t('theme_cycle',{cur:t('th_'+cur),next:t('th_'+nx)}))}">${icon(cur==='auto'?'auto':cur==='light'?'sun':'moon',20)}</button>`;
}
function renderStatus(){
  const el=$('#statusbar');if(!el)return;
  const n=netState(),q=queueStats();
  let kind='',msg='',ic='info';
  if(n==='offline'){kind='warn';ic='wifiOff';msg=t('bn_offline')+(q.open?' '+t('bn_pending',{n:nf(q.open)}):'')}
  else if(n==='weak'){kind='info';ic='wifi';msg=t('bn_weak')}
  else if(q.failed){kind='err';ic='alert';msg=t('bn_failed',{n:nf(q.failed)})}
  else if(q.syncing){kind='info';ic='sync';msg=t('bn_syncing')}
  else if(q.open){kind='warn';ic='clock';msg=t('bn_pending',{n:nf(q.open)})}
  if(!msg){el.innerHTML='';return}
  const act=(q.failed||q.blocked)?`<button type="button" class="btn btn-text btn-sm" data-act="op-retry">${T('retry_failed')}</button>`:`<a class="btn btn-text btn-sm" href="#sync">${T('nav_sync')}</a>`;
  el.innerHTML=`<div class="banner"><div class="alert ${kind}">${icon(ic,20)}<div class="grow">${esc(msg)}</div>${act}</div></div>`;
}
function announcementBar(){
  if(ST.ui.annDismissed)return'';
  return `<div class="banner"><div class="alert info">${icon('bell',20)}<div class="grow"><p class="bold">${T('ann_t')}</p><p>${T('ann_b')}</p></div><button type="button" class="btn btn-text btn-icon" data-act="ann-dismiss" aria-label="${T('dismiss')}">${icon('close',20)}</button></div></div>`;
}
function renderShell(){
  if(!$('#app'))return;
  if(R.name==='auth')return;
  const sb=$('#sb'),bn=$('#bn');
  if(sb)sb.innerHTML=`<a class="brand" href="#home">${logo(36)}<span class="bt"><b>NovaLearn AI</b><small>Ignite Your Potential</small></span></a>${navBlock()}
    <div class="sb-foot stack-s"><button type="button" class="nl" data-act="sb-collapse" aria-expanded="${!ST.ui.collapsed}" aria-label="${esc(t(ST.ui.collapsed?'sb_expand':'sb_collapse'))}">${icon('menu',22)}<span class="lbl">${T(ST.ui.collapsed?'sb_expand':'sb_collapse')}</span></button>
    <button type="button" class="nl" data-act="signout">${icon('logout',22)}<span class="lbl">${T('sign_out')}</span></button></div>`;
  if(bn){
    const it=(id,ic,k)=>`<li><a href="#${id}"${section()===id?' aria-current="page"':''}>${icon(ic,24)}<span>${T(k)}</span></a></li>`;
    bn.innerHTML=`<nav aria-label="${T('nav_main')}"><ul>${it('home','home','nav_home')}${it('tracks','book','nav_tracks')}${it('labs','flask','nav_labs')}${it('passport','badge','nav_passport')}<li><button type="button" data-act="drawer-open" aria-haspopup="dialog">${icon('menu',24)}<span>${T('nav_menu')}</span></button></li></ul></nav>`;
  }
  const top=$('#top');
  if(top)top.innerHTML=`<button type="button" class="btn btn-secondary btn-icon show-sm" data-act="drawer-open" aria-label="${T('nav_menu')}" aria-haspopup="dialog">${icon('menu',20)}</button>
    <span class="title">${esc(titleOf(R))}</span>${connChip()}
    <a class="btn btn-secondary btn-icon" href="#notifications" aria-label="${esc(t('nav_notifications')+(unreadCount()?' ('+t('unread_n',{n:nf(unreadCount())})+')':''))}">${icon('bell',20)}${unreadCount()?`<span class="cnt" style="position:absolute;margin-inline-start:1.4rem;margin-top:-1.4rem;background:var(--accent);color:var(--on-accent);border-radius:999px;padding:0 .35rem;font-size:.7rem" aria-hidden="true">${nf(unreadCount())}</span>`:''}</a>
    <span class="hide-sm row nowrap">${langBtn()}${themeBtn()}</span>`;
  const ab=$('#annbar');if(ab)ab.innerHTML=announcementBar();
  renderStatus();
}
function renderAll(){
  const root=$('#app');
  applyPrefs();
  document.title=(R.name==='auth'?t('sign_in'):titleOf(R))+' · NovaLearn AI';
  if(R.name==='auth'){root.className='';root.innerHTML=viewAuth();$('#companion').innerHTML='';return}
  const v=routeView();
  root.className='app'+(ST.ui.collapsed?' collapsed':'');
  root.innerHTML=`<aside class="sb" id="sb"></aside><div class="col"><header class="top" id="top"></header><div id="annbar"></div><div id="statusbar"></div>
  <main class="main" id="main" tabindex="-1">${v}</main>
  <footer class="foot"><p>${T('foot_demo')}</p><p>${T('foot_ds')}</p></footer></div><div class="bn" id="bn"></div>`;
  renderShell();
  renderCompanion();
}
function refreshLive(){
  /* refresh status-dependent views without stealing focus */
  const a=document.activeElement;
  if(['sync','passport','home','course','quiz','lab','lesson'].includes(R.name)&&!(a&&(a.tagName==='TEXTAREA'||a.tagName==='INPUT'||a.tagName==='SELECT'))&&!$('.ov')){
    const m=$('#main');if(m){const y=window.scrollY;m.innerHTML=routeView();window.scrollTo(0,y)}
  }
  renderShell();
}
function rerenderMain(keepFocus){
  const m=$('#main');if(!m||R.name==='auth')return;
  const a=document.activeElement,id=a&&a.id,act=a&&a.getAttribute&&a.getAttribute('data-act'),da=a&&a.getAttribute&&a.getAttribute('data-a');
  const y=window.scrollY;
  m.innerHTML=routeView();renderShell();window.scrollTo(0,y);
  if(keepFocus){
    let el=id?document.getElementById(id):null;
    if(!el&&act)el=document.querySelector('#main [data-act="'+act+'"][data-a="'+(da||'')+'"]');
    if(el)try{el.focus({preventScroll:true})}catch(e){}
  }
}

/* ---------- toast / modal / drawer ---------- */
function toast(msg,kind){
  const box=$('#toasts');if(!box)return;
  const el=document.createElement('div');
  el.className='toast';el.setAttribute('role',kind==='err'?'alert':'status');
  el.innerHTML=`${icon(kind==='ok'?'check':kind==='warn'||kind==='err'?'alert':'info',20)}<span class="grow">${esc(msg)}</span><button type="button" class="btn btn-text" aria-label="${esc(t('dismiss'))}">${icon('close',18)}</button>`;
  el.querySelector('button').addEventListener('click',()=>el.remove());
  box.appendChild(el);
  while(box.children.length>3)box.firstChild.remove();
  setTimeout(()=>{el.remove()},kind==='err'?9000:5500);
}
let modalReturn=null;
function modal(o){
  closeModal(true);
  modalReturn=document.activeElement;
  const ov=document.createElement('div');ov.className='ov';ov.id='modal';
  ov.innerHTML=`<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-t"${o.desc?' aria-describedby="dlg-d"':''}><h2 id="dlg-t">${esc(o.title)}</h2>${o.desc?`<div id="dlg-d">${o.desc}</div>`:''}${o.body||''}<div class="acts">${(o.actions||[]).map((a,i)=>`<button type="button" class="btn ${a.cls||'btn-secondary'}" data-mi="${i}">${esc(a.label)}</button>`).join('')}</div></div>`;
  document.body.appendChild(ov);
  const root=$('#appwrap');if(root)root.setAttribute('inert','');
  ov.addEventListener('click',e=>{
    if(e.target===ov&&!o.persistent){closeModal()}
    const b=e.target.closest('[data-mi]');
    if(b){const a=o.actions[+b.getAttribute('data-mi')];if(a.keep!==true)closeModal();if(a.fn)a.fn()}
  });
  ov.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!o.persistent){e.preventDefault();closeModal()}
    if(e.key==='Tab'){
      const f=$$('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',ov).filter(x=>!x.disabled);
      if(!f.length)return;
      const a=f[0],z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
      else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
    }
  });
  const first=$('[data-focus]',ov)||$('.acts button:last-child',ov)||$('button',ov);
  if(first)first.focus();
  return ov;
}
function closeModal(silent){
  const m=$('#modal');if(m)m.remove();
  const root=$('#appwrap');if(root)root.removeAttribute('inert');
  if(!silent&&modalReturn&&document.contains(modalReturn))try{modalReturn.focus()}catch(e){}
  if(!silent)modalReturn=null;
}
function confirmBox(title,text,okLabel,fn,danger){
  modal({title:title,desc:`<p>${esc(text)}</p>`,actions:[{label:t('cancel')},{label:okLabel,cls:danger?'btn-danger':'btn-primary',fn:fn}]});
}
let drawerReturn=null;
function openDrawer(){
  closeDrawer(true);
  drawerReturn=document.activeElement;
  const wrap=document.createElement('div');wrap.id='drawerwrap';
  wrap.innerHTML=`<div class="dov" data-act="drawer-close"></div><div class="drawer" role="dialog" aria-modal="true" aria-label="${esc(t('nav_menu'))}"><div class="row between"><a class="brand" href="#home" data-close="1">${logo(32)}<b>NovaLearn AI</b></a><button type="button" class="btn btn-secondary btn-icon" data-act="drawer-close" aria-label="${T('close')}">${icon('close',20)}</button></div>${navBlock()}
  <div class="row">${langBtn()}${themeBtn()}</div><button type="button" class="nl" data-act="signout">${icon('logout',22)}<span>${T('sign_out')}</span></button></div>`;
  document.body.appendChild(wrap);
  $('#appwrap').setAttribute('inert','');
  wrap.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();closeDrawer()}
    if(e.key==='Tab'){
      const f=$$('button,[href]',wrap);const a=f[0],z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
      else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
    }
  });
  const c=$('.drawer button',wrap);if(c)c.focus();
}
function closeDrawer(silent){
  const w=$('#drawerwrap');if(w)w.remove();
  const root=$('#appwrap');if(root&&!$('#modal'))root.removeAttribute('inert');
  if(!silent&&drawerReturn&&document.contains(drawerReturn))try{drawerReturn.focus()}catch(e){}
}

/* ---------- Nova Companion panel ---------- */
let cpOpen=false;
function voiceStatus(){
  const s=voice.state;
  const m={off:['neutral','mic','vs_off'],requesting:['info','mic','vs_requesting'],ready:['ok','mic','vs_ready'],denied:['err','alert','vs_denied'],unsupported:['warn','alert','vs_unsupported']}[s]||['neutral','mic','vs_off'];
  return chip(m[0],m[1],t(m[2]));
}
function renderCompanion(){
  const box=$('#companion');if(!box)return;
  if(!ST.user||R.name==='auth'){box.innerHTML='';return}
  const mode=ST.companion.mode,msgs=ST.companion.msgs;
  const chips=['cpq_1','cpq_2','cpq_3'];
  const panel=cpOpen?`<section class="cp" role="dialog" aria-modal="false" aria-labelledby="cp-t" id="cp-panel">
    <div class="cp-h">${shape('nova','spark',20)}<div class="grow"><b id="cp-t">${T('cp_title')}</b><div class="xs muted">${T('cp_ai_label')}</div></div>
      <button type="button" class="btn btn-secondary btn-icon" data-act="cp-new" aria-label="${T('cp_new')}">${icon('refresh',18)}</button>
      <button type="button" class="btn btn-secondary btn-icon" data-act="cp-min" aria-label="${T('cp_min')}">${icon('down',18)}</button></div>
    <div class="cp-modes"><div class="seg" role="group" aria-label="${T('cp_modes')}">${['teacher','guide','partner'].map(m=>`<button type="button" data-act="cp-mode" data-a="${m}" aria-pressed="${mode===m}">${T('cpm_'+m)}</button>`).join('')}</div><p class="cp-note">${T('cpm_'+mode+'_d')}</p></div>
    <div class="cp-log" id="cp-log" role="log" aria-live="polite" aria-label="${T('cp_log')}">${msgs.length?msgs.map(m=>`<div class="msg ${m.who}"${m.who==='ai'?` lang="${m.lang||lang()}"`:''}>${esc(m.text)}${m.who==='ai'?`<small>${T('cp_ai_tag')}</small>`:''}</div>`).join(''):`<div class="msg ai">${T('cp_welcome')}<small>${T('cp_ai_tag')}</small></div>`}</div>
    <div class="cp-chips">${chips.map(k=>`<button type="button" class="btn btn-secondary" data-act="cp-chip" data-a="${k}">${T(k)}</button>`).join('')}</div>
    <div class="cp-f"><form data-form="cp" novalidate><div class="field grow"><label class="sr" for="cp-in">${T('cp_input')}</label><textarea id="cp-in" rows="1" placeholder="${esc(t('cp_input'))}" maxlength="400" data-inp="cp-draft">${esc(ST.drafts.cp||'')}</textarea></div><button type="submit" class="btn btn-primary btn-icon" aria-label="${T('cp_send')}">${icon('send',20,'flip')}</button></form>
      <div class="vstate">${voiceStatus()}<button type="button" class="btn btn-secondary btn-sm" data-act="cp-voice"${voice.state==='requesting'||voice.state==='ready'?' disabled':''}>${icon('mic',16)}${T(voice.state==='denied'?'cp_voice_retry':'cp_voice')}</button></div>
      <p class="cp-note">${T('cp_voice_note')}</p><p class="cp-note">${T('cp_privacy')}</p></div></section>`:'';
  box.innerHTML=panel+`<button type="button" class="fab" data-act="cp-toggle" aria-expanded="${cpOpen}" aria-controls="cp-panel">${shape('nova','spark',20)}<span class="hide-sm">${T('cp_title')}</span><span class="sr show-sm-sr">${T('cp_title')}</span></button>`;
  const log=$('#cp-log');if(log)log.scrollTop=log.scrollHeight;
}
function companionSend(text){
  text=String(text||'').trim();if(!text)return;
  ST.companion.msgs.push({who:'me',text:text});
  ST.drafts.cp='';
  const reply=companionReply(text);
  const isDia=ST.prefs.dialect&&lang()==='ar';
  ST.companion.msgs.push({who:'ai',text:reply,lang:lang()});
  ST.companion.msgs=ST.companion.msgs.slice(-40);save();
  renderCompanion();
  const ta=$('#cp-in');if(ta)ta.focus();
  if(isDia)announce(t('dialect_ann'));
}

/* ---------- event handling ---------- */
function setPref(k,v){
  ST.prefs[k]=v;save();applyPrefs();
}
function pickAccent(a){setPref('accent',a)}
function afterPref(){renderAll();const m=$('#main');if(!m)return}
function handleAct(act,a,el,ev){
  switch(act){
    /* prefs */
    case'pref-lang':{if(!lock('lang',400))return;setPref('lang',a);renderAll();toast(t('toast_lang'),'ok');return}
    case'pref-theme':setPref('theme',a);renderAll();return;
    case'pref-accent':setPref('accent',a);rerenderMain(true);return;
    case'pref-density':setPref('density',a);rerenderMain(true);return;
    case'pref-text':setPref('textScale',+a);rerenderMain(true);return;
    case'pref-motion':setPref('motion',ST.prefs.motion==='reduce'?'auto':'reduce');rerenderMain(true);return;
    case'pref-low':setPref('lowData',!ST.prefs.lowData);rerenderMain(true);return;
    case'pref-dialect':setPref('dialect',!ST.prefs.dialect);rerenderMain(true);if(ST.prefs.dialect&&lang()!=='ar')toast(t('dialect_only_ar'),'info');return;
    case'pref-notif':ST.prefs.notif[a]=!ST.prefs.notif[a];save();rerenderMain(true);return;
    case'pref-reset':confirmBox(t('reset_prefs'),t('reset_prefs_q'),t('reset'),()=>{const d=defaults().prefs;d.lang=ST.prefs.lang;ST.prefs=d;save();renderAll();toast(t('toast_reset'),'ok')});return;
    case'style-set':setPref('cardStyle',a);rerenderMain(true);return;
    case'net-mode':setNetMode(a);rerenderMain(true);return;
    /* shell */
    case'sb-collapse':ST.ui.collapsed=!ST.ui.collapsed;save();renderAll();{const b=$('[data-act="sb-collapse"]');if(b)b.focus()}return;
    case'drawer-open':openDrawer();return;
    case'drawer-close':closeDrawer();return;
    case'ann-dismiss':ST.ui.annDismissed=true;save();renderShell();return;
    case'signout':doSignOut();return;
    /* dashboard */
    case'dash-custom':ui.custom=!ui.custom;rerenderMain(true);return;
    case'dash-move':{const p=a.split(':'),id=p[0],d=+p[1],o=ST.prefs.dash.order,i=o.indexOf(id),j=i+d;if(j<0||j>=o.length)return;o.splice(i,1);o.splice(j,0,id);save();rerenderMain(true);announce(t('moved'));return}
    case'dash-hide':{const h=ST.prefs.dash.hidden,i=h.indexOf(a);if(i>=0)h.splice(i,1);else h.push(a);save();rerenderMain(true);return}
    case'dash-reset':ST.prefs.dash=defaults().prefs.dash;save();rerenderMain(true);toast(t('toast_reset'),'ok');return;
    case'spark-answer':{const s=sparkToday();if(ST.ui.spark[s.day]!=null)return;ST.ui.spark[s.day]=+a;save();rerenderMain();return}
    /* learning */
    case'ex-check':{
      const p=a.split(':'),l=COURSES[p[0]].lessons[+p[1]];
      const val=($('#ex-in')||{}).value||'';
      const ok=l.ex.re.test(val);
      const fb=$('#ex-fb');
      if(!val.trim()){fb.innerHTML=alertBox('warn','alert',`<p>${T('ex_empty')}</p>`,'alert');return}
      if(ok){ST.progress.ex[l.id]=true;save()}
      fb.innerHTML=alertBox(ok?'ok':'info',ok?'check':'info',`<p class="bold">${T(ok?'ex_match':'ex_nomatch')}</p><p>${LE(ok?l.ex.ok:l.ex.hint)}</p>`,'status');
      return}
    case'lesson-complete':{
      if(!lock('lc'+a,1200))return;
      const p=a.split(':'),c=COURSES[p[0]],l=c.lessons[+p[1]];
      if(ST.progress.lessons[l.id])return;
      const op=enqueue('lesson',{cid:p[0],lid:l.id});
      ST.progress.lessons[l.id]={ts:Date.now(),op:op.id};save();
      toast(netState()==='offline'?t('toast_saved_offline'):t('toast_saved_local'),'ok');
      rerenderMain();const h=$('#h1');if(h)h.focus();return}
    case'quiz-retry':ui.qmode[a]='take';delete ui.qerr[a];ST.drafts['q:'+a]=[];save();rerenderMain();{const h=$('#h1');if(h)h.focus()}return;
    case'lab-reset':{
      const lb=LABS[a];
      confirmBox(t('reset_work'),t('reset_work_q'),t('reset'),()=>{delete ST.drafts['l:'+a];save();rerenderMain()},true);
      return}
    /* sync */
    case'sync-now':syncNow();toast(t('toast_syncing'),'info');return;
    case'op-retry':retryFailed();return;
    case'sync-clear-done':ST.queue=ST.queue.filter(o=>o.status!=='done');save();rerenderMain(true);return;
    /* data controls */
    case'data-export':{
      const data=JSON.stringify({exported:new Date().toISOString(),note:'NovaLearn AI demo data stored on this device',user:ST.user&&{name:ST.user.name,email:ST.user.email},prefs:ST.prefs,progress:ST.progress,queue:ST.queue.map(o=>({type:o.type,status:o.status,created:o.created}))},null,2);
      modal({title:t('export_data'),desc:`<p>${T('export_desc')}</p>`,body:`<div class="field"><label for="exp-t">${T('export_label')}</label><textarea id="exp-t" class="code" readonly data-focus>${esc(data)}</textarea></div>`,actions:[{label:t('close')},{label:t('copy'),cls:'btn-primary',keep:true,fn:()=>{const ta=$('#exp-t');ta.select();(navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(data):Promise.reject()).then(()=>toast(t('toast_copied'),'ok')).catch(()=>toast(t('toast_copy_manual'),'info'))}}]});
      return}
    case'data-delete':{
      const q=queueStats();
      modal({title:t('delete_data'),desc:`<p>${T('delete_q')}</p>${q.open?alertBox('warn','alert',`<p class="bold">${T('delete_unsynced',{n:nf(q.open)})}</p>`):''}`,body:`<div class="field"><label for="del-c">${T('delete_type')}</label><input type="text" id="del-c" autocomplete="off" data-focus></div>`,
        actions:[{label:t('cancel')},{label:t('delete_confirm'),cls:'btn-danger',keep:true,fn:()=>{
          const v=($('#del-c')||{}).value||'';
          if(v.trim().toUpperCase()!==t('delete_word').toUpperCase()){toast(t('delete_mismatch'),'err');return}
          lsDel(KEY);ST=defaults();closeModal(true);applyPrefs();location.hash='#auth';route();toast(t('toast_deleted'),'ok');}}]});
      return}
    /* community, notifications */
    case'community-del':ST.community=ST.community.filter(p=>p.id!==a);save();rerenderMain();toast(t('toast_post_deleted'),'ok');return;
    case'notif-filter':ui.notif=a;rerenderMain(true);return;
    case'notif-read':{const n=ST.notifs.find(x=>x.id===a);if(n)n.read=true;save();rerenderMain();return}
    case'notif-readall':ST.notifs.forEach(n=>{n.read=true});save();rerenderMain();return;
    /* admin */
    case'admin-tab':ui.adminTab=a;rerenderMain(true);return;
    case'admin-sort':{const s=ui.adminSort;if(s.k===a)s.d=-s.d;else{s.k=a;s.d=1}ui.adminPage=1;rerenderMain(true);return}
    case'admin-page':ui.adminPage=+a;rerenderMain(true);return;
    /* auth */
    case'auth-tab':ui.authTab=a;ui.authErr={};renderAll();{const b=$('#tab-'+a);if(b)b.focus()}return;
    case'pw-toggle':{ui.pw=!ui.pw;const keep=($('#au-pw')||{}).value;saveAuthVals();renderAll();const i=$('#au-pw');if(i){i.value=keep||'';}const b=$('[data-act="pw-toggle"]');if(b)b.focus();return}
    case'auth-forgot':modal({title:t('forgot'),desc:`<p>${T('forgot_text')}</p>`,actions:[{label:t('close'),cls:'btn-primary'}]});return;
    case'auth-demo':demoSignIn(a);return;
    /* design system demos */
    case'demo-toast':toast(t('ds_toast_msg'),'ok');return;
    case'demo-modal':confirmBox(t('ds_modal_t'),t('ds_modal_b'),t('ds_modal_ok'),()=>toast(t('ds_modal_done'),'ok'),true);return;
    /* companion */
    case'cp-toggle':cpOpen=!cpOpen;renderCompanion();if(cpOpen){const t2=$('#cp-in');if(t2)t2.focus()}else{const f=$('.fab');if(f)f.focus()}return;
    case'cp-min':cpOpen=false;renderCompanion();{const f=$('.fab');if(f)f.focus()}return;
    case'cp-new':ST.companion.msgs=[];save();renderCompanion();return;
    case'cp-mode':ST.companion.mode=a;save();renderCompanion();return;
    case'cp-chip':companionSend(t(a));return;
    case'cp-voice':requestVoice();return;
  }
}
function saveAuthVals(){ui.authVals={name:($('#au-name')||{}).value||'',email:($('#au-email')||{}).value||''}}

/* ---------- auth (demo only: no real authentication in this build) ---------- */
function hashPw(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;return h.toString(36)}
function signIn(user){
  ST.user=user;ST.ui.annDismissed=false;
  if(!ST.notifs.length){
    notify('account','n_welcome_t','n_welcome_b',{name:user.name});
    notify('announcements','n_ann_t','n_ann_b',{});
  }
  audit('signin',user.role);
  const back=ST.returnTo&&!PUBLIC.includes(ST.returnTo.split('-')[0])?ST.returnTo:'home';
  ST.returnTo='';save();
  ui.authBusy=false;ui.authErr={};ui.authVals=null;
  navigate(back);
  toast(t('toast_signed_in',{name:user.name}),'ok');
}
function demoSignIn(kind){
  const u=kind==='admin'?{name:lang()==='ar'?'مشرف تجريبي':'Demo Admin',email:'admin@demo.local',role:'admin'}:{name:lang()==='ar'?'متعلم تجريبي':'Demo Learner',email:'learner@demo.local',role:'learner'};
  signIn(u);
}
function submitAuth(){
  if(ui.authBusy)return;
  const create=ui.authTab==='up';
  const name=($('#au-name')||{}).value||'',email=(($('#au-email')||{}).value||'').trim(),pw=($('#au-pw')||{}).value||'';
  const err={};
  if(create&&name.trim().length<2)err.name=t('e_name');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))err.email=t('e_email');
  if(create?pw.length<8:pw.length<1)err.pw=create?t('e_pw_new'):t('e_pw');
  ui.authVals={name:name,email:email};
  if(Object.keys(err).length){
    ui.authErr=err;renderAll();
    const first=err.name?'au-name':err.email?'au-email':'au-pw';
    const f=document.getElementById(first);if(f)f.focus();
    return;
  }
  ui.authErr={};ui.authBusy=true;renderAll();
  setTimeout(()=>{
    const accts=JSON.parse(lsGet('novalearn.accts')||'{}');
    const key=email.toLowerCase();
    if(create){
      accts[key]={name:name.trim(),h:hashPw(pw)};lsSet('novalearn.accts',JSON.stringify(accts));
      signIn({name:name.trim(),email:email,role:'learner'});
    }else{
      const a=accts[key];
      if(!a||a.h!==hashPw(pw)){
        ui.authBusy=false;ui.authErr={pw:t('e_creds')};renderAll();
        const f=$('#au-pw');if(f)f.focus();return;
      }
      signIn({name:a.name,email:email,role:'learner'});
    }
  },500);
}
function doSignOut(){
  const q=queueStats();
  const go=()=>{audit('signout','');ST.user=null;save();cpOpen=false;closeDrawer(true);navigate('auth');toast(t('toast_signed_out'),'info')};
  if(q.open){
    modal({title:t('sign_out'),desc:`<p>${T('signout_unsynced',{n:nf(q.open)})}</p><p class="small muted">${T('signout_shared')}</p>`,actions:[{label:t('cancel')},{label:t('sign_out'),cls:'btn-danger',fn:go}]});
  }else go();
}

/* ---------- form submit handlers ---------- */
function onSubmit(ev){
  const f=ev.target.closest('form[data-form]');if(!f)return;
  ev.preventDefault();
  const kind=f.getAttribute('data-form'),a=f.getAttribute('data-a');
  if(kind==='auth')return submitAuth();
  if(kind==='cp'){return companionSend(($('#cp-in')||{}).value)}
  if(kind==='post'){
    const v=(($('#cm-text')||{}).value||'').trim();
    if(!v){ui.cmErr=true;rerenderMain();const x=$('#cm-text');if(x)x.focus();return}
    if(!lock('post',800))return;
    ui.cmErr=false;ST.community.unshift({id:uid(),who:ST.user.name,text:v,ts:Date.now()});ST.drafts.post='';save();rerenderMain();toast(t('toast_posted'),'ok');return;
  }
  if(kind==='quiz'){
    if(!lock('quiz'+a,1500))return;
    const c=COURSES[a],d=ST.drafts['q:'+a]||[];
    if(c.quiz.some((q,i)=>d[i]==null)){ui.qerr[a]=true;rerenderMain();const e=$('#q-err');if(e)e.scrollIntoView({block:'center'});return}
    delete ui.qerr[a];
    const answers=c.quiz.map((q,i)=>d[i]);
    const ev2=evalQuiz(a,answers);
    const op=enqueue('quiz',{cid:a,answers:answers});
    const prev=ST.progress.quiz[a]||{attempts:0,best:0};
    ST.progress.quiz[a]={attempts:prev.attempts+1,best:Math.max(prev.best,ev2.pct),last:{answers:answers,pct:ev2.pct,op:op.id,ts:Date.now()},srv:prev.srv};
    ST.drafts['q:'+a]=[];ui.qmode[a]='result';save();
    rerenderMain();const h=$('#h1');if(h)h.focus();
    toast(netState()==='offline'?t('toast_saved_offline'):t('toast_saved_local'),'ok');return;
  }
  if(kind==='lab'){
    if(!lock('lab'+a,1500))return;
    const lb=LABS[a];
    const sub=ST.drafts['l:'+a]||(lb.kind==='code'?{code:lb.starter}:{remove:[],reason:''});
    if(lb.kind==='code'&&(!sub.code||sub.code.trim()===lb.starter.trim())){toast(t('lab_empty'),'err');return}
    const ev2=evalLab(a,sub);
    const op=enqueue('lab',{lid:a,sub:JSON.parse(JSON.stringify(sub))});
    const prev=ST.progress.labs[a]||{};
    ST.progress.labs[a]={score:Math.max(prev.score||0,ev2.score),pass:!!(prev.pass||ev2.pass),last:{sub:JSON.parse(JSON.stringify(sub)),ev:ev2,op:op.id,ts:Date.now()},srv:prev.srv};
    save();rerenderMain();
    toast(netState()==='offline'?t('toast_saved_offline'):t('toast_saved_local'),'ok');return;
  }
}
function onInput(ev){
  const el=ev.target,k=el.getAttribute&&el.getAttribute('data-inp');if(!k)return;
  const a=el.getAttribute('data-a');
  if(k==='tq'){ui.tq=el.value;$('#tres').innerHTML=tracksResults();return}
  if(k==='cq'){ui.cq=el.value;$('#cres').innerHTML=communityList();return}
  if(k==='ex-draft'){ST.drafts['e:'+a]=el.value;save();return}
  if(k==='lab-code'){const d=ST.drafts['l:'+a]||{};d.code=el.value;ST.drafts['l:'+a]=d;save();return}
  if(k==='lab-reason'){const d=ST.drafts['l:'+a]||{remove:[],reason:''};d.reason=el.value;ST.drafts['l:'+a]=d;save();return}
  if(k==='cm-draft'){ST.drafts.post=el.value;save();return}
  if(k==='cp-draft'){ST.drafts.cp=el.value;save();return}
}
function onChange(ev){
  const el=ev.target,k=el.getAttribute&&el.getAttribute('data-chg');if(!k)return;
  const a=el.getAttribute('data-a')||'';
  if(k==='q-pick'){const p=a.split(':'),d=ST.drafts['q:'+p[0]]||[];d[+p[1]]=+p[2];ST.drafts['q:'+p[0]]=d;save();
    if(ui.qerr[p[0]]){const e=$('#q-err');}return}
  if(k==='lab-col'){const p=a.split(':'),lb=LABS[p[0]];const d=ST.drafts['l:'+p[0]]||{remove:[],reason:''};d.remove=d.remove||[];const i=d.remove.indexOf(p[1]);if(el.checked&&i<0)d.remove.push(p[1]);if(!el.checked&&i>=0)d.remove.splice(i,1);ST.drafts['l:'+p[0]]=d;save();return}
  if(k==='pref-num'){setPref('numerals',el.value);rerenderMain(true);return}
  if(k==='admin-course'){ui.adminCourse=el.value;ui.adminPage=1;rerenderMain(true);return}
}
function onClick(ev){
  const el=ev.target.closest('[data-act]');
  if(el){
    if(el.disabled||el.getAttribute('aria-disabled')==='true')return;
    handleAct(el.getAttribute('data-act'),el.getAttribute('data-a')||'',el,ev);
    return;
  }
  if(ev.target.closest('[data-close]'))closeDrawer(true);
}
function onKey(ev){
  /* roving focus for tablists */
  const tab=ev.target.closest&&ev.target.closest('[role="tab"]');
  if(tab&&(ev.key==='ArrowRight'||ev.key==='ArrowLeft'||ev.key==='Home'||ev.key==='End')){
    const tabs=$$('[role="tab"]',tab.parentElement);let i=tabs.indexOf(tab);
    const rtl=document.documentElement.dir==='rtl';
    if(ev.key==='Home')i=0;else if(ev.key==='End')i=tabs.length-1;
    else i=(i+((ev.key==='ArrowRight')!==rtl?1:-1)+tabs.length)%tabs.length;
    ev.preventDefault();tabs[i].click();const nt=document.getElementById(tabs[i].id);if(nt)nt.focus();
  }
  if(ev.key==='Escape'&&cpOpen&&!$('#modal')&&!$('#drawerwrap')){cpOpen=false;renderCompanion();const f=$('.fab');if(f)f.focus()}
}

/* ---------- boot ---------- */
function boot(){
  applyPrefs();
  document.addEventListener('click',onClick);
  document.addEventListener('submit',onSubmit);
  document.addEventListener('input',onInput);
  document.addEventListener('change',onChange);
  document.addEventListener('keydown',onKey);
  window.addEventListener('hashchange',()=>{closeDrawer(true);route()});
  window.addEventListener('online',()=>{if(netMode==='auto')onNetChange(netState())});
  window.addEventListener('offline',()=>{if(netMode==='auto')onNetChange(netState())});
  window.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue){try{ST=loadState();renderAll()}catch(x){}}});
  if(window.matchMedia){
    const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
    if(mq.matches&&ST.prefs.motion==='auto')document.documentElement.setAttribute('data-motion','reduce');
  }
  /* any ops left syncing when the page was closed go back to pending */
  ST.queue.forEach(o=>{if(o.status==='syncing')o.status='pending'});
  save();
  route();
  setInterval(()=>{if(ST.queue.some(o=>o.status==='pending'||o.status==='blocked'))pump()},4000);
  pump();
}
boot();
