'use strict';
/* NovaLearn AI — engine: connection state, durable sync queue, simulated server, skills, notifications, Companion replies.
   IMPORTANT: there is no real backend in this build. "Server" below is a local simulation that exists to demonstrate
   the design system's rules (idempotency, ordering, provisional results, server-validated outcomes). */

/* ---------- small utilities ---------- */
const locks=new Set();
function lock(k,ms){if(locks.has(k))return false;locks.add(k);setTimeout(()=>locks.delete(k),ms||900);return true}
function announce(msg){const el=$('#live');if(el){el.textContent='';setTimeout(()=>{el.textContent=msg},30)}}

/* ---------- connection state (browser status + optional simulator) ---------- */
let netMode='auto';
function netState(){
  if(netMode==='offline')return'offline';
  if(netMode==='weak')return'weak';
  return(typeof navigator!=='undefined'&&navigator.onLine===false)?'offline':'online';
}
function onNetChange(state){
  if(state==='offline')toast(t('toast_offline'),'warn');
  else if(state==='weak')toast(t('toast_weak'),'info');
  else{toast(t('toast_online'),'ok');setTimeout(pump,100)}
  renderStatus();
}
function setNetMode(m){
  const before=netState();netMode=m;const after=netState();
  if(before!==after)onNetChange(after);else renderStatus();
}

/* ---------- audit + notifications ---------- */
function audit(action,detail){
  ST.audit.unshift({id:uid(),ts:Date.now(),actor:ST.user?ST.user.email:'visitor',action:action,detail:detail||''});
  ST.audit=ST.audit.slice(0,100);save();
}
function notify(cat,tk,bk,p){
  if(cat!=='account'&&ST.prefs.notif[cat]===false)return;
  ST.notifs.unshift({id:uid(),cat:cat,tk:tk,bk:bk,p:p||{},ts:Date.now(),read:false});
  ST.notifs=ST.notifs.slice(0,60);save();
  if(typeof renderShell==='function')renderShell();
}
function notifText(n){
  const pr=Object.assign({},n.p);
  if(pr.cid&&COURSES[pr.cid])pr.course=L(COURSES[pr.cid].title);
  if(pr.lab&&LABS[pr.lab])pr.labname=L(LABS[pr.lab].title);
  if(pr.pct!=null)pr.pct=pctf(pr.pct);
  if(pr.score!=null)pr.score=pctf(pr.score);
  if(pr.ts)pr.time=fmtDate(pr.ts,true);
  return{title:t(n.tk,pr),body:t(n.bk,pr)};
}
const unreadCount=()=>ST.notifs.filter(n=>!n.read).length;

/* ---------- evaluation (used by the simulated server) ---------- */
function evalQuiz(cid,answers){
  const c=COURSES[cid];
  const correct=c.quiz.filter((q,i)=>answers[i]===q.ans).length;
  return{correct:correct,total:c.quiz.length,pct:Math.round(100*correct/c.quiz.length)};
}
function evalLab(id,sub){
  const lab=LABS[id];let score=0;
  const res=lab.criteria.map(c=>{const ok=!!c.test(sub);if(ok)score+=c.w;return{id:c.id,ok:ok,ess:c.ess}});
  const essOK=res.every(r=>!r.ess||r.ok);
  return{score:score,res:res,essOK:essOK,pass:essOK&&score>=70};
}

/* ---------- durable sync queue ---------- */
function enqueue(type,payload){
  const prior=ST.queue.filter(x=>x.payload.cid===payload.cid&&x.status!=='done').pop();
  const op={id:uid(),type:type,payload:payload,dep:prior?prior.id:null,status:'pending',attempts:0,next:0,created:Date.now(),error:''};
  ST.queue.push(op);save();renderStatus();setTimeout(pump,60);
  return op;
}
const opStatus=id=>{const o=ST.queue.find(x=>x.id===id);return o?o.status:'local'};
function statusChip(id){
  const s=opStatus(id);
  const m={local:['neutral','lock','st_local'],pending:['warn','clock','st_pending'],syncing:['info','sync','st_syncing'],done:['ok','check','st_done'],failed:['err','alert','st_failed'],blocked:['warn','clock','st_blocked']}[s]||['neutral','lock','st_local'];
  return chip(m[0],m[1],t(m[2]));
}
function queueStats(){
  const s={pending:0,syncing:0,failed:0,blocked:0,done:0};
  ST.queue.forEach(o=>{s[o.status]=(s[o.status]||0)+1});
  s.open=s.pending+s.syncing+s.failed+s.blocked;
  return s;
}
function serverCall(op){
  return new Promise(res=>{
    const n=netState();
    setTimeout(()=>{
      const now=netState();
      if(now==='offline')return res({ok:false,err:'offline'});
      if(now==='weak'&&Math.random()<0.4)return res({ok:false,err:'timeout'});
      res(serverApply(op));
    },n==='weak'?1200:450);
  });
}
/* Simulated server: idempotent by operation id; recomputes scores itself; awards XP/Coins once. */
function serverApply(op){
  const S=ST.server;
  if(S.processed[op.id])return{ok:true,dup:true,rewards:{xp:0,coins:0}};
  S.processed[op.id]=true;
  let xp=0,coins=0,result=null;const p=op.payload;
  if(op.type==='lesson'){
    if(!S.lessons[p.lid]){S.lessons[p.lid]=true;xp=10}
  }else if(op.type==='quiz'){
    const ev=evalQuiz(p.cid,p.answers);const prev=S.quiz[p.cid];const was=!!(prev&&prev.passed);
    S.quiz[p.cid]={pct:Math.max(prev?prev.pct:0,ev.pct),passed:was||ev.pct>=70};
    if(!was&&ev.pct>=70){xp=30;coins=5}
    result={pct:ev.pct};
  }else if(op.type==='lab'){
    const ev=evalLab(p.lid,p.sub);const prev=S.labs[p.lid];const was=!!(prev&&prev.pass);
    if(!was)S.labs[p.lid]={score:ev.score,pass:ev.pass,essOK:ev.essOK};
    if(!was&&ev.pass){xp=50;coins=10}
    result={score:ev.score,pass:ev.pass,essOK:ev.essOK};
  }
  S.xp+=xp;S.coins+=coins;
  return{ok:true,dup:false,rewards:{xp:xp,coins:coins},result:result};
}
function onAccepted(op,r){
  const p=op.payload;
  if(op.type==='quiz'&&ST.progress.quiz[p.cid]){
    ST.progress.quiz[p.cid].srv=r.result;
    notify('learning','n_quiz_t','n_quiz_b',{cid:p.cid,pct:r.result.pct});
  }else if(op.type==='lab'&&ST.progress.labs[p.lid]){
    ST.progress.labs[p.lid].srv=r.result;
    notify('learning','n_lab_t','n_lab_b',{lab:p.lid,score:r.result.score,res:r.result.pass?1:0});
  }
}
let pumping=false;
async function pump(){
  if(pumping||netState()==='offline')return;
  pumping=true;let did=false;
  try{
    for(const op of ST.queue){
      if(op.status==='done'||op.status==='failed')continue;
      if(op.status==='pending'&&op.next>Date.now())break;
      const dep=op.dep&&ST.queue.find(x=>x.id===op.dep);
      if(dep&&dep.status!=='done'){
        if(op.status!=='blocked'){op.status='blocked';save();renderStatus()}
        continue;
      }
      op.status='syncing';renderStatus();
      const r=await serverCall(op);
      if(r.ok){
        op.status='done';op.syncedAt=Date.now();op.error='';did=true;onAccepted(op,r);
      }else{
        op.attempts++;op.error=r.err;
        if(op.attempts>=3){op.status='failed';notify('system','n_fail_t','n_fail_b',{})}
        else{op.status='pending';op.next=Date.now()+1500*Math.pow(2,op.attempts)}
      }
      save();renderStatus();refreshLive();
      if(!r.ok)break;
    }
    if(did&&!ST.queue.some(x=>x.status!=='done'))notify('system','n_sync_t','n_sync_b',{});
  }catch(e){/* keep queue intact; next tick retries */}
  finally{pumping=false}
}
function retryFailed(){
  ST.queue.forEach(o=>{if(o.status==='failed'||o.status==='blocked'){o.status='pending';o.attempts=0;o.next=0;o.error=''}});
  save();renderStatus();pump();
}
function syncNow(){ST.queue.forEach(o=>{if(o.status==='pending')o.next=0});save();pump()}

/* ---------- progress, skills, rewards ---------- */
function lessonsDone(cid){return COURSES[cid].lessons.filter(l=>ST.progress.lessons[l.id]).length}
function skillState(cid){
  const c=COURSES[cid],n=c.lessons.length;
  const done=lessonsDone(cid);
  const srvDone=c.lessons.filter(l=>ST.server.lessons[l.id]).length;
  const q=ST.progress.quiz[cid]||null,sq=ST.server.quiz[cid]||null;
  const lab=c.lab?(ST.progress.labs[c.lab]||null):null,sl=c.lab?(ST.server.labs[c.lab]||null):null;
  const verified=!!(c.lab&&srvDone===n&&sq&&sq.pct>=70&&sl&&sl.pass);
  return{n:n,done:done,srvDone:srvDone,q:q,sq:sq,lab:lab,sl:sl,hasLab:!!c.lab,verified:verified,
    theoryOK:!!(q&&q.best>=70),content:Math.round(100*done/n)};
}
function pendingRewards(){
  let xp=0,coins=0;
  ST.queue.forEach(o=>{
    if(o.status==='done')return;
    const p=o.payload;
    if(o.type==='lesson'&&!ST.server.lessons[p.lid])xp+=10;
    if(o.type==='quiz'&&!(ST.server.quiz[p.cid]&&ST.server.quiz[p.cid].passed)&&evalQuiz(p.cid,p.answers).pct>=70){xp+=30;coins+=5}
    if(o.type==='lab'&&!(ST.server.labs[p.lid]&&ST.server.labs[p.lid].pass)&&evalLab(p.lid,p.sub).pass){xp+=50;coins+=10}
  });
  return{xp:xp,coins:coins};
}
function nextLesson(){
  for(const cid of COURSE_ORDER){
    const c=COURSES[cid];
    for(let i=0;i<c.lessons.length;i++)if(!ST.progress.lessons[c.lessons[i].id])return{cid:cid,idx:i,lesson:c.lessons[i]};
  }
  return null;
}
function storageBytes(){try{return new Blob([JSON.stringify(ST)]).size}catch(e){return JSON.stringify(ST).length}}

/* ---------- Nova Companion: scripted demo replies ---------- */
/* No language model is connected. Replies are rule-based so the interface rules can be tested.
   Companion gives explanations and hints and never completes assessments. */
const KB=[
 {k:/print|طباع|اطبع/i,
  en:{e:'print() shows a value on the screen. Text goes inside quotation marks, for example print("Hello").',h:'Check that your text is inside quotation marks and that the brackets match.',q:'What do you expect to happen if you remove the quotation marks?'},
  ar:{e:'الدالة print() تعرض قيمة على الشاشة. يوضع النص بين علامتي اقتباس، مثل print("مرحبا").',h:'تحقق أن النص بين علامتي اقتباس وأن الأقواس متطابقة.',q:'ماذا تتوقع أن يحدث لو حذفت علامتي الاقتباس؟'}},
 {k:/variable|متغير/i,
  en:{e:'A variable stores a value under a name, for example city = "Khartoum". You can use the name later.',h:'Assign first with =, then use the name, for example print(city).',q:'What name would make your variable easy to understand later?'},
  ar:{e:'المتغير يخزّن قيمة تحت اسم، مثل city = "Khartoum"، وتستخدم الاسم لاحقًا.',h:'أسنِد القيمة أولًا بعلامة = ثم استخدم الاسم، مثل print(city).',q:'ما الاسم الذي يجعل متغيرك واضحًا لاحقًا؟'}},
 {k:/function|def\b|return|دالة|دوال/i,
  en:{e:'A function groups steps you can reuse. def defines it and return sends a result back to the caller.',h:'Write the def line first, indent the body, then use return for the result.',q:'What input does your function need, and what should it give back?'},
  ar:{e:'الدالة تجمع خطوات يمكن إعادة استخدامها. تعرّفها def وتُرجع النتيجة return.',h:'اكتب سطر def أولًا، ثم أزح الجسم إلى الداخل، ثم استخدم return للنتيجة.',q:'ما المدخلات التي تحتاجها دالتك وماذا يجب أن ترجع؟'}},
 {k:/\bai\b|artificial|hallucinat|ذكاء|هلوس/i,
  en:{e:'AI tools predict likely text from patterns. A fluent answer can still be wrong, so important answers need a trusted source.',h:'Ask the tool where its claim comes from, then check that source yourself.',q:'How would you check one claim from an AI answer?'},
  ar:{e:'أدوات الذكاء الاصطناعي تتوقع النص المحتمل من الأنماط. قد تكون الإجابة السلسة خاطئة، لذا تحتاج الإجابات المهمة إلى مصدر موثوق.',h:'اسأل الأداة عن مصدر الادعاء ثم تحقق منه بنفسك.',q:'كيف تتحقق من ادعاء واحد في إجابة ذكاء اصطناعي؟'}},
 {k:/personal|privacy|identif|phone|خصوص|شخصي|معرّف|معرف|هاتف/i,
  en:{e:'Direct identifiers such as names and phone numbers point to one person. Share only the columns the analysis needs.',h:'List each column and ask: does this point directly to a person, or can it do so in combination?',q:'Which columns does the analysis really need?'},
  ar:{e:'المعرّفات المباشرة مثل الأسماء وأرقام الهواتف تشير إلى شخص واحد. شارك الأعمدة التي يحتاجها التحليل فقط.',h:'اذكر كل عمود واسأل: هل يشير مباشرة إلى شخص أو قد يفعل ذلك بالتركيب مع غيره؟',q:'ما الأعمدة التي يحتاجها التحليل فعلًا؟'}},
 {k:/sync|offline|queue|مزامن|اتصال|أوفلاين|بدون انترنت/i,
  en:{e:'When you are offline, your work is saved on this device and waits in a queue. It is provisional until the server accepts it.',h:'Open Sync & storage to see each item and its state.',q:'Which of your items are still waiting to sync?'},
  ar:{e:'عند انقطاع الاتصال يُحفظ عملك على هذا الجهاز وينتظر في طابور. وتبقى النتيجة مؤقتة إلى أن يقبلها الخادم.',h:'افتح صفحة المزامنة والتخزين لترى كل عنصر وحالته.',q:'أي عناصرك ما زالت تنتظر المزامنة؟'}},
 {k:/chart|table|axis|رسم|جدول|محور/i,
  en:{e:'Read a chart from the title, units and axis labels first. Then check the period and any missing values.',h:'Check whether the axis starts at zero before comparing bar heights.',q:'What would change if the axis started at zero?'},
  ar:{e:'اقرأ الرسم بالعنوان والوحدات وتسميات المحاور أولًا، ثم تحقق من الفترة والقيم الناقصة.',h:'تحقق هل يبدأ المحور من الصفر قبل مقارنة ارتفاعات الأعمدة.',q:'ما الذي سيتغير لو بدأ المحور من الصفر؟'}},
 {k:/passport|verified|master|competen|جواز|مهارة|إتقان|اتقان|موثق/i,
  en:{e:'Finishing lessons, passing theory, performing in a lab and being verified are four different things. Verified needs all of them, accepted by the server.',h:'Open Skill Passport to see which stage each skill has reached.',q:'Which stage is next for your skill?'},
  ar:{e:'إنهاء الدروس واجتياز النظري والأداء العملي والتوثيق أربعة أشياء مختلفة. التوثيق يحتاجها جميعًا بعد قبول الخادم.',h:'افتح جواز المهارات لترى المرحلة التي بلغتها كل مهارة.',q:'ما المرحلة التالية لمهارتك؟'}}
];
const DIAL={
  greet:'أهلاً يا زول! أنا رفيق نوفا. قول لي شنو عايز تتعلم اليوم؟',
  pre:'تمام يا زول،',
  unsure:'والله ما متأكد من الحاجة دي وما عايز أخمّن. جرّب تسألني بطريقة تانية، أو راجع نص الدرس، أو اسأل المعلم.'
};
function companionCtx(){
  const r=(typeof R!=='undefined')?R:{name:'home',args:[]};
  const x={route:r.name,title:''};
  if(r.name==='lesson'&&COURSES[r.args[0]]){const l=COURSES[r.args[0]].lessons[(+r.args[1]||1)-1];if(l)x.title=L(l.title)}
  else if(r.name==='course'&&COURSES[r.args[0]])x.title=L(COURSES[r.args[0]].title);
  else if(r.name==='quiz'&&COURSES[r.args[0]])x.title=L(COURSES[r.args[0]].title);
  else if(r.name==='lab'&&LABS[r.args[0]])x.title=L(LABS[r.args[0]].title);
  return x;
}
function companionReply(input){
  const raw=String(input||'').trim();
  const ctx=companionCtx();
  const d=ST.prefs.dialect&&lang()==='ar';
  if((ctx.route==='quiz'||ctx.route==='lab')&&/(answer|solution|الإجابة|الاجابة|الجواب|الحل)/i.test(raw))return t('cp_refuse');
  if(/^(hi|hello|hey|مرحبا|مرحباً|سلام|السلام|اهلا|أهلا|أهلاً)/i.test(raw))return d?DIAL.greet:t('cp_greet');
  const hit=KB.find(x=>x.k.test(raw));
  let out;
  if(hit){
    const c=hit[lang()]||hit.en;const mode=ST.companion.mode;
    if(mode==='teacher')out=c.e;
    else if(mode==='partner')out=c.q+'\n'+c.h;
    else out=c.h+'\n'+t('cp_next');
    if(ctx.title&&mode==='teacher')out+='\n'+t('cp_ctx',{title:ctx.title});
    if(d)out=DIAL.pre+' '+out;
  }else{
    out=d?DIAL.unsure:t('cp_unsure');
    if(ctx.title)out+='\n'+t('cp_ctx',{title:ctx.title});
  }
  return out;
}

/* ---------- Companion voice (permission only; no speech processing in this build) ---------- */
const voice={state:'off'};
async function requestVoice(){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){voice.state='unsupported';renderCompanion();return}
  voice.state='requesting';renderCompanion();
  try{
    const s=await navigator.mediaDevices.getUserMedia({audio:true});
    s.getTracks().forEach(tr=>tr.stop());
    voice.state='ready';
  }catch(e){voice.state='denied'}
  renderCompanion();
}
