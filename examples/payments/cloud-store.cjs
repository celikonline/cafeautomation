const crypto=require('crypto');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const SAVE="if redis.call('GET',KEYS[1]) ~= ARGV[1] then return 0 end redis.call('SET',KEYS[2],ARGV[2]); redis.call('DEL',KEYS[1]); return 1";
const RELEASE="if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0";
class CloudStore {
  constructor({url,token,key='bahce:production',command}={}){
    // Keep lock and state in one Redis Cluster hash slot for the atomic Lua write.
    this.key='{'+key.replace(/[{}]/g,'')+'}';
    this.command=command|| (async command=>{
      const response=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(8000)});
      if(!response.ok)throw new Error('Kalıcı veri bağlantısı kurulamadı.');
      const data=await response.json();
      if(data.error)throw new Error('Kalıcı veri işlemi tamamlanamadı.');
      return data.result;
    });
  }
  async load(initial){
    const raw=await this.command(['GET',this.key+':state']);
    const state=raw?JSON.parse(raw):JSON.parse(JSON.stringify(initial));
    if(!Array.isArray(state.tables)||!Array.isArray(state.orders)||!state.guests||!Number.isInteger(state.revision))throw new Error('Kalıcı veri biçimi geçersiz.');
    return state;
  }
  async acquire(){
    const owner=crypto.randomUUID();
    for(let attempt=0;attempt<20;attempt++){
      if(await this.command(['SET',this.key+':lock',owner,'NX','PX',30000])==='OK')return owner;
      await sleep(100);
    }
    throw new Error('Başka bir işlem sürüyor. Lütfen tekrar deneyin.');
  }
  async save(owner,state){
    const saved=await this.command(['EVAL',SAVE,2,this.key+':lock',this.key+':state',owner,JSON.stringify(state)]);
    if(saved!==1)throw new Error('İşlem süresi doldu. Sipariş durumunu kontrol edip yeniden deneyin.');
  }
  async release(owner){if(owner)await this.command(['EVAL',RELEASE,1,this.key+':lock',owner]);}
  middleware({context,initial,needsWrite}){
    return async(req,res,next)=>{
      let owner=null,finished=false;
      const finish=async()=>{if(finished)return;finished=true;await this.release(owner).catch(()=>{});};
      const original=res.json.bind(res);
      try {
        let state=await this.load(initial);
        if(needsWrite(req,state)){owner=await this.acquire();state=await this.load(initial);}
        if(res.destroyed){finish();return;}
        const requestState={state,dirty:false};
        res.once('finish',finish);res.once('close',finish);
        let responding=false;
        res.json=body=>{
          if(responding)return res;
          responding=true;
          (async()=>{
            if(requestState.dirty){
              if(!owner)throw new Error('Kalıcı veri işlemi yeniden denenmeli.');
              await this.save(owner,requestState.state);
              owner=null;
            }
            if(owner){await this.release(owner);owner=null;}
            original(body);
          })().catch(async()=>{await finish();res.removeHeader('Set-Cookie');res.status(503);res.set('Retry-After','2');original({error:'İşlem kaydedilemedi. Siparişlerini kontrol edip yeniden dene.'});});
          return res;
        };
        context.run(requestState,next);
      }catch(error){await finish();res.status(503).set('Retry-After','2');original({error:'Kafe veri bağlantısı şu anda kullanılamıyor. Lütfen tekrar deneyin.'});}
    };
  }
}
module.exports=CloudStore;
