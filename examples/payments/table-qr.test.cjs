const test=require('node:test'),assert=require('node:assert/strict');
const tableQr=require('./table-qr.cjs');
test('printed QR pixels decode to the same-origin table route',async()=>{
 const token='a'.repeat(32),origin='https://cafeautomation.vercel.app';
 const bytes=await require('qrcode').toBuffer(origin+'/guest?table=4&t='+token,{width:480,margin:4});
 const png=require('pngjs').PNG.sync.read(bytes);
 const decoded=require('jsqr')(new Uint8ClampedArray(png.data),png.width,png.height);
 assert.ok(decoded);assert.deepEqual(tableQr(decoded.data,origin),{table:4,token,href:'/guest?table=4&t='+token+'&view=orders'});
});
test('foreign links, credentials, duplicate parameters and invalid table codes are rejected',()=>{
 const origin='https://cafeautomation.vercel.app',query='?table=4&t='+'a'.repeat(32);
 ['https://evil.test/guest'+query,'javascript:alert(1)',origin+'/guest?table=13&t='+'a'.repeat(32),origin+'/guest'+query+'&table=2',origin+'/guest'+query+'&t=bad',origin+'/guest?table=1',origin+'/guest/other'+query,'https://user:pass@cafeautomation.vercel.app/guest'+query].forEach(url=>assert.throws(()=>tableQr(url,origin)));
});
