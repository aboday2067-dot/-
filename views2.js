'use strict';
/* NovaLearn AI — views (part 2): community, notifications, preferences, sync, admin, design system, auth */

/* ---------- community (local demo) ---------- */
const SAMPLE_POSTS=[
 {id:'s1',who:'Rania',days:3,text:o('Tip: I read each lesson once, then try the practice box before opening the hint.','نصيحة: أقرأ كل درس مرة واحدة ثم أجرّب مربع التدريب قبل فتح التلميح.')},
 {id:'s2',who:'Yousif',days:1,text:o('Has anyone finished the privacy lab? Removing the phone column is the part I almost missed.','هل أنهى أحد مختبر الخصوصية؟ كدت أنسى حذف عمود الهاتف.')},
 {id:'s3',who:'Hanan',days:0,text:o('Offline mode saved my progress on the bus today. The sync queue caught up when I got home.','وضع عدم الاتصال حفظ تقدمي في الحافلة اليوم، وتمت مزامنة الطابور حين وصلت البيت.')}
];
function communityList(){
  const q=ui.cq.trim().toLowerCase();
  const mine=ST.community.map(p=>Object.assign({mine:1},p));
  const samples=SAMPLE_POSTS.map(s=>({id:s.id,who:s.who,text:L(s.text),ts:Date.now()-s.days*864e5,sample:1}));
  const all=mine.concat(samples).filter(p=>!q||p.text.toLowerCase().includes(q)||p.who.toLowerCase().includes(q)).sort((a,b)=>b.ts-a.ts);
  if(!all.length)return emptyState('search',t('no_results'),t('no_results_hint'));
  return `<div class="stack-s">${all.map(p=>`<article class="card card-flat stack-s" aria-label="${esc(p.who)}">
    <div class="row between"><div class="row nowrap"><span class="shp shp-circle" aria-hidden="true">${esc((p.who||'?').slice(0,1).toUpperCase())}</span><div><b>${esc(p.who)}</b><div class="xs muted">${fmtDate(p.ts,true)}</div></div></div>
    <div class="row">${p.sample?chip('neutral','info',t('sample')):chip('info','lock',t('only_device'))}${p.mine?`<button type="button" class="btn btn-text btn-sm" data-act="community-del" data-a="${p.id}">${icon('trash',16)}${T('delete')}</button>`:''}</div></div>
    <p style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(p.text)}</p></article>`).join('')}</div>`;
}
function viewCommunity(){
  const draft=ST.drafts.post||'';
  return ph(T('nav_community'),T('community_sub'))
  +alertBox('info','info',`<p>${T('community_note')}</p>`)
  +`<form class="card stack" data-form="post" novalidate style="margin-top:1.5rem" aria-labelledby="np-h"><h2 id="np-h">${T('new_post')}</h2>
    <div class="field"><label for="cm-text">${T('post_label')}</label><textarea id="cm-text" maxlength="280" data-inp="cm-draft"${ui.cmErr?' aria-invalid="true" aria-describedby="cm-err"':''}>${esc(draft)}</textarea>
    ${ui.cmErr?`<p class="err-msg" id="cm-err">${icon('alert',16)}<span>${T('post_empty')}</span></p>`:''}<span class="hint">${T('post_hint')}</span></div>
    <div><button type="submit" class="btn btn-primary">${icon('send',18,'flip')}${T('post_btn')}</button></div></form>
  <section class="sec" style="margin-top:2rem" aria-labelledby="pl-h"><div class="row between"><h2 id="pl-h">${T('posts')}</h2>
    <div class="field" style="min-width:min(100%,18rem)"><label for="cq">${T('search')}</label><input type="search" id="cq" data-inp="cq" value="${esc(ui.cq)}" autocomplete="off"></div></div>
    <div id="cres" aria-live="polite">${communityList()}</div></section>`;
}

/* ---------- notifications ---------- */
const NCAT={learning:'book',account:'shield',announcements:'bell',system:'sync'};
function viewNotifications(){
  const f=ui.notif;
  const list=ST.notifs.filter(n=>f==='all'||n.cat===f);
  return ph(T('nav_notifications'),T('notif_sub'),`<button type="button" class="btn btn-secondary" data-act="notif-readall"${unreadCount()?'':' disabled'}>${icon('check',18)}${T('mark_all_read')}</button>`)
  +`<div class="seg" role="group" aria-label="${T('notif_filter')}" style="margin-bottom:1.5rem">${['all','learning','account','announcements','system'].map(k=>
    `<button type="button" data-act="notif-filter" data-a="${k}" aria-pressed="${f===k}">${T('nc_'+k)}</button>`).join('')}</div>
  ${list.length?`<ul class="lessonlist">${list.map(n=>{
    const x=notifText(n);
    return `<li class="card card-flat stack-s"><div class="row nowrap">${shape('circle',NCAT[n.cat]||'bell')}<div class="grow"><div class="row"><b>${esc(x.title)}</b>${n.read?'':chip('info','spark',t('new'))}<span class="chip neutral">${T('nc_'+n.cat)}</span></div>
      <p>${esc(x.body)}</p><p class="xs muted">${fmtDate(n.ts,true)} · ${T('delivered_app')}</p></div>
      ${n.read?'':`<button type="button" class="btn btn-secondary btn-sm" data-act="notif-read" data-a="${n.id}">${T('mark_read')}</button>`}</div></li>`;
  }).join('')}</ul>`:emptyState('bell',t('notif_empty'),t('notif_empty_hint'))}
  <p class="xs muted" style="margin-top:1rem">${T('notif_note')}</p>`;
}

/* ---------- preferences ---------- */
function scopeChip(k){return `<span class="chip neutral">${icon(k==='acct'?'globe':'lock',14)}${T(k==='acct'?'scope_account':'scope_device')}</span>`}
function segBtns(act,cur,items){
  return items.map(i=>`<button type="button" data-act="${act}" data-a="${i[0]}" aria-pressed="${String(cur)===String(i[0])}">${i[2]?icon(i[2],18):''}<span>${i[1]}</span></button>`).join('');
}
function swRow(id,label,hint,act,arg,on){
  return `<div class="sw-row"><span><span id="${id}" class="bold">${label}</span>${hint?`<span class="hint" style="display:block">${hint}</span>`:''}</span><span class="row nowrap">${sw(act,arg,on,id)}</span></div>`;
}
function viewPrefs(){
  const p=ST.prefs;
  return ph(T('nav_prefs'),T('prefs_sub'))
  +`<div class="stack">
  ${alertBox('info','info',`<p>${T('scope_note')}</p>`)}
  <section class="card stack" aria-labelledby="pf1"><div class="row between"><h2 id="pf1">${T('pf_lang')}</h2>${scopeChip('acct')}</div>
    <div role="group" aria-label="${T('pf_lang')}"><div class="seg">${segBtns('pref-lang',p.lang,[['ar','العربية','globe'],['en','English','globe']])}</div></div>
    <div class="field" style="max-width:20rem"><label for="pf-num">${T('pf_numerals')}</label><select id="pf-num" data-chg="pref-num"><option value="auto"${p.numerals==='auto'?' selected':''}>${T('num_auto')}</option><option value="latin"${p.numerals==='latin'?' selected':''}>${T('num_latin')}</option></select>
    <span class="hint">${T('num_hint',{sample:nf(1234567.5)})}</span></div></section>
  <section class="card stack" aria-labelledby="pf2"><div class="row between"><h2 id="pf2">${T('pf_appearance')}</h2>${scopeChip('acct')}</div>
    <div><p class="bold" id="pf-th">${T('pf_theme')}</p><div class="seg" role="group" aria-labelledby="pf-th">${segBtns('pref-theme',p.theme,[['auto',t('th_auto'),'auto'],['light',t('th_light'),'sun'],['dark',t('th_dark'),'moon']])}</div></div>
    <div><p class="bold" id="pf-ac">${T('pf_accent')}</p><div class="seg" role="group" aria-labelledby="pf-ac">${[['sky','ac_sky','--a-sky'],['green','ac_green','--a-green'],['purple','ac_purple','--a-purple']].map(a=>
      `<button type="button" data-act="pref-accent" data-a="${a[0]}" aria-pressed="${p.accent===a[0]}"><span class="swatch" style="background:var(${a[2]})" aria-hidden="true"></span><span>${T(a[1])}</span></button>`).join('')}</div>
      <p class="hint">${T('accent_hint')}</p></div>
    <div><p class="bold" id="pf-de">${T('pf_density')}</p><div class="seg" role="group" aria-labelledby="pf-de">${segBtns('pref-density',p.density,[['comfortable',t('de_comfortable')],['compact',t('de_compact')]])}</div></div>
  </section>
  <section class="card stack" aria-labelledby="pf3"><div class="row between"><h2 id="pf3">${T('pf_access')}</h2>${scopeChip('dev')}</div>
    <div><p class="bold" id="pf-ts">${T('pf_textsize')}</p><div class="seg" role="group" aria-labelledby="pf-ts">${segBtns('pref-text',p.textScale,[[100,nf(1,{style:'percent'})],[115,nf(1.15,{style:'percent'})],[130,nf(1.3,{style:'percent'})],[150,nf(1.5,{style:'percent'})]])}</div><p class="hint">${T('textsize_hint')}</p></div>
    ${swRow('pl-mo',T('pf_motion'),T('motion_hint'),'pref-motion','',p.motion==='reduce')}
    ${swRow('pl-ld',T('pf_lowdata'),T('lowdata_hint'),'pref-low','',p.lowData)}
    ${swRow('pl-dia',T('pf_dialect'),T('dialect_hint'),'pref-dialect','',p.dialect)}
  </section>
  <section class="card card-ai stack" aria-labelledby="pf-pv"><h2 id="pf-pv">${T('pf_preview')}</h2><p>${T('preview_text')}</p>
    <div class="row"><button type="button" class="btn btn-primary" tabindex="-1">${T('preview_primary')}</button><button type="button" class="btn btn-secondary" tabindex="-1">${T('preview_secondary')}</button>${chip('ok','check',t('preview_chip'))}</div>
    ${bar(60,t('preview_bar'))}</section>
  <section class="card stack" aria-labelledby="pf4"><div class="row between"><h2 id="pf4">${T('pf_notif')}</h2>${scopeChip('acct')}</div>
    ${swRow('pn-l',T('nc_learning'),T('nh_learning'),'pref-notif','learning',p.notif.learning)}
    ${swRow('pn-a',T('nc_announcements'),T('nh_announcements'),'pref-notif','announcements',p.notif.announcements)}
    ${swRow('pn-s',T('nc_system'),T('nh_system'),'pref-notif','system',p.notif.system)}
    <div class="sw-row"><span><span class="bold">${T('nc_account')}</span><span class="hint" style="display:block">${T('nh_account')}</span></span><span class="chip neutral">${icon('lock',16)}${T('required')}</span></div></section>
  <section class="card stack" aria-labelledby="pf5"><h2 id="pf5">${T('pf_privacy')}</h2>
    <p>${T('privacy_intro')}</p><ul class="obj">${['pv_1','pv_2','pv_3','pv_4'].map(k=>`<li>${T(k)}</li>`).join('')}</ul>
    <div class="row"><button type="button" class="btn btn-secondary" data-act="data-export">${icon('copy',18)}${T('export_data')}</button><button type="button" class="btn btn-danger" data-act="data-delete">${icon('trash',18)}${T('delete_data')}</button></div></section>
  <div><button type="button" class="btn btn-secondary" data-act="pref-reset">${icon('refresh',18)}${T('reset_prefs')}</button></div>
  </div>`;
}

/* ---------- sync & storage ---------- */
function opLabel(op){
  const p=op.payload;
  if(op.type==='lesson'){const c=COURSES[p.cid];const l=c&&c.lessons.find(x=>x.id===p.lid);return l?L(l.title):p.lid}
  if(op.type==='quiz')return COURSES[p.cid]?L(COURSES[p.cid].title):p.cid;
  if(op.type==='lab')return LABS[p.lid]?L(LABS[p.lid].title):p.lid;
  return op.type;
}
function viewSync(){
  const q=queueStats(),n=netState();
  const bytes=storageBytes();
  return ph(T('nav_sync'),T('sync_sub'))
  +`<div class="stack">
  ${alertBox('warn','alert',`<p class="bold">${T('demo_server_t')}</p><p>${T('demo_server')}</p>`)}
  ${!storageOK?alertBox('err','alert',`<p class="bold">${T('storage_blocked_t')}</p><p>${T('storage_blocked')}</p>`,'alert'):''}
  <section class="card stack" aria-labelledby="sy1"><h2 id="sy1">${T('conn_state')}</h2>
    <div class="row">${connChip()}${q.open?chip('warn','clock',t('open_items',{n:nf(q.open)})):chip('ok','check',t('all_synced'))}${q.failed?chip('err','alert',t('failed_n',{n:nf(q.failed)})):''}${q.blocked?chip('warn','clock',t('blocked_n',{n:nf(q.blocked)})):''}</div>
    <p class="small muted">${T(n==='offline'?'conn_offline_msg':n==='weak'?'conn_weak_msg':'conn_online_msg')}</p>
    <div><p class="bold" id="sim-l">${T('simulator')}</p><div class="seg" role="group" aria-labelledby="sim-l">${segBtns('net-mode',netMode,[['auto',t('sim_auto')],['offline',t('sim_offline')],['weak',t('sim_weak')]])}</div><p class="hint">${T('simulator_hint')}</p></div>
    <div class="row"><button type="button" class="btn btn-primary" data-act="sync-now"${n==='offline'||!q.open?' disabled':''}>${icon('sync',18)}${T('sync_now')}</button>
      <button type="button" class="btn btn-secondary" data-act="op-retry"${q.failed||q.blocked?'':' disabled'}>${icon('refresh',18)}${T('retry_failed')}</button>
      <button type="button" class="btn btn-secondary" data-act="sync-clear-done"${q.done?'':' disabled'}>${T('clear_synced')}</button></div></section>
  <section class="card stack" aria-labelledby="sy2"><h2 id="sy2">${T('queue')}</h2>
    ${ST.queue.length?`<div class="tbl-wrap"><table class="tbl-stack"><thead><tr><th scope="col">${T('q_type')}</th><th scope="col">${T('q_item')}</th><th scope="col">${T('q_status')}</th><th scope="col">${T('q_attempts')}</th><th scope="col">${T('q_created')}</th></tr></thead><tbody>${ST.queue.slice().reverse().map(op=>
      `<tr><td data-label="${T('q_type')}">${T('op_'+op.type)}</td><td data-label="${T('q_item')}">${esc(opLabel(op))}</td><td data-label="${T('q_status')}">${statusChip(op.id)}${op.error?`<div class="xs muted">${T('err_'+op.error)}</div>`:''}</td><td data-label="${T('q_attempts')}">${nf(op.attempts)}</td><td data-label="${T('q_created')}">${fmtDate(op.created,true)}</td></tr>`).join('')}</tbody></table></div>`
      :emptyState('sync',t('queue_empty'),t('queue_empty_hint'))}</section>
  <section class="card stack" aria-labelledby="sy3"><h2 id="sy3">${T('server_sim')}</h2>
    <div class="ds-grid"><div class="tok"><span class="muted">${T('xp_confirmed')}</span><b>${nf(ST.server.xp)}</b></div><div class="tok"><span class="muted">${T('coins_confirmed')}</span><b>${nf(ST.server.coins)}</b></div><div class="tok"><span class="muted">${T('ops_processed')}</span><b>${nf(Object.keys(ST.server.processed).length)}</b></div></div>
    <p class="small muted">${T('server_sim_note')}</p></section>
  <section class="card stack" aria-labelledby="sy4"><h2 id="sy4">${T('storage')}</h2>
    <p>${T('storage_used',{size:nf(Math.max(1,Math.round(bytes/1024)))+' KB'})}</p>
    <p class="small muted">${T('storage_note')}</p>
    <div><button type="button" class="btn btn-danger" data-act="data-delete">${icon('trash',18)}${T('delete_data')}</button></div></section>
  <section class="card card-flat stack" aria-labelledby="sy5"><h2 id="sy5">${T('sync_rules')}</h2><ul class="obj">${['sr_1','sr_2','sr_3','sr_4','sr_5','sr_6'].map(k=>`<li>${T(k)}</li>`).join('')}</ul></section>
  </div>`;
}

/* ---------- administration (demo; real access control must live on the server) ---------- */
function adminRows(){
  const cs=ui.adminCourse==='all'?COURSE_ORDER:[ui.adminCourse];
  const avg=(x,k)=>Math.round(cs.reduce((a,c)=>a+x[k][c],0)/cs.length);
  const rows=COHORT.map(x=>({id:x.id,comp:avg(x,'les'),quiz:avg(x,'quiz'),ver:cs.filter(c=>x.ver[c]).length,last:x.last}));
  const s=ui.adminSort;
  rows.sort((a,b)=>(a[s.k]>b[s.k]?1:a[s.k]<b[s.k]?-1:0)*s.d);
  return rows;
}
function adminChart(){
  const data=COURSE_ORDER.map(cid=>{
    const n=COHORT.length;
    return{cid:cid,comp:Math.round(COHORT.reduce((a,x)=>a+x.les[cid],0)/n),ver:COURSES[cid].lab?Math.round(100*COHORT.filter(x=>x.ver[cid]).length/n):0,hasLab:!!COURSES[cid].lab};
  });
  const W=520,H=270,L0=44,B=222,T0=28,gw=(W-L0-10)/data.length,bw=48;
  const y=v=>B-(v/100)*(B-T0);
  let g='';
  [0,25,50,75,100].forEach(v=>{g+=`<line x1="${L0}" x2="${W-6}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--border);stroke-width:1"/><text x="${L0-6}" y="${y(v)+4}" text-anchor="end" style="fill:var(--text-2);font-size:11px">${pctf(v)}</text>`});
  data.forEach((d,i)=>{
    const x0=L0+i*gw+(gw-2*bw-10)/2;
    g+=`<rect x="${x0}" y="${y(d.comp)}" width="${bw}" height="${B-y(d.comp)}" style="fill:var(--c2)"/><text x="${x0+bw/2}" y="${y(d.comp)-5}" text-anchor="middle" style="fill:var(--text);font-size:12px;font-weight:700">${pctf(d.comp)}</text>`;
    g+=`<rect x="${x0+bw+10}" y="${y(d.ver)}" width="${bw}" height="${Math.max(B-y(d.ver),0)}" style="fill:url(#hatch);stroke:var(--c1);stroke-width:2"/><text x="${x0+bw+10+bw/2}" y="${y(d.ver)-5}" text-anchor="middle" style="fill:var(--text);font-size:12px;font-weight:700">${d.hasLab?pctf(d.ver):'—'}</text>`;
    g+=`<text x="${L0+i*gw+gw/2}" y="${B+20}" text-anchor="middle" style="fill:var(--text);font-size:12px">${esc(L(COURSES[d.cid].title))}</text>`;
  });
  const label=data.map(d=>`${L(COURSES[d.cid].title)}: ${t('chart_comp')} ${pctf(d.comp)}, ${t('chart_ver')} ${d.hasLab?pctf(d.ver):t('na')}`).join('; ');
  return{data:data,svg:`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" style="width:100%;height:auto;direction:ltr"><defs><pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" style="fill:var(--surface)"/><line x1="0" y1="0" x2="0" y2="7" style="stroke:var(--c1);stroke-width:3"/></pattern></defs>${g}</svg>`};
}
function viewAdmin(){
  const head=ph(T('nav_admin'),T('admin_sub'));
  if(netState()==='offline')return head+alertBox('warn','wifiOff',`<p class="bold">${T('admin_offline_t')}</p><p>${T('admin_offline')}</p>`,'status');
  const tabs=['overview','learners','audit'];
  const tb=`<div class="tabs" role="tablist" aria-label="${T('nav_admin')}">${tabs.map(k=>`<button type="button" class="tab" role="tab" id="tab-${k}" aria-selected="${ui.adminTab===k}" aria-controls="panel-${k}" tabindex="${ui.adminTab===k?0:-1}" data-act="admin-tab" data-a="${k}">${T('at_'+k)}</button>`).join('')}</div>`;
  let body='';
  if(ui.adminTab==='overview'){
    const ch=adminChart();
    const compAll=Math.round(COHORT.reduce((a,x)=>a+COURSE_ORDER.reduce((b,c)=>b+x.les[c],0)/COURSE_ORDER.length,0)/COHORT.length);
    const labC=COURSE_ORDER.filter(c=>COURSES[c].lab);
    const verRate=Math.round(100*COHORT.reduce((a,x)=>a+labC.filter(c=>x.ver[c]).length,0)/(COHORT.length*labC.length));
    body=`<div class="stack"><p class="small muted">${T('admin_fresh',{date:fmtDate(Date.now(),true)})}</p>
    <div class="ds-grid"><div class="tok"><span class="muted">${T('m_learners')}</span><b style="font-size:1.6rem">${nf(COHORT.length)}</b></div>
      <div class="tok"><span class="muted">${T('m_completion')}</span><b style="font-size:1.6rem">${pctf(compAll)}</b></div>
      <div class="tok"><span class="muted">${T('m_verified')}</span><b style="font-size:1.6rem">${pctf(verRate)}</b></div></div>
    <p class="small muted">${T('metric_defs')}</p>
    <section class="card stack" aria-labelledby="ch-h"><h2 id="ch-h">${T('chart_title')}</h2>${ch.svg}
      <div class="row small"><span class="row nowrap"><span class="swatch" style="background:var(--c2);border-color:var(--c2)"></span>${T('chart_comp')}</span><span class="row nowrap"><span class="swatch" style="background:repeating-linear-gradient(45deg,var(--c1) 0 3px,transparent 3px 6px);border-color:var(--c1)"></span>${T('chart_ver')}</span></div>
      <details open><summary class="bold" style="min-height:44px;display:flex;align-items:center;cursor:pointer">${T('table_view')}</summary><div class="tbl-wrap"><table class="tbl-stack"><thead><tr><th scope="col">${T('course')}</th><th scope="col">${T('chart_comp')}</th><th scope="col">${T('chart_ver')}</th></tr></thead><tbody>${ch.data.map(d=>`<tr><td data-label="${T('course')}">${LE(COURSES[d.cid].title)}</td><td data-label="${T('chart_comp')}">${pctf(d.comp)}</td><td data-label="${T('chart_ver')}">${d.hasLab?pctf(d.ver):T('na')}</td></tr>`).join('')}</tbody></table></div></details></section></div>`;
  }else if(ui.adminTab==='learners'){
    const rows=adminRows(),per=4,pages=Math.ceil(rows.length/per),pg=clamp(ui.adminPage,1,pages);
    const s=ui.adminSort;
    const th=(k,label)=>`<th scope="col" aria-sort="${s.k===k?(s.d>0?'ascending':'descending'):'none'}"><button type="button" class="btn btn-text" data-act="admin-sort" data-a="${k}">${label}${s.k===k?icon(s.d>0?'up':'down',14):''}</button></th>`;
    const maxV=ui.adminCourse==='all'?COURSE_ORDER.filter(c=>COURSES[c].lab).length:1;
    body=`<div class="stack"><div class="field" style="max-width:20rem"><label for="ad-c">${T('filter_course')}</label><select id="ad-c" data-chg="admin-course"><option value="all"${ui.adminCourse==='all'?' selected':''}>${T('all_courses')}</option>${COURSE_ORDER.map(c=>`<option value="${c}"${ui.adminCourse===c?' selected':''}>${LE(COURSES[c].title)}</option>`).join('')}</select><span class="hint">${T('filter_effect')}</span></div>
    <p class="small muted">${T('pseudonym_note')}</p>
    <div class="tbl-wrap"><table class="tbl-stack"><thead><tr>${th('id',T('learner'))}${th('comp',T('chart_comp'))}${th('quiz',T('quiz_avg'))}${th('ver',T('verified_skills'))}${th('last',T('last_activity'))}</tr></thead>
    <tbody>${rows.slice((pg-1)*per,pg*per).map(r=>`<tr><td data-label="${T('learner')}"><b>${esc(r.id)}</b></td><td data-label="${T('chart_comp')}">${pctf(r.comp)}</td><td data-label="${T('quiz_avg')}">${pctf(r.quiz)}</td><td data-label="${T('verified_skills')}">${nf(r.ver)} / ${nf(maxV)}</td><td data-label="${T('last_activity')}">${r.last===0?T('today'):T('days_ago',{n:nf(r.last)})}</td></tr>`).join('')}</tbody></table></div>
    <nav class="row between" aria-label="${T('pagination')}"><button type="button" class="btn btn-secondary" data-act="admin-page" data-a="${pg-1}"${pg<=1?' disabled':''}>${T('prev')}</button><span class="small" aria-live="polite">${T('page_of',{a:nf(pg),b:nf(pages)})}</span><button type="button" class="btn btn-secondary" data-act="admin-page" data-a="${pg+1}"${pg>=pages?' disabled':''}>${T('next')}</button></nav></div>`;
  }else{
    body=`<div class="stack">${alertBox('info','info',`<p>${T('audit_note')}</p>`)}${ST.audit.length?`<div class="tbl-wrap"><table class="tbl-stack"><thead><tr><th scope="col">${T('q_created')}</th><th scope="col">${T('actor')}</th><th scope="col">${T('action')}</th></tr></thead><tbody>${ST.audit.map(a=>`<tr><td data-label="${T('q_created')}">${fmtDate(a.ts,true)}</td><td data-label="${T('actor')}">${esc(a.actor)}</td><td data-label="${T('action')}">${esc(t('au_'+a.action))}${a.detail?` <span class="muted">· ${esc(a.detail)}</span>`:''}</td></tr>`).join('')}</tbody></table></div>`:emptyState('shield',t('audit_empty'),t('audit_empty_hint'))}</div>`;
  }
  return head+alertBox('warn','alert',`<p>${T('admin_security_note')}</p>`)+`<div style="margin-top:1.5rem">${tb}<div role="tabpanel" id="panel-${ui.adminTab}" aria-labelledby="tab-${ui.adminTab}" tabindex="0">${body}</div></div>`;
}

/* ---------- design system reference page ---------- */
function hexRGB(h){h=(h||'').trim();if(h[0]!=='#')return null;if(h.length===4)h='#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];const n=parseInt(h.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255]}
function lumOf(c){const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2])}
function contrastOf(a,b){const A=hexRGB(a),B=hexRGB(b);if(!A||!B)return null;const l1=lumOf(A),l2=lumOf(B);return(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)}
function tokVal(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()}
function viewSystem(){
  const toks=['bg','surface','surface-2','text','text-2','border','border-strong','primary','accent','pu','ok','warn','err','info','c1','c2','c3','c4'];
  const pairs=[['text','bg','pair_text_bg',4.5],['text-2','surface','pair_text2_surface',4.5],['on-primary','primary','pair_primary',4.5],['accent','bg','pair_accent_bg',4.5],['on-accent','accent','pair_onaccent',4.5],['ok','ok-bg','pair_ok',4.5],['warn','warn-bg','pair_warn',4.5],['err','err-bg','pair_err',4.5],['info','info-bg','pair_info',4.5],['border-strong','surface','pair_border',3]];
  const cov=[['cv_theme','ok'],['cv_type','ok'],['cv_rtl','ok'],['cv_nav','ok'],['cv_pers','ok'],['cv_offline','part'],['cv_companion','part'],['cv_admin','part'],['cv_labs','part'],['cv_auth','none'],['cv_cert','none'],['cv_roadmap','none'],['cv_a11y','part']];
  const covChip=k=>k==='ok'?chip('ok','check',t('cv_ok')):k==='part'?chip('warn','alert',t('cv_part')):chip('neutral','minusIc',t('cv_none')).replace(icon('minusIc',16),icon('lock',16));
  return ph(T('nav_system'),T('system_sub'))
  +`<div class="stack">
  <section class="card stack" aria-labelledby="ds1"><h2 id="ds1">${T('ds_status')}</h2><p>${T('ds_status_text')}</p><div class="row">${chip('ok','check','Approved')}${chip('info','info','Proposed')}${chip('warn','alert','Needs Definition')}${chip('neutral','clock','Needs Validation')}</div></section>
  <section class="card stack" aria-labelledby="ds2"><h2 id="ds2">${T('ds_color')}</h2><p class="small muted">${T('ds_color_note')}</p>
    <div class="ds-grid">${toks.map(k=>`<div class="tok"><i style="background:var(--${k})"></i><code>--${k}</code><code>${esc(tokVal('--'+k))}</code></div>`).join('')}</div>
    <h3>${T('ds_contrast')}</h3><div class="tbl-wrap"><table class="tbl-stack"><thead><tr><th scope="col">${T('ds_pair')}</th><th scope="col">${T('ds_ratio')}</th><th scope="col">${T('ds_result')}</th></tr></thead><tbody>${pairs.map(p=>{
      const r=contrastOf(tokVal('--'+p[0]),tokVal('--'+p[1]));
      return `<tr><td data-label="${T('ds_pair')}">${T(p[2])}</td><td data-label="${T('ds_ratio')}">${r?nf(Math.round(r*10)/10)+':1':'—'}</td><td data-label="${T('ds_result')}">${r?(r>=p[3]?chip('ok','check',t('ds_pass',{n:nf(p[3])})):chip('err','xcircle',t('ds_fail',{n:nf(p[3])}))):'—'}</td></tr>`;
    }).join('')}</tbody></table></div><p class="xs muted">${T('ds_contrast_note')}</p></section>
  <section class="card stack" aria-labelledby="ds3"><h2 id="ds3">${T('ds_type')}</h2>
    <p style="font-size:var(--fs-display);font-weight:700">${T('ds_display')}</p><p style="font-size:var(--fs-h2);font-weight:700">${T('ds_h2')}</p><p style="font-size:var(--fs-h3);font-weight:700">${T('ds_h3')}</p><p>${T('ds_body')}</p><p class="small muted">${T('ds_small')}</p>
    <pre class="codeblock" dir="ltr">def hello():\n    return "Inter / IBM Plex Sans Arabic"</pre><p class="xs muted">${T('ds_type_note')}</p></section>
  <section class="card stack" aria-labelledby="ds4"><h2 id="ds4">${T('ds_shapes')}</h2><div class="sample">
    <div class="row nowrap">${shape('oval','book')}<span>${T('shape_oval')}</span></div><div class="row nowrap">${shape('circle','help')}<span>${T('shape_circle')}</span></div>
    <div class="row nowrap">${shape('sq','gear')}<span>${T('shape_sq')}</span></div><div class="row nowrap">${shape('nova','spark')}<span>${T('shape_nova')}</span></div></div></section>
  <section class="card stack" aria-labelledby="ds5"><h2 id="ds5">${T('ds_spacing')}</h2><p>${T('ds_spacing_text')} ${chip('neutral','clock','Proposed · Needs Validation')}</p>
    <div class="stack-s">${[1,2,3,4,6,8].map(n=>`<div class="row nowrap"><code class="in" style="min-width:5rem">${nf(n*4)}px</code><i style="display:block;height:.8rem;width:calc(var(--u)*${n});background:var(--accent);border-radius:3px"></i></div>`).join('')}</div>
    <p class="xs muted">${T('ds_motion_text')}</p></section>
  <section class="card stack" aria-labelledby="ds6"><h2 id="ds6">${T('ds_components')}</h2>
    <div class="sample"><button type="button" class="btn btn-primary">${T('preview_primary')}</button><button type="button" class="btn btn-secondary">${T('preview_secondary')}</button><button type="button" class="btn btn-text">${T('ds_text_btn')}</button><button type="button" class="btn btn-danger">${T('delete')}</button><button type="button" class="btn btn-primary" disabled>${T('ds_disabled')}</button><button type="button" class="btn btn-secondary" aria-busy="true"><span class="spin" aria-hidden="true"></span>${T('ds_loading')}</button><button type="button" class="btn btn-secondary btn-icon" aria-label="${T('ds_icon_btn')}">${icon('search',20)}</button></div>
    <div class="field" style="max-width:24rem"><label for="ds-in">${T('ds_input')}</label><input type="text" id="ds-in" value="" aria-invalid="true" aria-describedby="ds-in-e"><p class="err-msg" id="ds-in-e">${icon('alert',16)}<span>${T('ds_input_err')}</span></p></div>
    <div class="stack-s">${alertBox('ok','check',`<p>${T('ds_ok')}</p>`)}${alertBox('info','info',`<p>${T('ds_info')}</p>`)}${alertBox('warn','alert',`<p>${T('ds_warn')}</p>`)}${alertBox('err','xcircle',`<p>${T('ds_err')}</p>`)}</div>
    ${bar(70,t('ds_bar'))}${bar(45,t('ds_bar_m'),'mastery')}
    <div class="row"><div class="skel" style="width:12rem" aria-hidden="true"></div><span class="small muted">${T('ds_skeleton')}</span></div>
    <div class="row"><button type="button" class="btn btn-secondary" data-act="demo-toast">${T('ds_toast')}</button><button type="button" class="btn btn-secondary" data-act="demo-modal">${T('ds_modal')}</button></div></section>
  <section class="card stack" aria-labelledby="ds7"><h2 id="ds7">${T('ds_coverage')}</h2><p class="small muted">${T('ds_coverage_note')}</p>
    <div class="tbl-wrap"><table class="tbl-stack"><thead><tr><th scope="col">${T('ds_area')}</th><th scope="col">${T('ds_state')}</th></tr></thead><tbody>${cov.map(c=>`<tr><td data-label="${T('ds_area')}">${T(c[0])}</td><td data-label="${T('ds_state')}">${covChip(c[1])}</td></tr>`).join('')}</tbody></table></div></section>
  </div>`;
}

/* ---------- account / auth ---------- */
function viewAuth(){
  const create=ui.authTab==='up',e=ui.authErr,v=ui.authVals||{};
  const fe=(k,id)=>e[k]?`<p class="err-msg" id="${id}-e">${icon('alert',16)}<span>${esc(e[k])}</span></p>`:'';
  const ia=(k,id)=>e[k]?` aria-invalid="true" aria-describedby="${id}-e"`:'';
  const errs=Object.keys(e);
  return `<div class="auth-bar">${langBtn()}${themeBtn()}</div>
  <main class="auth" id="main" tabindex="-1">
  <section class="auth-brand" aria-labelledby="ab-h"><span class="deco a" aria-hidden="true"></span><span class="deco b" aria-hidden="true"></span>
    <div class="row nowrap" style="position:relative">${logo(48)}<b style="font-size:1.5rem">NovaLearn AI</b></div>
    <h1 id="ab-h" style="position:relative">${T('auth_h')}</h1>
    <p class="ltr" lang="en" style="position:relative;font-size:1.15rem;font-weight:600">Ignite Your Potential.</p>
    <ul>${[['flask','au_1'],['shield','au_2'],['wifiOff','au_3']].map(x=>`<li>${icon(x[0],22)}<span>${T(x[1])}</span></li>`).join('')}</ul></section>
  <section class="card stack" aria-labelledby="af-h">
    <div class="tabs" role="tablist" aria-label="${T('auth_tabs')}"><button type="button" class="tab" role="tab" id="tab-in" aria-selected="${!create}" aria-controls="auth-panel" tabindex="${create?-1:0}" data-act="auth-tab" data-a="in">${T('sign_in')}</button><button type="button" class="tab" role="tab" id="tab-up" aria-selected="${create}" aria-controls="auth-panel" tabindex="${create?0:-1}" data-act="auth-tab" data-a="up">${T('create_account')}</button></div>
    <div role="tabpanel" id="auth-panel" aria-labelledby="tab-${create?'up':'in'}" class="stack">
    <h2 id="af-h">${T(create?'create_account':'sign_in')}</h2>
    ${errs.length?`<div role="alert">${alertBox('err','alert',`<p class="bold">${T('fix_errors')}</p>`)}</div>`:''}
    <form class="stack" data-form="auth" novalidate>
      ${create?`<div class="field"><label for="au-name">${T('f_name')}</label><input type="text" id="au-name" autocomplete="name" value="${esc(v.name||'')}"${ia('name','au-name')}>${fe('name','au-name')}</div>`:''}
      <div class="field"><label for="au-email">${T('f_email')}</label><input type="email" id="au-email" autocomplete="email" inputmode="email" value="${esc(v.email||'')}"${ia('email','au-email')}>${fe('email','au-email')}</div>
      <div class="field"><label for="au-pw">${T('f_password')}</label><div class="pw"><input type="${ui.pw?'text':'password'}" id="au-pw" autocomplete="${create?'new-password':'current-password'}"${ia('pw','au-pw')}><button type="button" class="btn btn-text btn-icon" data-act="pw-toggle" aria-pressed="${ui.pw}" aria-label="${T(ui.pw?'hide_pw':'show_pw')}">${icon(ui.pw?'eyeOff':'eye',20)}</button></div>${fe('pw','au-pw')}${create?`<span class="hint">${T('pw_hint')}</span>`:''}</div>
      <button type="submit" class="btn btn-primary"${ui.authBusy?' disabled aria-busy="true"':''}>${ui.authBusy?'<span class="spin" aria-hidden="true"></span>':''}${T(ui.authBusy?'please_wait':(create?'create_account':'sign_in'))}</button>
      ${create?'':`<button type="button" class="btn btn-text" data-act="auth-forgot">${T('forgot')}</button>`}
    </form>
    <hr class="divider">
    <p class="small muted">${T('demo_accounts')}</p>
    <div class="row"><button type="button" class="btn btn-secondary" data-act="auth-demo" data-a="learner">${T('demo_learner')}</button><button type="button" class="btn btn-secondary" data-act="auth-demo" data-a="admin">${T('demo_admin')}</button></div>
    <p class="xs muted">${T('auth_demo_note')}</p></div></section></main>`;
}
