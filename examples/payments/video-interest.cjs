// Anonymous viewing preferences stay in the browser; only published clips are ranked.
const topics={latte:'latte',cappuccino:'latte',iced:'iced',americano:'brew',turkish:'espresso'};
const youtube=[
  {
    "id": "ZnQlBUW6y00",
    "topic": "latte",
    "language": "tr",
    "title": "Latte Art Nasıl Yapılır? Latte Art Eğitimi | En Detaylı Eğitim",
    "by": "Varona Coffee & Roastery"
  },
  {
    "id": "4BdwUKWU2cw",
    "topic": "brew",
    "language": "tr",
    "title": "V60 ile Kahve Demleme Tekniği - Ben Nasıl Demliyorum?",
    "by": "Kahve Masası"
  },
  {
    "id": "8Bw3oqCitKc",
    "topic": "brew",
    "language": "tr",
    "title": "V60 ile Kahve Nasıl Demlenir?",
    "by": "Baristocrat Specialty Coffee Experience"
  },
  {
    "id": "gnf3pnp7c58",
    "topic": "espresso",
    "language": "tr",
    "title": "Espresso nasıl yapılır?",
    "by": "cevaptv"
  },
  {
    "id": "JqTNzDFEHMA",
    "topic": "iced",
    "language": "tr",
    "title": "Buzlu Soğuk Kahve Yapımında En İyi Yöntem! 👌🏻😉",
    "by": "Nefis Yemek Tarifleri"
  },
  {
    "id": "Y0cVqVtl9Qk",
    "topic": "iced",
    "language": "tr",
    "title": "1 Dakikada Hazır! 🙌🏻 Buz Gibi Soğuk Türk Kahvesi ☕🤤",
    "by": "Nefis Yemek Tarifleri"
  }
];
const topic=clip=>clip.topic||topics[clip.product]||'brew';
function clean(value){
  const result={};if(!value||typeof value!=='object')return result;
  Object.keys(value).slice(-260).forEach(id=>{const row=value[id];if(!row||!['latte','iced','brew','espresso'].includes(row.topic))return;
    const number=(key,max)=>Math.max(0,Math.min(max,Number(row[key])||0));
    result[id]={topic:row.topic,seconds:number('seconds',36000),completions:number('completions',1000),last:number('last',Date.now())};
  });return result;
}
function record(profile,clip,seconds,completed=false,now=Date.now()){
  const next=clean(profile),prior=next[clip.id]||{seconds:0,completions:0};
  next[clip.id]={topic:topic(clip),seconds:Math.min(36000,prior.seconds+Math.max(0,Math.min(5,Number(seconds)||0))),completions:Math.min(1000,prior.completions+(completed?1:0)),last:now};
  return clean(next);
}
function interests(profile,now=Date.now()){
  const scores={};Object.values(clean(profile)).forEach(row=>{const decay=Math.pow(.5,Math.max(0,now-row.last)/(14*86400000));scores[row.topic]=(scores[row.topic]||0)+(Math.min(row.seconds,300)+Math.min(row.completions,10)*12)*decay;});return scores;
}
function rank(clips,profile,exclude=[],now=Date.now()){
  const scores=interests(profile,now),history=clean(profile);
  return clips.map((clip,index)=>({clip,index,score:(scores[topic(clip)]||0)-(history[clip.id]?Math.min(200,history[clip.id].seconds)*.25:0)})).filter(row=>!exclude.includes(row.clip.id)).sort((a,b)=>b.score-a.score||a.index-b.index).map(row=>row.clip);
}
module.exports={youtube,topic,clean,record,interests,rank};
