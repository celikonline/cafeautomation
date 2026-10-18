const path = require('path');
const fs = require('fs');
const zone = 'Europe/Istanbul';
function istanbulDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:zone, year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(now);
  const get = type => parts.find(p=>p.type===type).value;
  return get('year')+'-'+get('month')+'-'+get('day');
}
function published(library, now = new Date()) {
  const date = istanbulDate(now);
  const clips = library.filter(c=>c.publishOn<=date).sort((a,b)=>b.publishOn.localeCompare(a.publishOn)||a.position-b.position);
  const upcoming = library.filter(c=>c.publishOn>date).map(c=>c.publishOn).sort();
  return {date, timeZone:zone, todayCount:clips.filter(c=>c.publishOn===date).length, nextDate:upcoming[0]||null, clips};
}
function attach(app, {admin, now=()=>new Date(), library=require('./video-catalog.json'), mediaUrl}={}) {
  const feed = () => published(library, now());
  const assets = path.join(__dirname,'assets/videos');
  app.get('/api/guest/videos',(req,res)=>res.json(feed()));
  app.get('/media/:file',(req,res)=>{
    const clip=library.find(c=>c.file+'.mp4'===req.params.file);
    if(!clip || clip.publishOn>istanbulDate(now()))return res.status(404).end();
    res.setHeader('Cache-Control','private, no-store');
    if(mediaUrl)return res.redirect(302,mediaUrl(clip.file));
    res.sendFile(path.join(assets,clip.file+'.mp4'));
  });
  app.get('/api/admin/videos',(req,res)=>res.json({date:istanbulDate(now()),timeZone:zone,clips:library}));
  app.get('/api/admin/videos/:id/preview',admin,(req,res)=>{
    const clip=library.find(c=>c.id===req.params.id);
    if(!clip)return res.status(404).end();
    res.setHeader('Cache-Control','no-store');
    if(mediaUrl)return res.redirect(302,mediaUrl(clip.file));
    res.sendFile(path.join(assets,clip.file+'.mp4'));
  });
  app.get('/videos',admin,(req,res)=>res.type('html').send(fs.readFileSync(path.join(__dirname,'video-calendar.html'),'utf8')));
  return {feed};
}
module.exports={istanbulDate,published,attach};
