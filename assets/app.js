(() => {
 'use strict';
 const C=EscalaCore,S=EscalaStorage,D=EscalaChanges,$=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const icon=s=>'<svg aria-hidden="true"><use href="#i-'+s+'"/></svg>';
 const clone=x=>JSON.parse(JSON.stringify(x));
 const fmtDate=(date,year=false)=>date.slice(8,10)+'/'+date.slice(5,7)+(year?'/'+date.slice(0,4):'');
 const fmtMonth=month=>new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'-01T12:00Z'));
 const weekday=date=>new Intl.DateTimeFormat('pt-BR',{weekday:'long',timeZone:'UTC'}).format(new Date(date+'T12:00Z'));
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:C.TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 let state={version:4,person:'',current:null,roster:null,comparison:null,theme:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'},month=today.slice(0,7),selected=today,listMode=false,pendingRoster=null,ready=false,protectUnreadable=false,reviewId=null,toastTimer=null;
 const absent=e=>e.type==='absence'||e.status==='absent';
 const kind=e=>absent(e)?'absence':e.type==='regular'?e.shift:e.type;
 const label=e=>absent(e)?'Ausência':e.type==='training'?'Treinamento':e.type==='support'?'Apoio':e.type==='special'?'Observação':e.type==='review'?'Conferir':e.shift==='night'?'Noturno':'Diurno';
 const activity=e=>e.annotation||e.activity;
 const reason=e=>C.normalize(activity(e))==='bh'?'BH — Banco de Horas':activity(e);
 const hours=e=>e.shift==='night'?'19h00 → 07h00 (+1 dia)':'07h00 → 19h00';
 const totalHours=events=>events.filter(e=>!absent(e)).reduce((sum,e)=>sum+(e.workHours??12),0);
 const tag=e=>'<span class="tag '+kind(e)+'">'+icon(absent(e)?'close':e.type==='special'?'info':e.type==='training'?'book':e.shift==='night'?'moon':'sun')+esc(label(e))+'</span>';
 function warnStorage(message){$('storage-warning').textContent=message;$('storage-warning').hidden=false;}
 function validateSchedule(c){
  if(!c||c.parseVersion!==3||typeof c.person!=='string'||!/^20\d{2}-\d{2}$/.test(c.month)||Number(c.month.slice(5))<1||Number(c.month.slice(5))>12||typeof c.fileName!=='string'||!Number.isFinite(Date.parse(c.importedAt))||!Array.isArray(c.events)||!Array.isArray(c.issues)||!Array.isArray(c.missingDays)||!c.coverage)throw Error('Escala salva inválida.');
  C.validateEvents(c.events);
 }
 function validateState(saved){
  if(!saved||saved.version!==4||typeof saved.person!=='string'||!['light','dark'].includes(saved.theme))throw Error('Dados salvos incompatíveis.');
  if(saved.current){validateSchedule(saved.current);if(saved.current.person!==saved.person)throw Error('Funcionário incompatível.');}
  if(saved.comparison){try{
   const comparison=saved.comparison;
   if(comparison.version!==1)throw Error();
   if(comparison.previous){const p=comparison.previous;if(typeof p.fileName!=='string'||!Array.isArray(p.names)||!p.names.every(n=>typeof n==='string')||!Array.isArray(p.schedules)||!p.schedules.length||!Array.isArray(p.failures))throw Error();p.schedules.forEach(validateSchedule);}
   else if(comparison.reason!=='different-month')throw Error();
  }catch{saved.comparison=null;}}
  if(saved.roster){
   const r=saved.roster;
   if(r.version!==1||typeof r.fileName!=='string'||!Array.isArray(r.names)||!r.names.length||!r.names.every(n=>typeof n==='string')||!Array.isArray(r.schedules)||!Array.isArray(r.failures)||new Set(r.names.map(C.normalize)).size!==r.names.length)throw Error('Lista salva inválida.');
   const entries=[...r.schedules,...r.failures];
   if(entries.length!==r.names.length||new Set(entries.map(x=>C.normalize(x.person))).size!==r.names.length||r.names.some(n=>!entries.some(x=>C.normalize(x.person)===C.normalize(n))))throw Error('Lista incompleta.');
   r.schedules.forEach(validateSchedule);
   if(r.sourceSchedules){if(!Array.isArray(r.sourceSchedules)||r.sourceSchedules.length!==r.schedules.length)throw Error('Base da planilha inválida.');r.sourceSchedules.forEach(validateSchedule);if(r.schedules.some(c=>!r.sourceSchedules.some(s=>s.person===c.person&&s.month===c.month&&s.fileName===c.fileName)))throw Error('Base da planilha incompatível.');}
   if(r.failures.some(x=>typeof x.message!=='string'))throw Error('Falha de leitura inválida.');
   if(saved.current&&!r.schedules.some(x=>x.person===saved.person&&x.month===saved.current.month&&x.fileName===saved.current.fileName)&&!(saved.current.missingFromRoster&&D.missingSchedule(r,saved.comparison,saved.person)))throw Error('Escala incompatível com a planilha salva.');
  }
  return saved;
 }
 function rememberCurrent(){
  if(!state.roster||!state.current)return;
  const i=state.roster.schedules.findIndex(c=>c.person===state.person);
  if(i>=0)state.roster.schedules[i]=clone(state.current);
 }
 async function save(){
  if(!ready||(protectUnreadable&&!state.current))return false;
  rememberCurrent();
  const result=await S.write(state);
  if(!result.ok){warnStorage('Não foi possível salvar neste aparelho. Os dados continuam nesta sessão; mantenha a planilha para anexar novamente.');return false;}
  $('storage-warning').hidden=true;
  return true;
 }
 async function restore(){
  let damaged=false;
  const {candidates,unavailable}=await S.read();
  for(const record of candidates){try{if(record.format!==1)throw Error();state=validateState(record.state);return;}catch{damaged=true;}}
  try{
   const raw=localStorage.getItem('minha-escala-simples-v3');
   if(raw){const prior=JSON.parse(raw);if(prior.version!==3)throw Error();state=validateState({...prior,version:4,roster:null});return;}
   const old=localStorage.getItem('minha-escala-simples-v2');
   if(old){const prior=JSON.parse(old);state.person=typeof prior.person==='string'?prior.person:'';if(['light','dark'].includes(prior.theme))state.theme=prior.theme;warnStorage('Leitura atualizada: anexe novamente a planilha para aplicar as observações e os nomes tachados.');}
  }catch{damaged=true;}
  if(damaged){protectUnreadable=true;warnStorage('Não foi possível recuperar os dados anteriores. Eles foram preservados no armazenamento. Anexe a planilha para continuar.');}
  else if(unavailable)warnStorage('O armazenamento está restrito neste navegador. Ao importar, o aplicativo verificará se é possível salvar.');
 }
 function toast(message,error=false){clearTimeout(toastTimer);$('toast-message').textContent=message;$('toast').classList.toggle('error',error);$('toast').hidden=false;if(!error)toastTimer=setTimeout(()=>$('toast').hidden=true,6000);}
 function theme(){document.body.classList.toggle('dark',state.theme==='dark');document.querySelector('meta[name=theme-color]').setAttribute('content',state.theme==='dark'?'#111e31':'#3568c0');document.querySelector('meta[name=theme-color]').setAttribute('content',state.theme==='dark'?'#111e31':'#3568c0');$('theme-button').innerHTML=icon(state.theme==='dark'?'sun':'moon');$('theme-button').setAttribute('aria-label',state.theme==='dark'?'Ativar modo claro':'Ativar modo escuro');}
 function render(){theme();const c=state.current;$('empty-view').hidden=!!c;$('calendar-view').hidden=!c;if(!c)return;$('person-name').textContent=state.person;$('avatar').textContent=state.person.split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase();$('person-subtitle').textContent='Plantões, treinamentos e ausências de '+state.person+'.';renderIssues();renderStats();renderCalendar();renderDay();renderSource();renderChanges();EscalaTeam.render({roster:state.roster,person:state.person,date:selected});}
 function renderStats(){
  const records=state.current.events.filter(e=>e.date.startsWith(month)),active=records.filter(e=>!absent(e)),absences=records.length-active.length,support=active.filter(e=>e.type==='support').length,training=active.filter(e=>e.type==='training').length;
  const values=[['Plantões e atividades',active.length,'calendar',absences?absences+' ausência'+(absences===1?'':'s')+' fora da contagem':support+' apoio'+(support===1?'':'s')+' · '+training+' treinamento'+(training===1?'':'s'),''],['Horas de trabalho',totalHours(records),'clock','Ausências não somam horas',''],['Turnos diurnos',active.filter(e=>e.shift==='day').length,'sun','Somente registros ativos','day-text'],['Turnos noturnos',active.filter(e=>e.shift==='night').length,'moon','Somente registros ativos','night-text'],['Treinamentos',training,'book',support+' apoio'+(support===1?'':'s')+' ao turno','training-text']];
  $('stats').innerHTML=values.map(([l,n,i,foot,color])=>'<article class="stat"><div class="stat-label"><span>'+l+'</span><span class="'+color+'">'+icon(i)+'</span></div><div class="stat-value '+color+'">'+n+(i==='clock'?'<small>h</small>':'')+'</div><div class="stat-foot">'+foot+'</div></article>').join('');
 }
 function renderIssues(){const c=state.current;let html='';if(c.missingFromRoster)html+='<div class="notice warning"><strong>Este funcionário não aparece na nova planilha.</strong> Os registros anteriores estão na comparação abaixo. A ausência do nome não confirma folga.</div>';else if(!c.complete)html+='<div class="notice warning"><strong>A planilha não cobre o mês inteiro.</strong> Dias sem registro não confirmam folga. Datas sem os dois turnos: '+esc(c.missingDays.map(d=>fmtDate(d)).join(', '))+'.</div>';if(c.issues.length)html+='<section class="card issues-panel"><h3>'+c.issues.length+' registro'+(c.issues.length===1?' precisa':'s precisam')+' da sua conferência</h3><p>Os registros pendentes estão destacados no calendário. As horas incluem esses registros até sua revisão.</p>'+c.issues.map(i=>{const e=c.events.find(e=>e.id===i.id);return '<div class="issue-row"><div><strong>'+esc(e?fmtDate(e.date,true)+' · '+e.raw:'Registro pendente')+'</strong><p>'+esc(i.message)+'</p></div><button class="button small" data-review="'+esc(i.id)+'">Conferir</button></div>';}).join('')+'</section>';$('issues-region').innerHTML=html;}
 function renderCalendar(){
  const c=state.current,records=c.events.filter(e=>e.date.startsWith(month)),active=records.filter(e=>!absent(e)),absences=records.length-active.length,map=new Map();
  for(const e of c.events){if(!map.has(e.date))map.set(e.date,[]);map.get(e.date).push(e);}
  $('month-title').textContent=fmtMonth(month);for(const [id,on] of [['mode-month',!listMode],['mode-list',listMode]]){$(id).classList.toggle('active',on);$(id).setAttribute('aria-pressed',String(on));}
  if(listMode){$('calendar-body').innerHTML='<div class="agenda">'+(records.length?records.map(e=>'<div class="agenda-row" role="button" tabindex="0" data-date="'+e.date+'" aria-label="'+esc(fmtDate(e.date,true)+' '+(absent(e)?'Ausência: ':'')+activity(e))+'"><span class="agenda-date">'+e.date.slice(8)+'<small>'+esc(weekday(e.date).slice(0,3))+'</small></span><div class="agenda-body"><strong>'+esc(absent(e)?reason(e):activity(e))+'</strong><span>'+(absent(e)?'Não irá ao plantão · 0h de trabalho':'Equipe '+esc(e.team)+' · '+(e.shift==='night'?'19h → 07h (+1 dia)':'07h → 19h'))+'</span></div>'+tag(e)+'</div>').join(''):'<div class="empty">Nenhum registro neste mês da planilha.</div>')+'</div>';}
  else{
   const offset=new Date(month+'-01T12:00Z').getUTCDay(),count=Math.ceil((offset+C.daysInMonth(month))/7)*7,start=C.addDays(month+'-01',-offset);
   let html='<div class="week-header" aria-hidden="true">'+['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=>'<span>'+d+'</span>').join('')+'</div><div class="calendar-grid" role="group" aria-label="Dias do mês">';
   for(let i=0;i<count;i++){
    const d=C.addDays(start,i),events=map.get(d)||[],carry=(map.get(C.addDays(d,-1))||[]).some(e=>e.shift==='night'&&!absent(e));
    const accessible=fmtDate(d,true)+', '+weekday(d)+(events.length?', '+events.map(e=>(absent(e)?'Ausência: ':'')+activity(e)+(absent(e)?', não irá ao plantão':', '+hours(e))).join('; '):carry?', término de plantão às 07h':', sem plantão iniciado');
    html+='<button class="day-cell '+(d.startsWith(month)?'':'other ')+(d===selected?'selected ':'')+(d===today?'today':'')+'" data-date="'+d+'" aria-label="'+esc(accessible)+'" aria-pressed="'+(d===selected)+'"><span class="day-number">'+Number(d.slice(8))+'</span>';
    for(const e of events){const annotated=!!e.annotation||absent(e)||['special','training'].includes(e.type);html+='<span class="event-chip '+kind(e)+(annotated?' with-annotation':'')+'">'+(absent(e)?'<span class="absence-marker">Ausente</span><span class="annotation-text">'+esc(e.annotation||'Sem motivo')+'</span>':annotated?'<span class="annotation-text">'+esc(activity(e))+'</span>':'<span class="chip-full">'+esc(e.type==='support'?'Apoio · 07h':e.type==='review'?'Conferir':e.shift==='night'?'19h → 07h':'07h → 19h')+'</span><span class="chip-short">'+esc(label(e))+'</span>')+'</span>';}
    html+=(carry?'<span class="carry">Até 07h</span>':'')+(!events.length&&!carry?'<span class="off-dot" aria-hidden="true"></span>':'')+'</button>';
   }
   $('calendar-body').innerHTML=html+'</div>';
  }
  const covered=Object.hasOwn(c.coverage,month),full=month===c.month&&c.complete;
  $('calendar-footer').innerHTML='<span><strong>'+active.length+' plantões/atividades · '+totalHours(records)+' horas</strong>'+(absences?' · <span class="absence-count">'+absences+' ausência'+(absences===1?'':'s')+'</span>':'')+'</span><span>'+(!covered?'Mês fora da cobertura da planilha':full?'Mês completo · dias sem registro indicam folga':'Mês parcial · ausências de registro não confirmam folga')+'</span>';
 }
 function renderDay(){
  const c=state.current,events=c.events.filter(e=>e.date===selected),previous=c.events.find(e=>e.date===C.addDays(selected,-1)&&e.shift==='night'&&!absent(e)),full=selected.startsWith(c.month)&&c.complete;
  let html='<div class="card-eyebrow">Dia selecionado '+icon('calendar')+'</div><div class="detail-heading">'+esc(weekday(selected))+'</div><p class="detail-sub">'+esc(new Intl.DateTimeFormat('pt-BR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(selected+'T12:00Z')))+'</p>';
  if(previous)html+='<div class="notice" style="font-size:11px;margin-bottom:13px">Plantão de '+fmtDate(previous.date)+' termina hoje às <strong>07h00</strong>.</div>';
  for(const e of events){
   html+='<div class="detail-event '+(absent(e)?'absence':'')+'" style="border-color:var(--'+(kind(e)==='review'||absent(e)?'danger':kind(e)==='special'?'primary':kind(e))+')">'+tag(e)+'<h3>'+esc(absent(e)?reason(e):activity(e))+'</h3>';
   if(absent(e))html+='<p><strong>Não irá ao plantão · 0h de trabalho</strong></p><div class="absence-slot"><strong>Turno originalmente previsto</strong>'+hours(e)+'<br>Equipe '+esc(e.team)+(e.shift==='night'?'<br>Término previsto: '+fmtDate(C.addDays(e.date,1),true)+' às 07h00':'')+'</div>';
   else html+='<div class="detail-time">'+hours(e)+'</div><p>Equipe do bloco: <strong>'+esc(e.team)+'</strong> · 12 horas</p>'+(e.shift==='night'?'<p>Término: '+fmtDate(C.addDays(e.date,1),true)+' às 07h00</p>':'');
   html+='</div><p class="micro">'+esc(e.note||'Registro identificado na lista deste turno.')+'</p><p class="micro"><strong>Texto da planilha:</strong> '+esc(e.raw)+'</p><p class="micro"><strong>Origem:</strong> '+esc(e.sources.join(' · '))+'</p><button class="button small rail-action" data-review="'+esc(e.id)+'">'+(e.pending?'Conferir registro':'Ajustar interpretação')+'</button><hr class="divider">';
  }
  if(!events.length)html+='<div class="empty" style="padding:15px 0">'+(previous?'Sem novo plantão iniciado neste dia.':full?'Folga · nenhum plantão iniciado neste dia.':'Sem registro. A planilha não confirma a escala completa deste mês.')+'</div>';
  $('day-detail').innerHTML=html;
 }
 function renderSource(){const c=state.current;const stamp=new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:C.TZ}).format(new Date(c.importedAt));$('source-card').innerHTML='<div class="card-eyebrow">'+icon('file')+' Planilha atual <span class="badge">'+esc(c.revision)+'</span></div><p class="file-name">'+esc(c.fileName)+'</p><div class="file-meta"><span>Funcionário</span><strong>'+esc(c.person)+'</strong></div><div class="file-meta"><span>Período principal</span><strong style="text-transform:capitalize">'+esc(fmtMonth(c.month))+'</strong></div><div class="file-meta"><span>Registros no arquivo</span><strong>'+c.events.length+'</strong></div><div class="file-meta"><span>Importada em</span><strong>'+esc(stamp)+'</strong></div><div class="file-meta"><span>Funcionários disponíveis</span><strong>'+(state.roster?state.roster.schedules.length:'Somente o selecionado')+'</strong></div><hr class="divider"><button class="button primary rail-action" data-import>'+icon('upload')+'Anexar nova planilha</button><p class="compact-note">'+(state.roster?'As escalas desta planilha ficam neste aparelho. Use Trocar funcionário sem anexar novamente.':'Seu calendário anterior foi mantido. Anexe a planilha uma vez para salvar todos os funcionários.')+' Recebeu uma nova revisão? Anexe o arquivo atualizado.</p>';}
 function setLoading(on,message='Lendo a planilha…'){$('loading-label').textContent=message;$('loading').hidden=!on;}
 function changeRecord(e){
  if(!e)return '<p class="change-empty">Sem registro nesta versão.</p>';
  return '<div class="change-record">'+tag(e)+'<strong>'+esc(absent(e)?reason(e):activity(e))+'</strong><span>'+esc(fmtDate(e.date,true))+' · Equipe '+esc(e.team)+'</span><span>'+esc(hours(e))+'</span>'+(e.shift==='night'?'<span>Término: '+esc(fmtDate(e.end.slice(0,10),true))+' às '+esc(e.end.slice(11,16))+'</span>':'')+'<span>'+esc(absent(e)?'Não irá ao plantão · 0h de trabalho':'12h de trabalho')+'</span>'+(e.annotation?'<span>Observação: '+esc(e.annotation)+'</span>':'')+'</div>';
 }
 function changeRow(row,type){
  const e=row.after||row.before,names=row.fields.map(k=>D.labels[k]);
  return '<article class="change-row '+type+'"><div class="change-row-heading"><strong>'+esc(fmtDate(e.date,true))+' · '+esc(weekday(e.date))+'</strong><button class="button small subtle" data-date="'+esc(e.date)+'">Ver dia</button></div>'+(names.length?'<p class="change-fields">Mudou: '+esc(names.join(', '))+'.</p>':'')+(row.reason?'<p class="notice warning">'+esc(row.reason)+'</p>':'')+'<div class="change-pair"><div><h4>Antes</h4>'+changeRecord(row.before)+'</div><div><h4>Agora</h4>'+changeRecord(row.after)+'</div></div></article>';
 }
 function renderChanges(){
  const panel=$('changes-panel');
  let html='<div class="changes-heading"><span class="change-title-icon">'+icon('file')+'</span><div><h2 id="changes-title">Alterações na escala</h2><p>'+esc(state.person)+' · comparação entre planilhas importadas</p></div></div>';
  const result=state.roster?D.compare(state.roster,state.comparison,state.person):{status:'first'};
  if(result.status!=='ready'){
   const messages={first:'Ainda não há uma revisão anterior para comparar. Importe a próxima revisão do mesmo mês para ver as mudanças aqui.','different-month':'As últimas planilhas são de meses diferentes. Elas não foram comparadas. Importe uma revisão do mês atual para ver suas alterações.','unavailable':'A leitura de uma das versões deste funcionário está pendente. Não é possível confirmar as alterações com segurança.','no-person-base':'A versão antiga guardava somente o funcionário selecionado. Não há uma base anterior para comparar este colaborador.'};
   panel.innerHTML=html+'<p class="changes-message">'+esc(messages[result.status])+'</p>';return;
  }
  const changed=result.added.length+result.removed.length+result.changed.length;
  html+='<div class="comparison-period"><span class="badge">'+esc(result.before.revision)+'</span><span aria-hidden="true">→</span><span class="badge">'+esc(result.after.revision)+'</span><span>'+esc(fmtMonth(result.after.month))+'</span></div><p class="compact-note">Comparação da última importação deste mês, incluindo os registros do arquivo que atravessam a mudança de mês. Horários em America/Fortaleza.</p>';
  html+='<details class="change-files"><summary>Planilhas comparadas</summary><p><strong>Antes:</strong> '+esc(result.previous.fileName)+'</p><p><strong>Agora:</strong> '+esc(state.roster.fileName)+'</p></details>';
  if(result.manualBase)html+='<p class="notice">A base anterior veio de uma versão antiga do aplicativo e pode incluir ajustes manuais. A partir desta atualização, são comparados os dados extraídos das planilhas.</p>';
  if(result.newPerson)html+='<p class="notice">Este funcionário não aparecia na planilha anterior.</p>';
  if(result.missingPerson)html+='<p class="notice warning">Este funcionário não aparece na nova planilha. Confira com a empresa antes de interpretar a ausência como folga.</p>';
  html+='<div class="change-counts" aria-label="Resumo das alterações">'+[['added','Adicionados'],['changed','Alterados'],['removed','Removidos'],['unchanged','Mantidos']].map(([key,title])=>'<div class="change-count '+key+'"><strong>'+result[key].length+'</strong><span>'+title+'</span></div>').join('')+'</div>';
  if(!changed&&!result.uncertain.length)html+='<p class="changes-message unchanged-message">Nenhuma alteração identificada para este funcionário.</p>';
  if(result.uncertain.length)html+='<p class="notice warning"><strong>'+result.uncertain.length+' diferença(s) sem confirmação.</strong> Leitura incompleta ou pendente: esses registros não foram contados como inclusões ou remoções confirmadas.</p>';
  for(const [key,title] of [['changed','Registros alterados'],['added','Registros adicionados'],['removed','Registros removidos'],['uncertain','Diferenças que precisam de conferência']])if(result[key].length)html+='<details class="change-group" open><summary>'+esc(title)+' <span class="badge">'+result[key].length+'</span></summary><div>'+result[key].map(row=>changeRow(row,key)).join('')+'</div></details>';
  html+='<p class="compact-note">Uma mudança de data aparece como um registro removido e outro adicionado, sem presumir que são o mesmo plantão. Ajustes feitos em “Conferir registro” não modificam esta comparação entre arquivos.</p>';
  panel.innerHTML=html;
 }
 async function readRoster(file){
  const names=await C.listEmployees(file),schedules=[],failures=[],importedAt=new Date().toISOString();
  for(let i=0;i<names.length;i++){
   setLoading(true,'Lendo funcionários: '+(i+1)+' de '+names.length+'.');
   await new Promise(r=>setTimeout(r,0));
   try{const schedule=await C.parseWorkbook(file,names[i]);schedule.importedAt=importedAt;schedules.push(schedule);}
   catch(error){failures.push({person:names[i],message:error.message||'Não foi possível validar os registros deste funcionário.'});}
  }
  if(!schedules.length)throw Error(failures[0]?.message||'Não foi possível validar a planilha.');
  return {version:1,fileName:file.name,importedAt,names,schedules,sourceSchedules:clone(schedules),slots:schedules[0].slots,failures};
 }
 async function generate(roster,person){
  const comparison=roster===state.roster?state.comparison:D.prepare(state,roster);
  const candidate=roster.schedules.find(c=>c.person===person)||D.missingSchedule(roster,comparison,person);
  if(!candidate){toast(roster.failures.find(c=>c.person===person)?.message||'Não foi possível recuperar este funcionário.',true);return;}
  setLoading(true,'Salvando as escalas neste aparelho.');
  try{
   state={...state,person,current:clone(candidate),roster,comparison};
   month=candidate.month;selected=candidate.events.find(e=>e.date===today)?.date||candidate.events.find(e=>e.date.startsWith(month))?.date||month+'-01';listMode=false;
   const saved=await save();render();$('person-dialog').close();pendingRoster=null;
   toast(saved?'Calendário pronto. Você pode trocar de funcionário sem anexar novamente.'+(roster.failures.length?' Há '+roster.failures.length+' funcionário(s) com leitura pendente; confira a lista.':''):'Calendário pronto nesta sessão, mas não foi possível salvar no aparelho.',!saved);
   if(saved)void S.requestPersistence();
  }catch{toast('Não foi possível concluir o salvamento. Mantenha a planilha para anexar novamente.',true);}
  finally{setLoading(false);$('file-input').value='';}
 }
 function personSelection(){
  const person=$('person-select').value,failure=pendingRoster?.failures.find(c=>c.person===person);
  $('person-generate').disabled=!person||!!failure;
  $('person-error').hidden=!failure;
  $('person-error').textContent=failure?'Leitura pendente para '+person+': '+failure.message:'';
 }
 function choosePerson(roster){
  pendingRoster=roster;
  const comparison=roster===state.roster?state.comparison:D.prepare(state,roster),removed=D.removedPeople(roster,comparison),names=[...roster.names,...removed].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  $('selected-file-name').textContent=roster.fileName+' · '+roster.names.length+' funcionários'+(roster.failures.length?' · '+roster.failures.length+' com leitura pendente':'');
  const select=$('person-select');select.replaceChildren(new Option('Selecione seu nome',''),...names.map(n=>new Option(n+(roster.failures.some(c=>c.person===n)?' — conferir leitura':removed.includes(n)?' — ausente na nova planilha':''),n)));
  const prior=names.find(n=>C.normalize(n)===C.normalize(state.person));if(prior)select.value=prior;
  personSelection();$('person-dialog').showModal();
 }
 async function importFile(file){
  if(!file)return;setLoading(true,'Preparando a leitura de todos os funcionários.');await new Promise(r=>setTimeout(r,25));
  try{const roster=await readRoster(file);const found=state.person&&roster.schedules.find(c=>C.normalize(c.person)===C.normalize(state.person));setLoading(false);if(found)await generate(roster,found.person);else choosePerson(roster);}
  catch(e){setLoading(false);toast(e.message||'Não foi possível ler a planilha. Sua escala anterior foi preservada.',true);}
  finally{$('file-input').value='';}
 }
 function openReview(id){
  const e=state.current?.events.find(e=>e.id===id);if(!e)return;reviewId=id;$('review-source').textContent=fmtDate(e.date,true)+' · '+e.raw+' · '+e.sources.join(', ');$('review-identity').value='yes';$('review-type').value=e.type==='review'?(e.strikeInSource?'absence':'regular'):e.type;$('review-label').value=e.annotation||(['training','special'].includes(e.type)?e.activity:'');reviewFields();$('review-dialog').showModal();
 }
 function reviewFields(){const t=$('review-type').value;$('review-activity-fields').hidden=$('review-identity').value==='no';$('review-label-field').hidden=!['training','special','absence'].includes(t);$('review-label-title').textContent=t==='absence'?'Motivo da ausência (se informado)':t==='training'?'Identificação do treinamento':'Informação da planilha';}
 async function saveReview(){
  const c=state.current,e=c.events.find(e=>e.id===reviewId);if(!e)return;
  if($('review-identity').value==='no')c.events=c.events.filter(x=>x.id!==reviewId);
  else{const type=$('review-type').value,annotation=$('review-label').value.trim();if(['training','special'].includes(type)&&!annotation){toast('Informe a atividade ou observação.',true);return;}if(type!=='absence'&&c.events.some(x=>x.id!==e.id&&x.date===e.date&&x.shift===e.shift&&!absent(x))){toast('Já existe um registro ativo neste turno. Confira a planilha antes de alterar a ausência.',true);return;}Object.assign(e,{type,status:type==='absence'?'absent':'scheduled',workHours:type==='absence'?0:12,annotation:['training','special','absence'].includes(type)?annotation:e.annotation,activity:type==='absence'?annotation||'Ausência sem motivo informado':type==='regular'?'Plantão regular':type==='support'?'Apoio ao turno':annotation,pending:false,note:'Interpretação conferida manualmente por você nesta escala.'});}
  c.issues=c.issues.filter(i=>i.id!==reviewId);setLoading(true,'Salvando sua interpretação.');try{const saved=await save();render();$('review-dialog').close();toast(saved?'Registro atualizado e salvo neste aparelho.':'Registro atualizado nesta sessão, mas não foi possível salvar no aparelho.',!saved);}finally{setLoading(false);}
 }
 function pickDay(date){selected=date;month=date.slice(0,7);render();if(matchMedia('(max-width:720px)').matches)requestAnimationFrame(()=>$('team-panel').scrollIntoView({block:'start',behavior:'smooth'}));}
 document.addEventListener('click',e=>{if(e.target.closest('#team-today')){const d=new Intl.DateTimeFormat('sv-SE',{timeZone:C.TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());pickDay(d);return;}if(e.target.closest('[data-import]')){$('file-input').click();return;}const close=e.target.closest('[data-close]');if(close){$(close.dataset.close).close();return;}const day=e.target.closest('[data-date]');if(day){pickDay(day.dataset.date);return;}const review=e.target.closest('[data-review]');if(review)openReview(review.dataset.review);});
 document.addEventListener('keydown',e=>{const row=e.target.closest('.agenda-row');if(row&&['Enter',' '].includes(e.key)){e.preventDefault();pickDay(row.dataset.date);}});
 document.addEventListener('change',e=>{if(e.target.id==='team-date'&&/^20\d{2}-\d{2}-\d{2}$/.test(e.target.value)){pickDay(e.target.value);}});
 $('file-input').addEventListener('change',e=>importFile(e.target.files[0]));$('person-select').addEventListener('change',personSelection);$('person-generate').addEventListener('click',()=>{if(pendingRoster&&$('person-select').value)generate(pendingRoster,$('person-select').value);});$('change-person').addEventListener('click',()=>{if(state.roster)choosePerson(state.roster);else{toast('Seu calendário foi preservado. Anexe a planilha uma vez para salvar também os outros funcionários.');$('file-input').click();}});$('theme-button').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';void save();theme();});$('help-open').addEventListener('click',()=>$('help-dialog').showModal());$('toast-close').addEventListener('click',()=>$('toast').hidden=true);$('review-identity').addEventListener('change',reviewFields);$('review-type').addEventListener('change',reviewFields);$('review-save').addEventListener('click',saveReview);
 for(const [id,delta] of [['previous-month',-1],['next-month',1]])$(id).addEventListener('click',()=>{const d=new Date(month+'-01T12:00Z');d.setUTCMonth(d.getUTCMonth()+delta);month=d.toISOString().slice(0,7);selected=month+'-01';render();});$('mode-month').addEventListener('click',()=>{listMode=false;render();});$('mode-list').addEventListener('click',()=>{listMode=true;render();});
 const drop=$('hero-drop');drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('drag');});drop.addEventListener('dragleave',()=>drop.classList.remove('drag'));drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('drag');if(e.dataTransfer.files.length===1)importFile(e.dataTransfer.files[0]);else toast('Anexe uma planilha por vez.',true);});
 setLoading(true,'Recuperando as escalas deste aparelho.');
 restore().then(()=>{ready=true;if(state.current){month=state.current.month;selected=state.current.events.find(e=>e.date.startsWith(month))?.date||month+'-01';}render();}).catch(()=>warnStorage('Não foi possível recuperar os dados. Anexe a planilha novamente.')).finally(()=>{ready=true;setLoading(false);});
})();
