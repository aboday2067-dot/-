'use strict';
/* NovaLearn AI — views (part 1): shared pieces, dashboard, tracks, courses, lessons, quiz, labs, passport */
const ui={custom:false,tq:'',authTab:'in',authErr:{},authBusy:false,pw:false,notif:'all',adminTab:'overview',adminSort:{k:'id',d:1},adminPage:1,adminCourse:'all',cq:'',qmode:{},qerr:{}};
let R={name:'home',args:[]};

function ph(title,sub,extra){
  return `<header class="ph"><div><h1 id="h1" tabindex="-1">${title}</h1>${sub?`<p class="muted">${sub}</p>`:''}</div>${extra||''}</header>`;
}
function crumbs(items){
  return `<nav class="crumbs" aria-label="${T('breadcrumb')}"><ol>${items.map((it,i)=>{
    const last=i===items.length-1;
    return `<li>${last?`<span aria-current="page">${esc(it.l)}</span>`:`<a href="#${it.h}">${esc(it.l)}</a>${icon('chevron',14,'flip')}`}</li>`;
  }).join('')}</ol></nav>`;
}
function emptyState(ic,title,text,action){
  return `<div class="empty">${shape('circle',ic)}<p class="bold">${esc(title)}</p><p>${esc(text)}</p>${action||''}</div>`;
}
function viewNotFound(){
  return ph(T('nf_title'),T('nf_text'))+`<a class="btn btn-primary" href="#home">${T('nav_home')}</a>`;
}
function viewForbidden(){
  return ph(T('forbidden_title'),T('forbidden_text'))+alertBox('warn','lock',`<p>${T('forbidden_note')}</p>`)+`<p><a class="btn btn-primary" href="#home">${T('nav_home')}</a></p>`;
}

/* ---------- shared learning pieces ---------- */
function skillChip(s){
  if(s.verified)return chip('ok','shield',t('sk_verified'));
  if(!s.hasLab)return(s.done===s.n&&s.theoryOK)?chip('info','info',t('sk_theory_only')):chip('neutral','clock',t('sk_progress'));
  if(s.theoryOK&&s.lab&&s.lab.pass)return chip('warn','clock',t('sk_pending_ver'));
  if(s.theoryOK)return chip('info','info',t('sk_theory_prov'));
  return chip('neutral','clock',t('sk_progress'));
}
function courseCard(cid){
  const c=COURSES[cid],s=skillState(cid);
  return `<article class="card cc card-flat">
    <div class="row nowrap">${shape('oval',c.icon)}<div class="grow"><h3><a href="#course-${cid}">${LE(c.title)}</a></h3><span class="small muted">${LE(c.level)} · ${T('mins',{n:nf(c.mins)})}</span></div></div>
    <div>${bar(s.content,t('lbl_completion'))}<p class="xs muted">${T('lessons_n',{a:nf(s.done),b:nf(s.n)})}</p></div>
    <div>${skillChip(s)}</div></article>`;
}
function courseCards(ids){return `<div class="cards-${ST.prefs.cardStyle}">${ids.map(courseCard).join('')}</div>`}
function styleSeg(){
  return `<div class="seg" role="group" aria-label="${T('card_style')}">${[['grid','grid'],['scroll','scroll'],['list','list']].map(p=>
    `<button type="button" data-act="style-set" data-a="${p[0]}" aria-pressed="${ST.prefs.cardStyle===p[0]}">${icon(p[1],18)}<span class="hide-sm">${T('style_'+p[0])}</span></button>`).join('')}</div>`;
}
function stepsList(s){
  const st=[
    {k:'st_content',done:s.done===s.n},
    {k:'st_theory',done:s.theoryOK},
    {k:'st_practical',done:!!(s.lab&&s.lab.pass),na:!s.hasLab},
    {k:'st_verified',done:s.verified,na:!s.hasLab}];
  let cur=-1;st.forEach((x,i)=>{if(cur<0&&!x.done&&!x.na)cur=i});
  return `<ol class="steps" aria-label="${T('steps_label')}">${st.map((x,i)=>
    `<li class="${x.done?'done':(i===cur?'cur':'')}">${icon(x.done?'check':(x.na?'lock':'clock'),16)}<span>${T(x.k)}${x.na?' ('+T('na')+')':''}</span></li>`).join('')}</ol>`;
}

/* ---------- dashboard ---------- */
function cardContinue(){
  const n=nextLesson();let body;
  if(!n)body=`<p>${T('cont_done')}</p><div><a class="btn btn-primary" href="#passport">${T('nav_passport')}</a></div>`;
  else{
    const c=COURSES[n.cid];
    body=`<div class="row nowrap">${shape('oval',c.icon)}<div class="grow"><p class="muted small">${LE(c.title)}</p><p class="bold">${LE(n.lesson.title)}</p></div></div>
    <div><a class="btn btn-primary" href="#lesson-${n.cid}-${n.idx+1}">${T('cont_btn')}${icon('arrow',18,'flip')}</a></div>`;
  }
  return `<h2 id="dc-continue">${T('dc_continue')}</h2>${body}`;
}
function cardProgress(){
  return `<div class="row between"><h2 id="dc-progress">${T('dc_progress')}</h2>${styleSeg()}</div>
  <p class="small muted">${T('progress_note')}</p>${courseCards(COURSE_ORDER)}`;
}
function sparkToday(){
  const day=new Date().toISOString().slice(0,10);
  return{day:day,sp:SPARKS[Math.floor(Date.now()/864e5)%SPARKS.length]};
}
function cardSpark(){
  const s=sparkToday(),sp=s.sp,ans=ST.ui.spark[s.day];
  const done=ans!=null;
  return `<div class="row nowrap">${shape('nova','spark')}<h2 id="dc-spark">${T('dc_spark')}</h2></div>
  <p class="bold">${LE(sp.q)}</p>
  <div class="stack-s" role="group" aria-labelledby="dc-spark">${sp.opts.map((op,i)=>
    `<button type="button" class="btn btn-secondary" style="justify-content:flex-start" data-act="spark-answer" data-a="${i}"${done?' disabled':''}${done&&ans===i?' aria-pressed="true"':''}>${esc(L(op))}</button>`).join('')}</div>
  ${done?`<div role="status">${alertBox(ans===sp.ans?'ok':'info',ans===sp.ans?'check':'info',`<p class="bold">${T(ans===sp.ans?'spark_right':'spark_wrong')}</p><p>${LE(sp.why)}</p>`)}</div>`:''}
  <p class="xs muted">${T('spark_note')}</p>`;
}
function cardRewards(){
  const p=pendingRewards();
  return `<div class="row nowrap">${shape('nova','star')}<h2 id="dc-rewards">${T('dc_rewards')}</h2></div>
  <div class="ds-grid"><div class="tok"><span class="muted">${T('xp_confirmed')}</span><b style="font-size:1.6rem">${nf(ST.server.xp)}</b><span class="xs muted">${p.xp?T('plus_pending',{n:nf(p.xp)}):T('none_pending')}</span></div>
  <div class="tok"><span class="muted">${T('coins_confirmed')}</span><b style="font-size:1.6rem">${nf(ST.server.coins)}</b><span class="xs muted">${p.coins?T('plus_pending',{n:nf(p.coins)}):T('none_pending')}</span></div></div>
  <p class="xs muted">${T('rewards_note')}</p>`;
}
function connChip(){
  const n=netState();
  return n==='online'?chip('ok','wifi',t('net_online')):n==='weak'?chip('warn','wifi',t('net_weak')):chip('err','wifiOff',t('net_offline'));
}
function cardSyncs(){
  const q=queueStats();
  return `<div class="row nowrap">${shape('sq','sync')}<h2 id="dc-syncs">${T('dc_syncs')}</h2></div>
  <div class="row">${connChip()}${q.open?chip('warn','clock',t('open_items',{n:nf(q.open)})):chip('ok','check',t('all_synced'))}</div>
  <div><a class="btn btn-secondary" href="#sync">${T('nav_sync')}</a></div>`;
}
function customPanel(){
  const d=ST.prefs.dash;
  return `<section class="card stack" style="margin-bottom:1.5rem" aria-labelledby="cust-h"><h2 id="cust-h">${T('dash_custom')}</h2><p class="muted small">${T('dash_custom_hint')}</p>
  <ul class="lessonlist">${d.order.map((id,i)=>{
    const ess=DASH_ESSENTIAL.includes(id),hid=d.hidden.includes(id);
    return `<li class="row between" style="padding:.3rem .2rem;border-bottom:1px solid var(--border)"><span id="cl-${id}" class="bold grow">${T('dc_'+id)}</span>
    <span class="row nowrap"><button type="button" class="btn btn-secondary btn-icon" data-act="dash-move" data-a="${id}:-1" aria-label="${esc(t('move_up')+': '+t('dc_'+id))}"${i===0?' disabled':''}>${icon('up',18)}</button>
    <button type="button" class="btn btn-secondary btn-icon" data-act="dash-move" data-a="${id}:1" aria-label="${esc(t('move_down')+': '+t('dc_'+id))}"${i===d.order.length-1?' disabled':''}>${icon('down',18)}</button>
    ${ess?`<span class="chip neutral">${icon('lock',16)}${T('required')}</span>`:`<span class="row nowrap">${sw('dash-hide',id,!hid,'cl-'+id)}</span>`}</span></li>`;
  }).join('')}</ul>
  <div><button type="button" class="btn btn-secondary" data-act="dash-reset">${T('reset_layout')}</button></div></section>`;
}
function viewHome(){
  const d=ST.prefs.dash;
  const cards={continue:cardContinue,progress:cardProgress,spark:cardSpark,rewards:cardRewards,syncs:cardSyncs};
  const order=d.order.filter(id=>cards[id]&&(DASH_ESSENTIAL.includes(id)||!d.hidden.includes(id)));
  const wide={continue:1,progress:1};
  return ph(T('home_hi',{name:ST.user.name}),T('home_sub',{date:fmtDate(Date.now())}),
    `<button type="button" class="btn btn-secondary" data-act="dash-custom" aria-expanded="${ui.custom}">${icon('gear',18)}${T('dash_custom')}</button>`)
    +(ui.custom?customPanel():'')
    +`<div class="dash">${order.map(id=>`<section class="card stack${wide[id]?' wide':''}" aria-labelledby="dc-${id}">${cards[id]()}</section>`).join('')}</div>`;
}

/* ---------- tracks and courses ---------- */
function tracksResults(){
  const q=ui.tq.trim().toLowerCase();
  const match=cid=>{const c=COURSES[cid];return!q||(L(c.title)+' '+L(c.desc)).toLowerCase().includes(q)};
  const out=Object.values(TRACKS).map(tr=>{
    const ids=tr.courses.filter(match);
    return ids.length?`<section class="sec" aria-labelledby="tr-${tr.id}"><div><h2 id="tr-${tr.id}">${LE(tr.title)}</h2><p class="muted">${LE(tr.desc)}</p></div>${courseCards(ids)}</section>`:'';
  }).join('');
  return out||emptyState('search',t('no_results'),t('no_results_hint'));
}
function viewTracks(){
  return ph(T('nav_tracks'),T('tracks_sub'))
  +`<div class="row between" style="margin-bottom:1.5rem"><div class="field grow" style="max-width:26rem"><label for="tq">${T('search')}</label><input type="search" id="tq" data-inp="tq" value="${esc(ui.tq)}" autocomplete="off"></div>${styleSeg()}</div>
  <div id="tres" aria-live="polite">${tracksResults()}</div>`;
}
function viewCourse(cid){
  const c=COURSES[cid];if(!c)return viewNotFound();
  const s=skillState(cid);
  const q=ST.progress.quiz[cid],lab=c.lab?LABS[c.lab]:null,lp=c.lab?ST.progress.labs[c.lab]:null;
  return crumbs([{l:t('nav_tracks'),h:'tracks'},{l:L(c.title)}])
  +ph(LE(c.title),LE(c.desc),`<span class="chip neutral">${esc(L(c.level))}</span>`)
  +`<section class="card stack" aria-labelledby="cp-h"><h2 id="cp-h">${T('course_progress')}</h2>${bar(s.content,t('lbl_completion'))}${stepsList(s)}<p class="small muted">${T('progress_note')}</p></section>
  <section class="sec" style="margin-top:2rem" aria-labelledby="ls-h"><h2 id="ls-h">${T('lessons')}</h2><ol class="lessonlist">${c.lessons.map((l,i)=>{
    const done=ST.progress.lessons[l.id];
    return `<li><a class="li" href="#lesson-${cid}-${i+1}"><span class="shp shp-sq" aria-hidden="true">${nf(i+1)}</span><span class="grow bold">${LE(l.title)}</span>${done?statusChip(done.op):chip('neutral','clock',t('lesson_todo'))}${icon('chevron',18,'flip')}</a></li>`;
  }).join('')}</ol></section>
  <section class="sec" aria-labelledby="as-h"><h2 id="as-h">${T('assess_practice')}</h2><div class="cards-grid">
    <article class="card cc card-flat"><div class="row nowrap">${shape('oval','check')}<h3>${T('theory_assess')}</h3></div>
      <p class="small muted">${q?T('quiz_attempts',{n:nf(q.attempts),pct:pctf(q.best)}):T('quiz_none')}</p>
      <div><a class="btn btn-secondary" href="#quiz-${cid}">${q?T('quiz_open'):T('quiz_start')}</a></div></article>
    <article class="card cc card-flat"><div class="row nowrap">${shape('oval','flask')}<h3>${T('practical_lab')}</h3></div>
      ${lab?`<p class="small muted">${LE(lab.title)}</p><div>${lp&&lp.last?statusChip(lp.last.op):''}</div><div><a class="btn btn-secondary" href="#lab-${lab.id}">${T('lab_open')}</a></div>`
        :`<p class="small muted">${T('no_lab')}</p>`}</article>
  </div></section>`;
}

/* ---------- lessons ---------- */
function renderBlock(b){
  if(b.t==='p')return `<p>${LE(b.x)}</p>`;
  if(b.t==='code')return `<pre class="codeblock" dir="ltr" tabindex="0" aria-label="${T('code_example')}"><code>${esc(b.x)}</code></pre>`;
  if(b.t==='note')return `<div class="note">${icon('info',20)}<p>${LE(b.x)}</p></div>`;
  if(b.t==='ul')return `<ul>${b.x.map(i=>`<li>${LE(i)}</li>`).join('')}</ul>`;
  return '';
}
function viewLesson(cid,idx){
  const c=COURSES[cid];if(!c)return viewNotFound();
  const i=(parseInt(idx,10)||1)-1,l=c.lessons[i];if(!l)return viewNotFound();
  const done=ST.progress.lessons[l.id],prev=c.lessons[i-1],next=c.lessons[i+1];
  const exOK=ST.progress.ex[l.id];
  const draft=ST.drafts['e:'+l.id]||'';
  return crumbs([{l:t('nav_tracks'),h:'tracks'},{l:L(c.title),h:'course-'+cid},{l:L(l.title)}])
  +ph(LE(l.title),`${LE(c.title)} · ${T('lesson_of',{a:nf(i+1),b:nf(c.lessons.length)})}`,done?statusChip(done.op):'')
  +`<div class="stack">
  <section class="card card-flat" aria-labelledby="ob-h"><h2 id="ob-h">${T('objectives')}</h2><ul class="obj" style="margin-top:.5rem">${l.obj.map(x=>`<li>${LE(x)}</li>`).join('')}</ul></section>
  <article class="prose" aria-label="${T('lesson_content')}">${l.body.map(renderBlock).join('')}</article>
  ${l.ex?`<section class="card stack" aria-labelledby="ex-h"><div class="row nowrap">${shape('oval','code')}<h2 id="ex-h">${T('practice')}</h2></div>
    <p>${LE(l.ex.prompt)}</p>
    <div class="field"><label for="ex-in">${T('your_code')}</label><textarea id="ex-in" class="code" spellcheck="false" data-inp="ex-draft" data-a="${l.id}">${esc(draft)}</textarea><span class="hint">${T('draft_saved_hint')}</span></div>
    <div class="row"><button type="button" class="btn btn-secondary" data-act="ex-check" data-a="${cid}:${i}">${T('check_btn')}</button>${exOK?chip('ok','check',t('ex_passed_device')):''}</div>
    <div id="ex-fb" aria-live="polite"></div>
    <p class="xs muted">${T('ex_local_note')}</p></section>`:''}
  <section class="card stack" aria-labelledby="done-h"><h2 id="done-h">${T('lesson_finish')}</h2>
    ${done?`<div class="row">${statusChip(done.op)}<span class="small muted">${T('completed_on',{date:fmtDate(done.ts,true)})}</span></div>`
      :`<p class="small muted">${T('complete_hint')}</p><div><button type="button" class="btn btn-primary" data-act="lesson-complete" data-a="${cid}:${i}">${icon('check',18)}${T('mark_complete')}</button></div>`}
    <p class="xs muted">${T('complete_note')}</p></section>
  </div>
  <nav class="pager" aria-label="${T('lesson_nav')}">
    ${prev?`<a class="btn btn-secondary" href="#lesson-${cid}-${i}">${icon('arrow',18,'flipb')}${T('prev_lesson')}</a>`:`<span></span>`}
    ${next?`<a class="btn btn-primary" href="#lesson-${cid}-${i+2}">${T('next_lesson')}${icon('arrow',18,'flip')}</a>`:`<a class="btn btn-primary" href="#quiz-${cid}">${T('take_assess')}${icon('arrow',18,'flip')}</a>`}
  </nav>`;
}

/* ---------- theory assessment ---------- */
function viewQuiz(cid){
  const c=COURSES[cid];if(!c)return viewNotFound();
  const p=ST.progress.quiz[cid];
  const mode=ui.qmode[cid]||(p&&p.last?'result':'take');
  const head=crumbs([{l:t('nav_tracks'),h:'tracks'},{l:L(c.title),h:'course-'+cid},{l:t('theory_assess')}])
    +ph(T('theory_assess'),LE(c.title));
  if(mode==='result'&&p&&p.last){
    const ls=p.last,srv=p.srv,passed=ls.pct>=70;
    return head+`<div class="stack">
    <section class="card stack" aria-labelledby="qr-h"><h2 id="qr-h">${T('quiz_result')}</h2>
      <div class="row"><b style="font-size:1.8rem">${pctf(ls.pct)}</b>${chip('warn','lock',t('provisional_device'))}${statusChip(ls.op)}</div>
      ${srv?`<p>${T('quiz_server_score',{pct:pctf(srv.pct)})}</p>`:`<p class="small muted">${T('quiz_provisional_note')}</p>`}
      <p class="small">${T(passed?'quiz_pass_local':'quiz_fail_local')}</p>
      ${alertBox('info','info',`<p>${T('quiz_rule')}</p>`)}
    </section>
    ${c.quiz.map((q,qi)=>{
      const a=ls.answers[qi],ok=a===q.ans;
      return `<section class="q" aria-labelledby="qq-${qi}"><h3 id="qq-${qi}">${nf(qi+1)}. ${LE(q.q)}</h3>
      <div class="fb">${alertBox(ok?'ok':'err',ok?'check':'xcircle',`<p class="bold">${T(ok?'correct':'incorrect')}</p><p>${T('you_chose')}: ${a==null?esc(t('no_answer')):LE(q.opts[a])}</p>${ok?'':`<p>${T('correct_is')}: ${LE(q.opts[q.ans])}</p>`}<p>${LE(q.why)}</p>`)}</div></section>`;
    }).join('')}
    <div class="row"><button type="button" class="btn btn-primary" data-act="quiz-retry" data-a="${cid}">${icon('refresh',18)}${T('retry')}</button><a class="btn btn-secondary" href="#course-${cid}">${T('back_course')}</a></div>
    </div>`;
  }
  const draft=ST.drafts['q:'+cid]||[];
  const err=ui.qerr[cid];
  return head+`<form class="stack" data-form="quiz" data-a="${cid}" novalidate>
    <p class="muted">${T('quiz_intro',{n:nf(c.quiz.length)})}</p>
    ${err?`<div role="alert" id="q-err">${alertBox('err','alert',`<p class="bold">${T('quiz_unanswered')}</p>`)}</div>`:''}
    ${c.quiz.map((q,qi)=>`<fieldset class="q"><legend>${nf(qi+1)}. ${LE(q.q)}</legend><div class="opts">${q.opts.map((op,oi)=>
      `<label class="opt"><input type="radio" name="q${qi}" value="${oi}" data-chg="q-pick" data-a="${cid}:${qi}:${oi}"${draft[qi]===oi?' checked':''}><span>${LE(op)}</span></label>`).join('')}</div>
      ${err&&draft[qi]==null?`<p class="err-msg" style="margin-top:.5rem">${icon('alert',16)}<span>${T('pick_one')}</span></p>`:''}</fieldset>`).join('')}
    <div class="row"><button type="submit" class="btn btn-primary">${T('submit')}</button><a class="btn btn-secondary" href="#course-${cid}">${T('back_course')}</a></div>
    <p class="xs muted">${T('draft_saved_hint')}</p></form>`;
}

/* ---------- practice labs ---------- */
function labStatus(id){
  const lp=ST.progress.labs[id];
  if(!lp||!lp.last)return chip('neutral','clock',t('lab_not_started'));
  return statusChip(lp.last.op);
}
function viewLabs(){
  return ph(T('nav_labs'),T('labs_sub'))
  +`<div class="cards-grid">${Object.values(LABS).map(lb=>{
    const c=COURSES[lb.course],lp=ST.progress.labs[lb.id];
    return `<article class="card cc card-flat"><div class="row nowrap">${shape('oval','flask')}<div class="grow"><h3><a href="#lab-${lb.id}" style="color:inherit">${LE(lb.title)}</a></h3><span class="small muted">${LE(c.title)}</span></div></div>
    <p class="small">${LE(lb.brief)}</p><div class="row">${labStatus(lb.id)}${lp&&lp.last?chip(lp.pass?'ok':'warn',lp.pass?'check':'alert',t(lp.pass?'lab_met_local':'lab_unmet_local')):''}</div>
    <div><a class="btn btn-secondary" href="#lab-${lb.id}">${T('lab_open')}</a></div></article>`;
  }).join('')}</div>`;
}
function labResult(lb,last,srv){
  const ev=last.ev;
  return `<section class="card stack" aria-labelledby="lr-h"><h2 id="lr-h">${T('lab_result')}</h2>
    <div class="row"><b style="font-size:1.6rem">${pctf(ev.score)}</b>${chip('warn','lock',t('provisional_device'))}${statusChip(last.op)}</div>
    ${srv?alertBox(srv.pass?'ok':'warn',srv.pass?'check':'alert',`<p class="bold">${T('lab_server',{score:pctf(srv.score)})}</p><p>${T(srv.pass?'lab_server_pass':(srv.essOK?'lab_server_low':'lab_server_ess'))}</p>`)
         :`<p class="small muted">${T('lab_prov_note')}</p>`}
    <ul class="lessonlist">${lb.criteria.map(cr=>{
      const r=ev.res.find(x=>x.id===cr.id);
      return `<li class="row nowrap" style="padding:.2rem 0">${r.ok?chip('ok','check',t('met')):chip('err','xcircle',t('not_met'))}<span class="grow">${LE(cr.label)}${cr.ess?` <span class="chip neutral" style="margin-inline-start:.4rem">${T('essential')}</span>`:''}</span></li>`;
    }).join('')}</ul>
    ${!ev.essOK?alertBox('err','alert',`<p>${T('lab_ess_failed')}</p>`):''}
  </section>`;
}
function viewLab(id){
  const lb=LABS[id];if(!lb)return viewNotFound();
  const c=COURSES[lb.course],lp=ST.progress.labs[id]||{};
  const dr=ST.drafts['l:'+id]||(lp.last?lp.last.sub:null)||(lb.kind==='code'?{code:lb.starter}:{remove:[],reason:''});
  const srv=ST.server.labs[id];
  let work;
  if(lb.kind==='code'){
    work=`<div class="field"><label for="lab-code">${T('your_code')}</label><textarea id="lab-code" class="code" spellcheck="false" data-inp="lab-code" data-a="${id}">${esc(dr.code||'')}</textarea><span class="hint">${T('draft_saved_hint')}</span></div>`;
  }else{
    work=`<div class="tbl-wrap"><table><caption class="sr">${LE(lb.title)}</caption><thead><tr>${lb.cols.map(cl=>`<th scope="col">${LE(cl.l)}</th>`).join('')}</tr></thead>
      <tbody>${lb.rows.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <fieldset><legend>${T('cols_remove')}</legend><div class="stack-s">${lb.cols.map(cl=>
      `<label class="opt"><input type="checkbox" value="${cl.id}" data-chg="lab-col" data-a="${id}:${cl.id}"${(dr.remove||[]).includes(cl.id)?' checked':''}><span>${LE(cl.l)}</span></label>`).join('')}</div></fieldset>
    <div class="field"><label for="lab-reason">${T('your_reason')}</label><textarea id="lab-reason" data-inp="lab-reason" data-a="${id}" maxlength="400">${esc(dr.reason||'')}</textarea><span class="hint">${T('draft_saved_hint')}</span></div>`;
  }
  return crumbs([{l:t('nav_labs'),h:'labs'},{l:L(lb.title)}])
  +ph(LE(lb.title),LE(c.title),labStatus(id))
  +`<div class="stack">
  <section class="card stack" aria-labelledby="lb-h"><div class="row nowrap">${shape('oval','flask')}<h2 id="lb-h">${T('lab_task')}</h2></div><p>${LE(lb.brief)}</p>
    <details><summary class="bold" style="min-height:44px;display:flex;align-items:center;cursor:pointer">${T('lab_hints')}</summary><ul class="obj">${lb.hints.map(h=>`<li>${LE(h)}</li>`).join('')}</ul></details></section>
  <section class="card stack" aria-labelledby="rb-h"><h2 id="rb-h">${T('rubric')}</h2>
    <div class="tbl-wrap"><table class="tbl-stack"><thead><tr><th scope="col">${T('criterion')}</th><th scope="col">${T('weight')}</th><th scope="col">${T('type')}</th></tr></thead>
    <tbody>${lb.criteria.map(cr=>`<tr><td data-label="${T('criterion')}">${LE(cr.label)}</td><td data-label="${T('weight')}">${pctf(cr.w)}</td><td data-label="${T('type')}">${cr.ess?chip('warn','alert',t('essential')):chip('neutral','info',t('standard'))}</td></tr>`).join('')}</tbody></table></div>
    <p class="small muted">${T('rubric_rule')}</p></section>
  <form class="card stack" data-form="lab" data-a="${id}" novalidate aria-labelledby="wk-h"><h2 id="wk-h">${T('workspace')}</h2>${work}
    <div class="row"><button type="submit" class="btn btn-primary">${T('submit_lab')}</button><button type="button" class="btn btn-secondary" data-act="lab-reset" data-a="${id}">${T('reset_work')}</button></div>
    <p class="xs muted">${T('lab_demo_note')}</p></form>
  ${lp.last?labResult(lb,lp.last,srv):''}
  </div>`;
}

/* ---------- skill passport ---------- */
function viewPassport(){
  const cards=COURSE_ORDER.map(cid=>{
    const c=COURSES[cid],s=skillState(cid),lab=c.lab?LABS[c.lab]:null;
    const box=(h,body)=>`<div class="tok"><b>${h}</b>${body}</div>`;
    return `<article class="card stack" aria-labelledby="pp-${cid}"><div class="row between"><div class="row nowrap">${shape('nova','badge')}<h2 id="pp-${cid}">${LE(c.title)}</h2></div>${skillChip(s)}</div>
    ${stepsList(s)}
    <div class="ds-grid">
      ${box(T('st_content'),`<span>${T('conf_of',{a:nf(s.done),b:nf(s.n)})}</span><span class="xs muted">${T('confirmed_n',{n:nf(s.srvDone)})}</span>`)}
      ${box(T('st_theory'),s.q?`<span>${T('best_prov',{pct:pctf(s.q.best)})}</span><span class="xs muted">${s.sq?T('confirmed_pct',{pct:pctf(s.sq.pct)}):T('not_confirmed')}</span>`:`<span class="muted">${T('not_taken')}</span>`)}
      ${box(T('st_practical'),lab?(s.lab&&s.lab.last?`<span>${T('best_prov',{pct:pctf(s.lab.score)})}</span><span class="xs muted">${s.sl?T(s.sl.pass?'conf_pass':'conf_notpass'):T('not_confirmed')}</span>`:`<span class="muted">${T('not_taken')}</span>`):`<span class="muted">${T('no_lab')}</span>`)}
      ${box(T('st_verified'),s.verified?`<span class="bold" style="color:var(--ok)">${T('sk_verified')}</span>`:`<span class="muted">${T(s.hasLab?'ver_needs':'ver_na')}</span>`)}
    </div></article>`;
  }).join('');
  const exp=Object.values(LABS).filter(lb=>{const lp=ST.progress.labs[lb.id];return lp&&lp.pass}).map(lb=>{
    const lp=ST.progress.labs[lb.id],srv=ST.server.labs[lb.id];
    return `<article class="card card-ach stack"><div class="row nowrap">${shape('nova','star')}<div class="grow"><h3>${LE(lb.title)}</h3><p class="small muted">${LE(COURSES[lb.course].title)}</p></div></div>
    <p class="small">${T('score_label')}: ${pctf(lp.score)}</p><div>${srv&&srv.pass?chip('ok','shield',t('evidence_confirmed')):chip('warn','lock',t('evidence_prov'))}</div></article>`;
  }).join('');
  return ph(T('nav_passport'),T('passport_sub'))
  +alertBox('info','info',`<p class="bold">${T('passport_rule_t')}</p><p>${T('passport_rule')}</p>`)
  +`<div class="stack" style="margin-top:1.5rem">${cards}
  <section class="sec" aria-labelledby="pf-h"><h2 id="pf-h">${T('portfolio')}</h2>${exp?`<div class="cards-grid">${exp}</div>`:emptyState('badge',t('portfolio_empty'),t('portfolio_empty_hint'))}</section>
  <section class="card stack card-flat" aria-labelledby="ce-h"><h2 id="ce-h">${T('certs')}</h2><p>${T('certs_note')}</p></section></div>`;
}
