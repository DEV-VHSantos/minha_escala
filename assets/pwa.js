/* Minha Escala • instalação, estado offline e atualização do aplicativo. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  let installPrompt=null,registration=null,reloading=false;
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const status=text=>{$('pwa-status-label').textContent=text;};
  function installButton(){
    $('install-button').hidden=standalone();
    $('install-button').setAttribute('aria-label',installPrompt?'Instalar Minha Escala':'Como instalar Minha Escala');
  }
  function network(){
    $('offline-notice').hidden=navigator.onLine;
    if(!navigator.onLine)status('Modo offline');
    else if(navigator.serviceWorker?.controller)status('Disponível offline');
    else status('Calendário no seu dispositivo');
  }
  function guide(){
    const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
    $('install-ios').hidden=!ios;$('install-other').hidden=ios;
    $('install-local-note').hidden=location.protocol!=='file:';
    $('install-dialog').showModal();
  }
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;installButton();});
  window.addEventListener('appinstalled',()=>{installPrompt=null;$('install-dialog').close();installButton();status('Aplicativo instalado');});
  $('install-button').addEventListener('click',async()=>{
    if(!installPrompt){guide();return;}
    const prompt=installPrompt;installPrompt=null;
    try{await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted')status('Instalação solicitada');}
    catch{guide();}
    installButton();
  });
  $('install-help-button').addEventListener('click',()=>{$('help-dialog').close();guide();});
  window.addEventListener('online',network);window.addEventListener('offline',network);
  matchMedia('(display-mode: standalone)').addEventListener?.('change',installButton);
  $('update-button').addEventListener('click',()=>{
    if(!registration?.waiting)return;
    $('update-button').disabled=true;$('update-button').textContent='Atualizando…';
    registration.waiting.postMessage({type:'SKIP_WAITING'});
  });
  function showUpdate(){if(registration?.waiting)$('update-notice').hidden=false;}
  installButton();network();
  if(!('serviceWorker' in navigator)||!isSecureContext||location.protocol==='file:')return;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!navigator.serviceWorker.controller)return;
    // On a first install, the open page is already current. Reload only an accepted update.
    if($('update-button').disabled&&!reloading){reloading=true;location.reload();}
    else network();
  });
  window.addEventListener('load',async()=>{
    try{
      registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
      showUpdate();
      const watch=worker=>{
        if(!worker)return;
        worker.addEventListener('statechange',()=>{if(worker.state==='installed'){if(navigator.serviceWorker.controller)showUpdate();else network();}});
      };
      watch(registration.installing);
      registration.addEventListener('updatefound',()=>watch(registration.installing));
      await navigator.serviceWorker.ready;
      status(navigator.onLine?'Disponível offline':'Modo offline');
    }catch{
      status('Uso pelo navegador');
      $('pwa-storage-note').hidden=false;
    }
  });
})();
