function tableQr(value,origin){
  let url;
  try{url=new URL(String(value).trim(),origin);}catch(error){throw new Error('QR kodu okunamadı. Masandaki kodu yeniden dene.');}
  if(url.origin!==origin||url.pathname!=='/guest'||url.username||url.password)throw new Error('Bu QR kodu bu kafeye ait bir masa kodu değil.');
  const tables=url.searchParams.getAll('table'),tokens=url.searchParams.getAll('t');
  if(tables.length!==1||tokens.length!==1||!/^(?:[1-9]|1[0-2])$/.test(tables[0])||!/^[a-f0-9]{32}$/i.test(tokens[0]))throw new Error('Geçerli bir masa QR kodu bulunamadı. Servis ekibinden yardım isteyebilirsin.');
  const table=Number(tables[0]),token=tokens[0].toLowerCase();
  return {table,token,href:'/guest?table='+table+'&t='+token+'&view=orders'};
}
module.exports=tableQr;
