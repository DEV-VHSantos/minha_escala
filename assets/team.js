/* The roster is local; no external requests. Shifts are grouped by their start date. */
(() => {
 'use strict';
 const C=EscalaCore,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const absent=e=>e.type==='absence'||e.status==='absent';
 function collect(roster,date){
  const rows=[];
  for(const schedule of roster?.schedules||[])for(const event of schedule.events)if(event.date===date)rows.push({...event,person:schedule.person});
  const slots=Array.isArray(roster?.slots)?roster.slots:[];
  return ['day','night'].map(shift=>{
   const events=rows.filter(e=>e.shift===shift),headers=slots.filter(s=>s.date===date&&s.shift===shift);
   const teams=[...new Set([...headers.map(s=>s.team),...events.map(e=>e.team)])].sort();
   return {shift,known:headers.length>0,teams:teams.map(team=>({team,rows:events.filter(e=>e.team===team).sort((a,b)=>a.person.localeCompare(b.person,'pt-BR'))}))};
  });
 }
 function member(e,person){
  const status=e.pending?'Conferir':absent(e)?'Ausente':'Previsto';
  const annotation=C.normalize(e.annotation)==='bh'?'BH — Banco de Horas':e.annotation;
  const activity=annotation||(['training','support','special','review','absence'].includes(e.type)?e.activity:'');
  return '<li class="team-member '+(e.pending?'pending':absent(e)?'absent':'scheduled')+(C.normalize(e.person)===C.normalize(person)?' chosen':'')+'"><div><strong>'+esc(e.person)+'</strong>'+(activity?'<span>'+esc(activity)+'</span>':'')+(e.note?.includes('manualmente')?'<small>Interpretação ajustada neste aparelho</small>':'')+'</div><span class="team-status">'+status+'</span></li>';
 }
 function render({roster,person,date}){
  const panel=document.getElementById('team-panel');
  let html='<div class="team-heading"><div><h2 id="team-title">Equipe do dia</h2><p>Consulte os dois turnos da data escolhida.</p></div><button class="button small" id="team-today">Ver equipe de hoje</button></div><label class="team-date-label" for="team-date">Data da consulta<input id="team-date" type="date" min="2000-01-01" max="2099-12-31" value="'+esc(date)+'"></label><p class="team-date-title">'+esc(new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00Z')))+'</p>';
  if(!roster){panel.innerHTML=html+'<p class="notice warning">Anexe a planilha uma vez para consultar os colaboradores de toda a equipe. A escala individual já salva foi preservada.</p>';return;}
  if(!Array.isArray(roster.slots))html+='<p class="notice">Esta planilha foi salva em uma versão anterior. Os nomes abaixo vêm dos registros disponíveis; anexe o Excel uma vez para validar também todos os cabeçalhos de equipe e turno.</p>';
  if(roster.failures.length)html+='<p class="notice warning">'+roster.failures.length+' colaborador(es) com leitura pendente podem não aparecer. A relação pode estar incompleta: '+esc(roster.failures.map(f=>f.person).join(', '))+'.</p>';
  html+='<div class="team-shifts">';
  for(const shift of collect(roster,date)){
   const night=shift.shift==='night';
   html+='<section class="team-shift '+shift.shift+'"><header><h3>Turno '+(night?'noturno':'diurno')+'</h3><p>'+(night?'19h00 às 07h00 · término em '+esc(C.addDays(date,1).split('-').reverse().join('/')):'07h00 às 19h00')+'</p></header>';
   if(!shift.known)html+='<p class="team-note">'+(shift.teams.length?'Cabeçalho deste turno não disponível nos dados salvos. Confira a cobertura ao reimportar.':'Turno não identificado nesta data da planilha. Não é possível confirmar equipe ou folga.')+'</p>';
   for(const group of shift.teams){
    const active=group.rows.filter(e=>!e.pending&&!absent(e)),away=group.rows.filter(e=>!e.pending&&absent(e)),pending=group.rows.filter(e=>e.pending);
    html+='<div class="team-group"><h4>Equipe '+esc(group.team)+' <span>'+active.length+' previsto(s)</span></h4>';
    if(active.length)html+='<ul class="team-members">'+active.map(e=>member(e,person)).join('')+'</ul>';
    else html+='<p class="team-note">Nenhum colaborador classificado como previsto nos registros disponíveis.</p>';
    if(away.length)html+='<h5>Ausências indicadas na escala</h5><ul class="team-members">'+away.map(e=>member(e,person)).join('')+'</ul>';
    if(pending.length)html+='<h5>Registros para conferir</h5><ul class="team-members">'+pending.map(e=>member(e,person)).join('')+'</ul>';
    html+='</div>';
   }
   html+='</section>';
  }
  html+='</div><p class="team-foot">Turnos iniciados nesta data · America/Fortaleza. Treinamentos mantêm 12 horas. Nomes tachados são ausências e ficam separados dos previstos. Toque em outro dia do calendário para atualizar esta consulta.</p>';
  panel.innerHTML=html;
 }
 window.EscalaTeam={collect,render};
})();
