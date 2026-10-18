const dayKey=()=>new Date().toLocaleDateString('en-CA');
function seed(){
 const tables=Array.from({length:12},(_,i)=>({id:i+1,area:i<8?'İç Mekân':'Teras',capacity:i%3===0?4:2,guests:0,opened:'',items:[],note:'',kitchen:'new',reservation:null}));
 const fill=(id,guests,opened,items,kitchen)=>Object.assign(tables[id-1],{guests,opened,items:items.map(([id,qty])=>({id,qty})),kitchen});
 fill(1,3,'10:25',[['latte',2],['americano',1],['cheesecake',1]],'preparing');
 fill(3,2,'10:42',[['turkish',2],['tea',2]],'served');
 fill(6,2,'11:05',[['iced',2],['brownie',1]],'new');
 fill(10,4,'10:50',[['cappuccino',2],['lemonade',2],['croissant',2]],'ready');
 tables[7].reservation={name:'Deniz Kaya',time:'14:00',guests:2};
 return {tables,sales:[{id:'KFE-001',table:2,amount:340,method:'Kart',time:'10:12',date:dayKey(),items:[{id:'latte',qty:1},{id:'turkish',qty:1},{id:'lemonade',qty:1}]},{id:'KFE-002',table:5,amount:460,method:'Nakit',time:'10:38',date:dayKey(),items:[{id:'americano',qty:2},{id:'turkish',qty:1},{id:'latte',qty:1}]}]};
}

module.exports=seed;
