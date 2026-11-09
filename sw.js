/* Troque VERSION em cada publicação que modificar os arquivos do aplicativo. */
'use strict';
const VERSION='1.0.0';
const SCOPE=new URL(self.registration.scope);
const PREFIX='minha-escala:'+SCOPE.pathname+':';
const CACHE=PREFIX+VERSION;
const FILES=[
 './','./index.html','./manifest.webmanifest',
 './assets/styles.css','./assets/core.js','./assets/app.js','./assets/pwa.js',
 './assets/vendor/pako_inflate.min.js',
 './icons/icon-192.png','./icons/icon-512.png','./icons/maskable-192.png','./icons/maskable-512.png','./icons/apple-touch-icon.png','./icons/favicon.svg'
];
const URLS=FILES.map(p=>new URL(p,SCOPE).href);
const SHELL=new URL('./index.html',SCOPE).href;
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(URLS.map(url=>new Request(url,{cache:'reload'})));})());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
 if(event.data?.type==='GET_VERSION')event.source?.postMessage({type:'APP_VERSION',version:VERSION});
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;
 if(request.mode==='navigate'){
  if(url.pathname!==SCOPE.pathname&&url.pathname!==new URL(SHELL).pathname)return;
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   // One version of HTML and its assets travel together; updates activate after user choice.
   return await cache.match(SHELL)||fetch(request);
  })());
  return;
 }
 const canonical=url.origin+url.pathname;
 if(!URLS.includes(canonical))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),cached=await cache.match(request,{ignoreSearch:true});
  if(cached)return cached;
  const response=await fetch(request);
  if(response.ok)await cache.put(canonical,response.clone());
  return response;
 })());
});
