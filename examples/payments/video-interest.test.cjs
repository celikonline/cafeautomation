const test=require('node:test'),assert=require('node:assert/strict');
const interest=require('./video-interest.cjs');
test('watch time and loops personalize the next YouTube video without duplicates',()=>{
 let profile={};const latte={id:'reel-latte',product:'latte'},iced={id:'reel-iced',product:'iced'};
 for(let i=0;i<20;i++)profile=interest.record(profile,latte,1,i===19,10000);
 profile=interest.record(profile,iced,1,false,10000);
 const ranked=interest.rank(interest.youtube,profile,[],10000);
 assert.equal(ranked[0].topic,'latte');
 assert.notEqual(interest.rank(interest.youtube,profile,[ranked[0].id],10000)[0].id,ranked[0].id);
 assert.equal(interest.rank(interest.youtube,{},[],10000)[0].id,interest.youtube[0].id);
 assert.deepEqual(interest.rank([iced],profile,[],10000),[iced]); // Never introduces unpublished clips.
});
test('preferences are bounded and recent interests outweigh stale interests',()=>{
 const now=Date.now(),old=now-90*86400000;
 const profile={old:{topic:'latte',seconds:300,completions:10,last:old},new:{topic:'iced',seconds:40,completions:1,last:now}};
 assert.equal(interest.rank(interest.youtube,profile,[],now)[0].topic,'iced');
 const bounded=interest.record({}, {id:'x',product:'latte'},10000,false,now);
 assert.equal(bounded.x.seconds,5);
 assert.deepEqual(interest.clean({bad:{topic:'invalid',seconds:99}}),{});
 assert.deepEqual(interest.clean(null),{});
});
