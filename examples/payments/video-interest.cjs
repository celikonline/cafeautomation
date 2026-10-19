// Anonymous viewing preferences stay in the browser; only published clips are ranked.
const topics={latte:'latte',cappuccino:'latte',iced:'iced',americano:'brew',turkish:'espresso'};
const youtube=[
  {id:'20HxMMSqRyg',topic:'latte',title:'Latte sanatına ilk adım',by:'James Hoffmann'},
  {id:'GD8RUoOalBU',topic:'latte',title:'Sütlü kahvenin dengesi',by:'James Hoffmann'},
  {id:'AI4ynXzkSQo',topic:'brew',title:'V60 ile kahve demleme',by:'James Hoffmann'},
  {id:'F4wrUP4c5P4',topic:'espresso',title:'Espresso: kahve ve su oranı',by:'James Hoffmann'},
  {id:'PApBycDrPo0',topic:'iced',title:'Buzlu filtre kahvenin sırrı',by:'James Hoffmann'},
  {id:'8uGGeV8A-BM',topic:'iced',title:'Soğuk kahve için farklı bir teknik',by:'James Hoffmann'}
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
