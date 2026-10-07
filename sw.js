const VERSION='bplus-new-v4-20261007-turnigenerator30';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin) return;
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(async response=>{
    if(response.ok){
      if(url.pathname.endsWith('/app-v4.html')){
        const html=await response.text();
        const pos=html.lastIndexOf('</body>');
        const injected=pos>=0?html.slice(0,pos)+'<script src="./excel-import-fix.js?build=30"></script>'+html.slice(pos):html;
        response=new Response(injected,{status:response.status,statusText:response.statusText,headers:response.headers});
      }
      const copy=response.clone();caches.open(VERSION).then(cache=>cache.put(event.request,copy));
    }
    return response;
  }).catch(()=>caches.match(event.request)));
});
self.addEventListener('push',event=>{
  let data={title:'B+ Gestionale',body:'Nuova notifica',url:'./app.html'};
  try{if(event.data)data=Object.assign(data,event.data.json());}catch(e){}
  event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:'./icons/icon-192.png',badge:'./icons/icon-192.png',data:{url:data.url},tag:data.tag||'bplus'}));
});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if('focus' in c)return c.focus();}return clients.openWindow(event.notification.data?.url||'./app.html')}));});