import React from 'react';
import interest from './video-interest.cjs';

let apiPromise;
function loadApi(){
  if(window.YT&&window.YT.Player)return Promise.resolve(window.YT);
  if(!apiPromise)apiPromise=new Promise((resolve,reject)=>{
    const prior=window.onYouTubeIframeAPIReady;
    const timeout=setTimeout(()=>{apiPromise=null;reject(new Error('YouTube bağlantısı kurulamadı.'));},15000);
    window.onYouTubeIframeAPIReady=()=>{clearTimeout(timeout);if(prior)prior();resolve(window.YT);};
    let script=document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if(!script){script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';document.head.appendChild(script);}
    script.onerror=()=>{clearTimeout(timeout);script.remove();apiPromise=null;reject(new Error('YouTube yüklenemedi.'));};
  });return apiPromise;
}
export default class YoutubeLounge extends React.Component{
  constructor(props){super(props);this.state={clip:interest.rank(interest.youtube,props.profile)[0],auto:true,error:''};this.seen=[];}
  componentDidMount(){this.alive=true;loadApi().then(YT=>{
    if(!this.alive)return;
    this.player=new YT.Player(this.host,{host:'https://www.youtube-nocookie.com',videoId:this.state.clip.id,width:'100%',height:'100%',playerVars:{hl:'tr',cc_lang_pref:'tr',playsinline:1,origin:location.origin,autoplay:1},events:{
      onReady:()=>{if(this.alive)this.player.playVideo();},
      onStateChange:event=>{if(!this.alive)return;this.playing=event.data===1;this.last=performance.now();if(event.data===0){this.props.onWatch(this.state.clip,0,true);if(this.state.auto)this.next();}},
      onError:()=>this.alive&&this.setState({error:'Bu video burada oynatılamıyor. YouTube’da açabilir veya sonrakine geçebilirsin.'})
    }});
    this.tick=setInterval(()=>{const now=performance.now();if(this.playing&&!document.hidden){const delta=(now-(this.last||now))/1000;if(delta>0&&delta<2)this.props.onWatch(this.state.clip,delta,false);}this.last=now;},1000);
  }).catch(error=>this.alive&&this.setState({error:error.message}));document.addEventListener('visibilitychange',this.visibility);}
  componentWillUnmount(){this.alive=false;clearInterval(this.tick);document.removeEventListener('visibilitychange',this.visibility);if(this.player&&this.player.destroy)this.player.destroy();}
  visibility=()=>{this.last=performance.now();if(document.hidden&&this.player&&this.player.pauseVideo)this.player.pauseVideo();};
  next=()=>{this.seen.push(this.state.clip.id);let candidates=interest.rank(interest.youtube,this.props.profile,this.seen);if(!candidates.length){this.seen=[this.state.clip.id];candidates=interest.rank(interest.youtube,this.props.profile,this.seen);}const clip=candidates[0];this.playing=false;this.setState({clip,error:''},()=>{if(this.player&&this.player.loadVideoById)this.player.loadVideoById(clip.id);});};
  render(){const {clip,auto,error}=this.state;return <React.Fragment><span className="guest-eyebrow">KAHVE SİNEMASI · SANA GÖRE</span><h2 id="guest-dialog-title">Biraz daha keşfet.</h2><p className="dialog-subtitle">İzleme süren ve tekrarların kahve zevkini anlatır. Önerilerin yalnızca bu cihazda hatırlanır.</p><div className="youtube-stage"><div ref={node=>{this.host=node;}}/></div><div className="youtube-title"><strong>{clip.title}</strong><small>{clip.by} · Türkçe</small></div>{error&&<p className="guest-form-error" role="alert">{error}</p>}<div className="youtube-actions"><a href={'https://www.youtube.com/watch?v='+clip.id} target="_blank" rel="noopener noreferrer">YouTube’da aç ↗</a><button onClick={this.next}>Sıradaki öneri →</button></div><label className="youtube-auto"><input type="checkbox" checked={auto} onChange={event=>this.setState({auto:event.target.checked})}/> Video bitince ilgime göre devam et</label><button className="interest-reset" onClick={()=>{this.props.onReset();this.setState({error:''});}}>İzleme geçmişimi sıfırla</button></React.Fragment>;}
}
