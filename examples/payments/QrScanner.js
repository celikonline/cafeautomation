import React from 'react';
import jsQR from 'jsqr';

export default class QrScanner extends React.Component {
  state={starting:false,running:false,busy:false,error:''};
  componentDidMount(){this.mounted=true;this.generation=0;this.start();document.addEventListener('visibilitychange',this.visibility);}
  componentWillUnmount(){this.mounted=false;this.stop();document.removeEventListener('visibilitychange',this.visibility);}
  visibility=()=>{if(document.hidden){this.stop();if(this.mounted)this.setState({starting:false,running:false,error:'Kamera duraklatıldı. Devam etmek için kamerayı yeniden aç.'});}};
  stop=()=>{this.generation++;clearTimeout(this.frame);if(this.stream)this.stream.getTracks().forEach(track=>track.stop());this.stream=null;if(this.video)this.video.srcObject=null;};
  start=async()=>{
    this.stop();const generation=this.generation;
    if(!window.isSecureContext)return this.setState({error:'Kamerayı açmak için HTTPS bağlantısı gerekli. QR görselini de seçebilirsin.'});
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return this.setState({error:'Bu tarayıcı kamerayı açamıyor. QR görseli seçerek devam edebilirsin.'});
    this.setState({starting:true,running:false,busy:false,error:''});
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
      if(!this.mounted||generation!==this.generation){stream.getTracks().forEach(track=>track.stop());return;}
      this.stream=stream;this.video.srcObject=stream;await this.video.play();
      if(!this.mounted||generation!==this.generation)return;
      this.setState({starting:false,running:true});this.scan(generation);
    }catch(error){if(this.mounted&&generation===this.generation){this.stop();this.setState({starting:false,running:false,error:error.name==='NotAllowedError'?'Kamera izni verilmedi. Tarayıcı ayarlarından izin verebilir veya QR görselini seçebilirsin.':error.name==='NotFoundError'?'Kamera bulunamadı. QR görseli seçerek devam edebilirsin.':'Kamera açılamadı. Başka bir uygulamada açıksa kapatıp yeniden dene.'});}}
  };
  decode=(source,width,height,maxSize=720)=>{
    const scale=Math.min(1,maxSize/Math.max(width,height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
    const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(source,0,0,canvas.width,canvas.height);
    const pixels=context.getImageData(0,0,canvas.width,canvas.height);
    return jsQR(pixels.data,pixels.width,pixels.height,{inversionAttempts:'attemptBoth'});
  };
  scan=generation=>{
    if(!this.mounted||generation!==this.generation)return;
    if(this.video&&this.video.readyState>=2){
      try{const code=this.decode(this.video,this.video.videoWidth,this.video.videoHeight);if(code){this.detect(code.data);return;}}catch(error){/* A video frame can be unavailable briefly during camera initialization. */}
    }
    this.frame=setTimeout(()=>this.scan(generation),220);
  };
  detect=async value=>{
    this.stop();if(!this.mounted)return;
    this.setState({busy:true,starting:false,running:false,error:''});
    try{await this.props.onDetected(value);}catch(error){if(this.mounted)this.setState({busy:false,error:error.message||'QR doğrulanamadı. Lütfen tekrar dene.'});}
  };
  chooseImage=async event=>{
    const file=event.target.files[0];event.target.value='';if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024)return this.setState({error:'10 MB altında JPG, PNG veya WebP QR görseli seç.'});
    this.stop();const generation=this.generation;this.setState({busy:true,starting:false,running:false,error:''});
    const url=URL.createObjectURL(file);
    try{
      const image=await new Promise((resolve,reject)=>{const photo=new Image();photo.onload=()=>resolve(photo);photo.onerror=()=>reject(new Error('Görsel açılamadı. Başka bir fotoğraf dene.'));photo.src=url;});
      if(!this.mounted||generation!==this.generation)return;
      const code=this.decode(image,image.naturalWidth,image.naturalHeight,1600);
      if(!code)throw new Error('Görselde QR bulunamadı. Kodu net ve tamamı görünecek şekilde çek.');
      await this.detect(code.data);
    }catch(error){if(this.mounted&&generation===this.generation)this.setState({busy:false,error:error.message});}
    finally{URL.revokeObjectURL(url);}
  };
  render(){const s=this.state;return <React.Fragment>
    <span className="guest-eyebrow">BİR QR, SENİN MASAN</span><h2 id="guest-dialog-title">Masana bağlan.</h2>
    <p className="dialog-subtitle">Kameranı masandaki QR koduna doğrult. Kod okununca masan otomatik açılacak.</p>
    <div className={'qr-camera-stage '+(s.running?'is-running':'')}>
      <video ref={node=>{this.video=node;}} autoPlay playsInline muted aria-label="Masa QR kodu kamera görüntüsü"/>
      {!s.running&&<div className="qr-camera-placeholder"><svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M3 9V3h6m6 0h6v6m0 6v6h-6m-6 0H3v-6"/><path d="M7 7h3v3H7zm7 0h3v3h-3zm-7 7h3v3H7zm7 0h3v3h-3z"/></svg><span>{s.busy?'Masan doğrulanıyor…':s.starting?'Kamera izni bekleniyor…':'Masandaki karekodu okut'}</span></div>}
      <div className="qr-scan-guide" aria-hidden="true"><i/><i/><i/><i/>{s.running&&<b/>}</div>
    </div>
    <p className="qr-camera-status" role="status">{s.running?'QR kodunu çerçevenin içinde tut.':s.busy?'Bağlantı kontrol ediliyor…':'Arka kameran kullanılır; görüntüler cihazında işlenir.'}</p>
    {s.error&&<p className="guest-form-error" role="alert">{s.error}</p>}
    {!s.running&&!s.starting&&<button className="qr-retry" onClick={this.start} disabled={s.busy}>Kamerayı yeniden aç</button>}
    <label className={'qr-upload '+(s.busy?'disabled':'')}><span>QR görseli seç</span><small>Fotoğraf veya ekran görüntüsü · En fazla 10 MB</small><input type="file" accept="image/png,image/jpeg,image/webp" aria-label="QR kodu fotoğrafı seç" onChange={this.chooseImage} disabled={s.busy}/></label>
    <small className="qr-privacy">Kamera yalnızca bu pencere açıkken kullanılır. Görüntü ve fotoğraf sunucuya gönderilmez.</small>
  </React.Fragment>;}
}
