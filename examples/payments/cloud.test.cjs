const test=require('node:test');
const assert=require('node:assert/strict');
const CloudStore=require('./cloud-store.cjs');
const createApp=require('./cloud-app.cjs');
const {configuration,mediaPath}=require('./cloud-config.cjs');
const library=require('./video-catalog.json');
const env={UPSTASH_REDIS_REST_URL:'https://test.invalid',UPSTASH_REDIS_REST_TOKEN:'test-only',CAFE_QR_SECRET:'test-only-secret-for-isolated-cloud-tests',CAFE_ADMIN_PASSWORD:'test-only-password',CAFE_PUBLIC_URL:'https://cafe.example'};
function redisFixture(){
  const data=new Map();
  const fixture={failSave:false,data};
  fixture.command=async command=>{
    await new Promise(resolve=>setTimeout(resolve,2));
    const [name,...args]=command;
    if(name==='GET')return data.get(args[0])||null;
    if(name==='SET'){if(args.includes('NX')&&data.has(args[0]))return null;data.set(args[0],args[1]);return 'OK';}
    if(name==='EVAL'){
      const [,count,lock,...rest]=args;
      const owner=count===2?rest[1]:rest[0];
      if(data.get(lock)!==owner)return 0;
      if(count===2){if(fixture.failSave)throw new Error('Simulated Redis failure');data.set(rest[0],rest[2]);}
      data.delete(lock);return 1;
    }
    throw new Error('Unexpected Redis command '+name);
  };
  return fixture;
}
async function listen(t,fixture){
  const app=createApp({env,store:new CloudStore({command:fixture.command,key:'test'}),now:()=>new Date('2026-10-19T12:00:00Z')});
  const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base='http://127.0.0.1:'+server.address().port;
  const call=async(url,{body,cookie,admin=false,raw=false,headers={}}={})=>{
    const r=await fetch(base+url,{method:body?'POST':'GET',redirect:'manual',headers:{'x-forwarded-proto':'https',...(admin?{Authorization:'Basic '+Buffer.from('admin:'+env.CAFE_ADMIN_PASSWORD).toString('base64')} : {}),...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
    return raw?r:{status:r.status,headers:r.headers,data:await r.json()};
  };
  return {base,call};
}
test('cloud configuration requires stable credentials and HTTPS',()=>{
  assert.throws(()=>configuration({}),/Eksik/);
  assert.throws(()=>configuration({...env,CAFE_QR_SECRET:'short'}),/32/);
  assert.throws(()=>configuration({...env,CAFE_PUBLIC_URL:'http://cafe.example'}),/HTTPS/);
  assert.equal(configuration({...env,CAFE_PUBLIC_URL:undefined,VERCEL_URL:'preview.vercel.app'}).publicBase,'https://preview.vercel.app');
});
test('separate cloud instances share orders, preserve guest isolation and acknowledge only saved writes',async t=>{
  const fixture=redisFixture(),a=await listen(t,fixture),b=await listen(t,fixture);
  assert.equal((await a.call('/api/admin/state')).status,401);
  assert.equal((await a.call('/',{raw:true})).status,401);
  const initial=await a.call('/api/admin/state',{admin:true});
  assert.equal(initial.data.sales.length,0);assert.ok(initial.data.tables.every(t=>!t.items.length));
  const qrs=await a.call('/api/admin/qrs',{admin:true});
  const qr=qrs.data.links.find(t=>t.id===4);assert.ok(qr.preview.startsWith('https://cafe.example/guest?'));
  const query=new URL(qr.url).searchParams.toString(),token=new URL(qr.url).searchParams.get('t');
  const sessionA=await a.call('/api/guest/session?'+query),cookieA=sessionA.headers.get('set-cookie').split(';')[0];
  assert.match(sessionA.headers.get('set-cookie'),/Secure/);
  const sessionB=await b.call('/api/guest/session?'+query),cookieB=sessionB.headers.get('set-cookie').split(';')[0];
  assert.notEqual(sessionA.data.profile.alias,sessionB.data.profile.alias);
  const order=(key,qty)=>({table:4,token,key,items:[{id:'latte',qty}],fulfillment:'takeaway'});
  const results=await Promise.all([a.call('/api/guest/orders',{body:order('cloud-order-a-001',1),cookie:cookieA}),b.call('/api/guest/orders',{body:order('cloud-order-b-001',3),cookie:cookieB})]);
  assert.ok(results.every(r=>r.status===201));
  const state=await b.call('/api/admin/state',{admin:true});assert.equal(state.data.tables[3].items[0].qty,4);
  const sessions=await Promise.all([a.call('/api/guest/session?'+query,{cookie:cookieA}),a.call('/api/guest/session?'+query,{cookie:cookieB})]);
  assert.equal(sessions[0].data.orders[0].items[0].qty,1);assert.equal(sessions[1].data.orders[0].items[0].qty,3);
  const cold=await listen(t,fixture);
  assert.equal((await cold.call('/api/guest/session?'+query,{cookie:cookieA})).data.orders.length,1);
  assert.equal((await cold.call('/api/guest/orders',{body:order('cloud-order-a-001',1),cookie:cookieA})).status,200);
  const paid=await a.call('/api/admin/tables/4/charge',{admin:true,body:{revision:state.data.revision,method:'Kart'}});
  assert.equal(paid.status,200);assert.equal(paid.data.sale.amount,580);
  assert.equal((await cold.call('/api/guest/session?'+query,{cookie:cookieA})).data.profile.coffees,1);
  fixture.failSave=true;
  assert.equal((await b.call('/api/guest/orders',{body:order('cloud-order-failure-001',1),cookie:cookieA})).status,503);
  fixture.failSave=false;
  assert.equal((await cold.call('/api/guest/session?'+query,{cookie:cookieA})).data.orders.length,1);
  assert.equal((await b.call('/api/guest/orders',{body:order('cloud-order-failure-001',1),cookie:cookieA})).status,201);
  assert.equal(fixture.data.has('{test}:lock'),false);
  assert.equal((await b.call('/api/guest/orders',{body:order('cloud-order-origin-001',1),cookie:cookieA,headers:{Origin:'https://evil.example'}})).status,403);
});
test('published media redirects to CDN; future video and admin preview remain guarded',async t=>{
  const {call}=await listen(t,redisFixture());
  const video=await call('/media/'+library[0].file+'.mp4',{raw:true});
  assert.equal(video.status,302);assert.equal(video.headers.get('location'),mediaPath(library[0].file,env.CAFE_QR_SECRET));
  assert.equal((await call('/media/'+library[50].file+'.mp4',{raw:true})).status,404);
  assert.equal((await call('/api/admin/videos/'+library[50].id+'/preview',{raw:true})).status,401);
  const preview=await call('/api/admin/videos/'+library[50].id+'/preview',{raw:true,admin:true});assert.equal(preview.status,302);
});
test('an expired writer cannot overwrite state or release another writer lock',async()=>{
  const fixture=redisFixture(),store=new CloudStore({command:fixture.command,key:'test'});
  fixture.data.set('{test}:lock','new-owner');fixture.data.set('{test}:state','original');
  await assert.rejects(()=>store.save('expired-owner',{revision:5}));
  await store.release('expired-owner');
  assert.equal(fixture.data.get('{test}:state'),'original');assert.equal(fixture.data.get('{test}:lock'),'new-owner');
});
