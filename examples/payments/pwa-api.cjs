const path=require('path');
const express=require('express');
module.exports=function attachPwa(app){
  const root=path.join(__dirname,'pwa');
  app.use('/pwa',express.static(root,{maxAge:'1d',index:false}));
  app.get('/manifest.webmanifest',(req,res)=>res.set('Cache-Control','no-cache').type('application/manifest+json').send({
    id:'/guest',name:'Bahçe Kafe · BOA Pay',short_name:'Bahçe',description:'Kahveni keşfet, masandan sipariş ver. Kahve kartın ve favorilerin hep yanında.',lang:'tr',dir:'ltr',
    start_url:'/guest',scope:'/guest',display:'standalone',orientation:'any',background_color:'#f7f7ee',theme_color:'#356b53',
    categories:['food','entertainment'],
    icons:[{src:'/pwa/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/pwa/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},{src:'/pwa/icon-maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}],
    shortcuts:[{name:'Menüye göz at',short_name:'Menü',url:'/guest?view=menu'},{name:'Siparişlerim',short_name:'Masam',url:'/guest?view=orders'}]
  }));
  app.get('/sw.js',(req,res)=>res.set('Cache-Control','no-cache').type('application/javascript').sendFile(path.join(root,'sw.js')));
};
