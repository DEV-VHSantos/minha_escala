/* Local data only. IndexedDB commits the complete roster atomically. */
(() => {
 'use strict';
 const scope=new URL('.',location.href).pathname;
 const database='minha-escala:'+scope,KEY=database+':v4';
 let opening=null,queue=Promise.resolve(),stamp=0;
 function open(){
  if(opening)return opening;
  opening=new Promise((resolve,reject)=>{
   let finished=false,request;
   const timer=setTimeout(()=>finish(Error('Armazenamento indisponível.')),3000);
   function finish(error,db){if(finished){db?.close();return;}finished=true;clearTimeout(timer);error?reject(error):resolve(db);}
   try{request=indexedDB.open(database,1);}catch(error){finish(error);return;}
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('state'))request.result.createObjectStore('state');};
   request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();opening=null;};finish(null,db);};
   request.onerror=()=>finish(request.error||Error('Falha ao abrir os dados.'));
   request.onblocked=()=>finish(Error('Feche outras abas para liberar o armazenamento.'));
  }).catch(error=>{opening=null;throw error;});
  return opening;
 }
 async function transaction(mode,value){
  const db=await open();
  return new Promise((resolve,reject)=>{
   let tx,result,finished=false;
   const timer=setTimeout(()=>{try{tx?.abort();}catch{}finish(Error('O armazenamento demorou a responder.'));},4000);
   function finish(error){if(finished)return;finished=true;clearTimeout(timer);error?reject(error):resolve(result);}
   try{tx=db.transaction('state',mode);const store=tx.objectStore('state'),r=mode==='readonly'?store.get('latest'):store.put(value,'latest');r.onsuccess=()=>{result=r.result;};tx.oncomplete=()=>finish();tx.onabort=()=>finish(tx.error||Error('Não foi possível salvar.'));tx.onerror=()=>{};}
   catch(error){finish(error);}
  });
 }
 async function read(){
  const candidates=[];
  let unavailable=false;
  try{const record=await transaction('readonly');if(record)candidates.push(record);}catch{unavailable=true;}
  try{const raw=localStorage.getItem(KEY);if(raw)candidates.push(JSON.parse(raw));}catch{unavailable=true;}
  candidates.sort((a,b)=>(Number(b?.savedAt)||0)-(Number(a?.savedAt)||0));
  stamp=Math.max(0,...candidates.map(c=>Number.isFinite(c?.savedAt)?c.savedAt:0));
  return {candidates,unavailable};
 }
 function write(state){
  // Snapshot before queueing: a later employee change cannot mutate this commit.
  const record={format:1,savedAt:stamp=Math.max(Date.now(),stamp+1),state:JSON.parse(JSON.stringify(state))};
  const task=queue.then(async()=>{
   let primary=false,backup=false;
   try{await transaction('readwrite',record);primary=true;}catch{}
   try{const raw=JSON.stringify(record);localStorage.setItem(KEY,raw);backup=localStorage.getItem(KEY)===raw;}catch{}
   return {ok:primary||backup,primary,backup};
  });
  queue=task.catch(()=>{});
  return task;
 }
 async function requestPersistence(){try{return !!(navigator.storage?.persist&&await navigator.storage.persist());}catch{return false;}}
 window.EscalaStorage={read,write,requestPersistence};
})();
