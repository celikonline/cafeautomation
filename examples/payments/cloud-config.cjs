const crypto=require('crypto');
function configuration(env=process.env){
  const required=['UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','CAFE_QR_SECRET','CAFE_ADMIN_PASSWORD'];
  const missing=required.filter(name=>!env[name]);
  if(missing.length)throw new Error('Eksik Vercel ortam değişkenleri: '+missing.join(', '));
  if(env.CAFE_QR_SECRET.length<32)throw new Error('CAFE_QR_SECRET en az 32 karakter olmalı.');
  if(env.CAFE_ADMIN_PASSWORD.length<12)throw new Error('CAFE_ADMIN_PASSWORD en az 12 karakter olmalı.');
  const url=new URL(env.UPSTASH_REDIS_REST_URL);
  if(url.protocol!=='https:')throw new Error('Redis REST adresi HTTPS olmalı.');
  const publicBase=env.CAFE_PUBLIC_URL||(env.VERCEL_URL?'https://'+env.VERCEL_URL:'');
  if(!publicBase||new URL(publicBase).protocol!=='https:')throw new Error('CAFE_PUBLIC_URL için HTTPS yayın adresi gerekli.');
  return {url:url.href,token:env.UPSTASH_REDIS_REST_TOKEN,secret:env.CAFE_QR_SECRET,user:env.CAFE_ADMIN_USER||'admin',password:env.CAFE_ADMIN_PASSWORD,publicBase:publicBase.replace(/\/$/,''),key:env.CAFE_STORE_KEY||'bahce:'+(env.VERCEL_ENV||'production')};
}
const equal=(a,b)=>crypto.timingSafeEqual(crypto.createHash('sha256').update(a).digest(),crypto.createHash('sha256').update(b).digest());
function adminAuth({user,password}){
  return (req,res,next)=>{
    let supplied='';
    const header=req.headers.authorization||'';
    if(header.startsWith('Basic '))supplied=Buffer.from(header.slice(6),'base64').toString('utf8');
    if(!equal(supplied,user+':'+password))return res.status(401).set({'WWW-Authenticate':'Basic realm="BOA Pay Yonetim", charset="UTF-8"','Cache-Control':'no-store'}).json({error:'Yönetici girişi gerekli.'});
    next();
  };
}
function mediaPath(file,secret){return '/video-assets/'+crypto.createHmac('sha256',secret).update('media:'+file).digest('hex')+'.mp4';}
module.exports={configuration,adminAuth,mediaPath};
