const test=require('node:test');
const assert=require('node:assert/strict');
const game=require('./game-rules.cjs');
const products=require('./catalog.json').map(p=>p.id);
test('levels increase the challenge with complete, shuffled pairs',()=>{
  let previous=game.level(1);
  game.levels.forEach((level,index)=>{
    const cards=game.createDeck(index+1,products,()=>0.3);
    assert.equal(cards.length,level.pairs*2);
    assert.equal(new Set(cards.map(c=>c.id)).size,cards.length);
    for(const product of new Set(cards.map(c=>c.product)))assert.equal(cards.filter(c=>c.product===product).length,2);
    if(index){assert.ok(level.pairs>=previous.pairs);assert.ok(level.seconds<previous.seconds);assert.ok(level.peek<=previous.peek);}
    previous=level;
  });
  assert.equal(game.level(100),game.level(8));
  assert.equal(game.level(0),game.level(1));
});
test('score rewards speed and efficient matching, with a positive floor',()=>{
  assert.ok(game.score(2,5,50)>game.score(2,8,50));
  assert.ok(game.score(2,5,70)>game.score(2,5,50));
  assert.equal(game.score(1,100,0),100);
});
