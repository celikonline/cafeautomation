// Explicit one-time publishing plan. Startup never shifts these dates.
const fs=require('fs');
const path=require('path');
const sources=require('./assets/videos/sources.json');
if(sources.length!==130)throw new Error('Prepare exactly 130 unique video files first.');
const titles=['Günün en güzel\nyudumu.','Küçük mutluluklar,\nbüyük fincanlarda.','Her güzel şey\nbir ritüelle başlar.','Bir fincan,\nbin güzel an.','Sohbetin en güzel\neşlikçisi.','Bugün kendine\nbir mola ver.','Kokusu bile\niyi gelir.','İyi kahve,\niyi bir başlangıç.','Yavaşla.\nTadını çıkar.','Birlikte içilen\nkahvenin hatırı.','Çekirdekten fincana\nözenle.','Biraz kahve,\nbiraz huzur.','Bu anın tadı\nbambaşka.'];
const captions=['Taze çekirdekler, özenle hazırlanan bir fincan. Bu küçük mola senin için.','Sevdiğin kahveyi seç, sohbetin keyfini çıkar. Yanına küçük bir tatlı çok yakışır.','Bir yudum al, biraz yavaşla. Günün en güzel anı bazen burada başlar.','Kahvenin kokusu, iyi bir sohbet ve sana ayrılmış bir masa. Bahçe’de buluşalım.','Kahve hazırlamanın küçük ritüellerini keşfet. Beğendiğin lezzeti masanda dene.'];
const oldIds=['morning','foam','ritual'];
const library=sources.map((s,index)=>{
 const date=new Date(Date.UTC(2026,9,19+Math.floor(index/5))).toISOString().slice(0,10);
 const product=/cappuccino/i.test(s.source)?'cappuccino':/latte|milk|foam|barista/i.test(s.source)?'latte':/ice|cold/i.test(s.source)?'iced':'americano';
 return {id:oldIds[index]||s.name,file:s.name,product:index===0?'latte':index===1?'cappuccino':product,position:index+1,publishOn:date,tag:['KÜÇÜK BİR MOLA','BİR KAHVENİN HİKÂYESİ','BAHÇE’DE GÜZEL ANLAR','KAHVE RİTÜELİ','GÜNÜN KAHVE MOLASI'][index%5],title:titles[index%titles.length],caption:captions[Math.floor(index/5)%captions.length],source:s.source,by:'Mixkit'};
});
fs.writeFileSync(path.join(__dirname,'video-catalog.json'),JSON.stringify(library,null,2)+'\n');
console.log('Scheduled',library.length,'videos:',library[0].publishOn,'through',library[129].publishOn);
