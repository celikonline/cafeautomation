const express=require('express');
const path=require('path');
const CloudStore=require('./cloud-store.cjs');
const {configuration,adminAuth,mediaPath}=require('./cloud-config.cjs');
module.exports=function createCloudApp({env=process.env,store,now}={}){
  const config=configuration(env),app=express(),admin=adminAuth(config);
  app.disable('x-powered-by');
  app.set('trust proxy',1);
  app.use(express.json({limit:'100kb'}));
  app.use((req,res,next)=>{res.set('Cache-Control','no-store');next();});
  app.use((req,res,next)=>{
    if(req.path==='/'||['/qr','/videos','/loyalty'].includes(req.path)||req.path==='/api/admin'||req.path.startsWith('/api/admin/'))return admin(req,res,next);
    next();
  });
  require('./pwa-api.cjs')(app);
  require('./guest-api.cjs')(app,{store:store||new CloudStore(config),secret:config.secret,admin,now,publicBase:config.publicBase,mediaUrl:file=>mediaPath(file,config.secret)});
  app.get('/api/health',(req,res)=>res.json({ok:true,storage:'redis',timeZone:'Europe/Istanbul'}));
  app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
  app.use((req,res)=>res.status(404).json({error:'Sayfa bulunamadı.'}));
  return app;
};
