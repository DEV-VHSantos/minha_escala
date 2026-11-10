/* Compare source records, independently of display settings and manual corrections. */
(() => {
 'use strict';
 const C=EscalaCore,clone=x=>JSON.parse(JSON.stringify(x));
 const source=r=>r?.sourceSchedules||r?.schedules||[];
 const find=(list,person)=>list.find(s=>C.normalize(s.person)===C.normalize(person));
 const text=x=>String(x??'').replace(/\s+/g,' ').trim();
 const absent=e=>e.type==='absence'||e.status==='absent';
 function values(e){return {date:e.date,shift:e.shift,team:text(e.team),start:e.start,end:e.end,type:e.type,status:absent(e)?'absent':'scheduled',activity:text(e.activity),annotation:text(e.annotation),workHours:absent(e)?0:(e.workHours??12)};}
 const labels={date:'Data',shift:'Turno',team:'Equipe',start:'Início',end:'Término',type:'Tipo de atividade',status:'Presença / ausência',activity:'Atividade',annotation:'Observação',workHours:'Horas de trabalho'};
 function fields(a,b){const av=values(a),bv=values(b);return Object.keys(labels).filter(k=>av[k]!==bv[k]);}
 function signature(r){return JSON.stringify({names:[...r.names].map(C.normalize).sort(),schedules:source(r).map(s=>({person:C.normalize(s.person),month:s.month,revision:s.revision,complete:s.complete,missingDays:s.missingDays,events:s.events.map(e=>({...values(e),pending:!!e.pending})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))})).sort((a,b)=>a.person.localeCompare(b.person)),failures:r.failures.map(f=>({person:C.normalize(f.person),message:f.message})).sort((a,b)=>a.person.localeCompare(b.person))});}
 function snapshot(r){return {fileName:r.fileName,importedAt:r.importedAt,names:clone(r.names),schedules:clone(source(r)),failures:clone(r.failures),includesManualAdjustments:!r.sourceSchedules};}
 function prepare(state,incoming){
  const old=state.roster;
  if(old&&signature(old)===signature(incoming))return state.comparison||null;
  const previous=old?snapshot(old):state.current?{fileName:state.current.fileName,importedAt:state.current.importedAt,names:[state.person],schedules:[clone(state.current)],failures:[],includesManualAdjustments:true,limited:true}:null;
  if(!previous)return null;
  const beforeMonth=previous.schedules[0]?.month,afterMonth=source(incoming)[0]?.month;
  if(beforeMonth!==afterMonth)return {version:1,reason:'different-month',beforeMonth,comparedAt:new Date().toISOString()};
  return {version:1,previous,comparedAt:new Date().toISOString()};
 }
 function removedPeople(roster,comparison){return comparison?.previous?.schedules.filter(s=>!roster.names.some(n=>C.normalize(n)===C.normalize(s.person))).map(s=>s.person)||[];}
 function missingSchedule(roster,comparison,person){
  if(!removedPeople(roster,comparison).some(n=>C.normalize(n)===C.normalize(person)))return null;
  return {...clone(source(roster)[0]),person,events:[],issues:[],complete:false,missingDays:[],missingFromRoster:true};
 }
 const covers=(s,date)=>!!s&&date.startsWith(s.month)&&!!s.complete;
 function compare(roster,comparison,person){
  if(!comparison?.previous)return {status:comparison?.reason==='different-month'?'different-month':'first'};
  const previous=comparison.previous,current=source(roster),before=find(previous.schedules,person),after=find(current,person);
  if(find(previous.failures,person)||find(roster.failures,person))return {status:'unavailable'};
  if(previous.limited&&!before)return {status:'no-person-base'};
  const oldTemplate=before||previous.schedules[0],newTemplate=after||current[0];
  if(!oldTemplate||!newTemplate||oldTemplate.month!==newTemplate.month)return {status:'different-month'};
  const result={status:'ready',before:oldTemplate,after:newTemplate,previous,added:[],removed:[],changed:[],unchanged:[],uncertain:[],newPerson:!before,missingPerson:!after,manualBase:!!previous.includesManualAdjustments};
  const left=[...(before?.events||[])],right=[...(after?.events||[])];
  function pair(a,b){const changes=fields(a,b),row={before:a,after:b,fields:changes};if(a.pending||b.pending){result.uncertain.push({...row,reason:'Há uma interpretação pendente neste registro.'});}else result[changes.length?'changed':'unchanged'].push(row);left.splice(left.indexOf(a),1);right.splice(right.indexOf(b),1);}
  // Prefer the same slot and presence state. This also disambiguates a scheduled
  // shift and a struck occurrence that share a date. Do not guess a date move.
  for(const a of [...left]){const matches=right.filter(b=>!fields(a,b).length&&!!a.pending===!!b.pending);if(matches.length)pair(a,matches[0]);}
  for(const a of [...left]){const matches=right.filter(b=>a.date===b.date&&a.shift===b.shift&&a.team===b.team&&absent(a)===absent(b));if(matches.length===1)pair(a,matches[0]);}
  for(const a of [...left]){const matches=right.filter(b=>a.date===b.date&&a.shift===b.shift);if(matches.length===1&&left.filter(b=>b.date===a.date&&b.shift===a.shift).length===1)pair(a,matches[0]);}
  for(const date of new Set(left.map(e=>e.date))){const a=left.filter(e=>e.date===date),b=right.filter(e=>e.date===date);if(a.length===1&&b.length===1)pair(a[0],b[0]);}
  for(const e of left){const row={before:e,after:null,fields:[]};if(e.pending||!covers(newTemplate,e.date))result.uncertain.push({...row,reason:'O registro não aparece no novo arquivo, mas a leitura não permite confirmar sua remoção nesta data.'});else result.removed.push(row);}
  for(const e of right){const row={before:null,after:e,fields:[]};if(e.pending||!covers(oldTemplate,e.date))result.uncertain.push({...row,reason:'O registro aparece no novo arquivo, mas falta uma base completa para confirmar sua inclusão nesta data.'});else result.added.push(row);}
  for(const key of ['added','removed','changed','unchanged','uncertain'])result[key].sort((a,b)=>(a.after||a.before).start.localeCompare((b.after||b.before).start));
  return result;
 }
 window.EscalaChanges={prepare,compare,removedPeople,missingSchedule,labels};
})();
