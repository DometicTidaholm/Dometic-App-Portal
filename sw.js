const CACHE = "dometic-portal-shell-v4";
const CORE = ["./","./index.html","./styles.css","./apps-data.js","./portal.js","./manifest.webmanifest","./icon-192.png","./icon-512.png","./assets/dometic-logo-white.png"];
const SHELL = new Set(CORE.map(path => new URL(path,self.registration.scope).pathname));
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("dometic-portal-shell-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||!SHELL.has(url.pathname))return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const clone=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,clone)).catch(()=>{}));}
    return response;
  }).catch(()=>caches.match(event.request).then(cached=>cached||new Response("Offline",{status:503,headers:{"Content-Type":"text/plain"}}))));
});
