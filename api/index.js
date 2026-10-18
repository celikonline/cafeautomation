// Vercel function entry: never opens a listening socket or writes local runtime data.
let app;
module.exports=(req,res)=>{
  try {if(!app)app=require('../examples/payments/cloud-app.cjs')();}
  catch(error){res.statusCode=503;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({error:'Yayın yapılandırması eksik. Vercel ortam değişkenlerini kontrol edin.'}));return;}
  return app(req,res);
};
