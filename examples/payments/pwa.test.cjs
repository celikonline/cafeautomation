const test=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
test('PWA manifest, icons and worker have valid installation responses',async t=>{
  const app=express();require('./pwa-api.cjs')(app);
  const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base='http://127.0.0.1:'+server.address().port;
  const r=await fetch(base+'/manifest.webmanifest');assert.match(r.headers.get('content-type'),/manifest\+json/);
  const manifest=await r.json();assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'/guest');assert.equal(manifest.start_url,'/guest');assert.equal(manifest.icons.length,3);
  for(const icon of manifest.icons){const data=Buffer.from(await fetch(base+icon.src).then(r=>r.arrayBuffer()));assert.equal(data.subarray(1,4).toString(),'PNG');const expected=Number(icon.sizes.split('x')[0]);assert.equal(data.readUInt32BE(16),expected);assert.equal(data.readUInt32BE(20),expected);}
  const worker=await fetch(base+'/sw.js');assert.equal(worker.status,200);assert.match(worker.headers.get('content-type'),/javascript/);assert.equal(worker.headers.get('cache-control'),'no-cache');
  assert.equal((await fetch(base+'/pwa/offline.html')).status,200);
});
test('worker uses the offline fallback for navigation, never intercepts orders or API data',async()=>{
  const events={},matches=[];
  const context={URL,self:{location:{origin:'https://cafe.example'},addEventListener:(name,handler)=>events[name]=handler},fetch:()=>Promise.reject(new Error('offline')),caches:{match:async url=>{matches.push(url);return 'offline-page';}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'pwa/sw.js'),'utf8'),context);
  let response;
  const event=request=>({request,respondWith:value=>response=value});
  for(const request of [{method:'POST',mode:'cors',url:'https://cafe.example/api/guest/orders'},{method:'GET',mode:'cors',url:'https://cafe.example/api/guest/session'},{method:'GET',mode:'cors',url:'https://cafe.example/media/morning.mp4'},{method:'GET',mode:'navigate',url:'https://cafe.example/'}]){events.fetch(event(request));assert.equal(response,undefined);}
  events.fetch(event({method:'GET',mode:'navigate',url:'https://cafe.example/guest?table=4'}));assert.equal(await response,'offline-page');assert.deepEqual(matches,['/pwa/offline.html']);
});
