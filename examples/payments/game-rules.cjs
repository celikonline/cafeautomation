const levels = [
  {pairs:4, seconds:100, peek:850, name:'Çırak'},
  {pairs:5, seconds:95, peek:800, name:'Kahve Dostu'},
  {pairs:6, seconds:90, peek:750, name:'Köpük Ustası'},
  {pairs:8, seconds:85, peek:650, name:'Barista'},
  {pairs:10, seconds:80, peek:550, name:'Baş Barista'},
  {pairs:12, seconds:75, peek:500, name:'Kahve Ustası'},
  {pairs:12, seconds:65, peek:425, name:'Hafıza Ustası'},
  {pairs:12, seconds:55, peek:350, name:'Bahçe Şampiyonu'},
];
function level(number) { return levels[Math.max(0, Math.min(levels.length - 1, number - 1))]; }
function createDeck(number, products, random = Math.random) {
  const chosen = products.slice(0, level(number).pairs);
  const cards = chosen.concat(chosen).map((product, id) => ({product, id}));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
function score(number, moves, remaining) {
  return Math.max(100, number * 300 + remaining * 10 - Math.max(0, moves - level(number).pairs) * 30);
}
module.exports = {levels, level, createDeck, score};
