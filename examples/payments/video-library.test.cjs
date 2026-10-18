const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const express=require('express');
const {published,istanbulDate,attach}=require('./video-library.cjs');
const library=require('./video-catalog.json');
test('130 distinct videos are prepared: 50 initially, then five new videos daily',()=>{
  assert.equal(library.length,130);
  assert.equal(new Set(library.map(c=>c.id)).size,130);
  assert.equal(new Set(library.map(c=>c.source)).size,130);
  const hashes=new Set(),dates={};
  for(const clip of library){
    const buffer=fs.readFileSync(path.join(__dirname,'assets/videos',clip.file+'.mp4'));
    assert.equal(buffer.toString('ascii',4,8),'ftyp');
    hashes.add(crypto.createHash('sha256').update(buffer).digest('hex'));
    dates[clip.publishOn]=(dates[clip.publishOn]||0)+1;
  }
  assert.equal(hashes.size,130);assert.equal(Object.keys(dates).length,17);assert.equal(dates['2026-10-19'],50);assert.ok(Object.entries(dates).filter(([date])=>date!=='2026-10-19').every(([,count])=>count===5));
});
test('publication changes at Istanbul midnight and keeps earlier content',()=>{
  assert.equal(istanbulDate(new Date('2026-10-19T20:59:59Z')),'2026-10-19');
  assert.equal(istanbulDate(new Date('2026-10-19T21:00:00Z')),'2026-10-20');
  assert.equal(published(library,new Date('2026-10-18T12:00:00Z')).clips.length,0);
  assert.equal(published(library,new Date('2026-10-19T20:59:59Z')).clips.length,50);
  const next=published(library,new Date('2026-10-19T21:00:00Z'));
  assert.equal(next.clips.length,55);assert.equal(next.todayCount,5);assert.equal(next.clips[0].publishOn,'2026-10-20');
  assert.equal(published(library,new Date('2026-11-04T12:00:00Z')).clips.length,130);
});
test('future media stays inaccessible and a client date cannot move the schedule',async t=>{
  const app=express();let now=new Date('2026-10-19T12:00:00Z');
  app.use('/api/admin',(req,res)=>res.sendStatus(403));
  attach(app,{now:()=>now,admin:(req,res)=>res.sendStatus(403)});
  const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base='http://127.0.0.1:'+server.address().port;
  const future=library[50];
  assert.equal((await fetch(base+'/media/'+future.file+'.mp4')).status,404);
  const feed=await fetch(base+'/api/guest/videos?date=2028-01-01').then(r=>r.json());
  assert.equal(feed.clips.length,50);assert.equal(feed.date,'2026-10-19');
  assert.equal((await fetch(base+'/api/admin/videos/'+future.id+'/preview')).status,403);
  assert.equal((await fetch(base+'/videos')).status,403);
  now=new Date('2026-10-19T21:00:00Z');
  const media=await fetch(base+'/media/'+future.file+'.mp4',{headers:{Range:'bytes=0-31'}});
  assert.equal(media.status,206);assert.match(media.headers.get('content-type'),/video\/mp4/);
  assert.equal((await media.arrayBuffer()).byteLength,32);
});
