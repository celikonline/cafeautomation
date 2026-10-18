// A code-drawn coffee mark; no external image dependency or source artwork.
const fs=require('fs');
const path=require('path');
const {PNG}=require('pngjs');
const folder=path.join(__dirname,'pwa');
const green=[53,107,83],cream=[247,244,230],gold=[212,187,134];
const ellipse=(x,y,cx,cy,rx,ry)=>((x-cx)/rx)**2+((y-cy)/ry)**2<1;
function create(size){
  const png=new PNG({width:size,height:size});
  for(let row=0;row<size;row++)for(let col=0;col<size;col++){
    let color=green;
    // Supersampling keeps the 192px edge smooth.
    const sum=[0,0,0];
    for(let sy=0;sy<2;sy++)for(let sx=0;sx<2;sx++){
      const x=(col+(sx+.5)/2)*512/size,y=(row+(sy+.5)/2)*512/size;
      color=green;
      if(ellipse(x,y,350,266,53,50)&&!ellipse(x,y,350,266,34,31))color=cream;
      if(x>=147&&x<=348&&y>=204&&y<=363&&(!(y>308)||x>=202&&x<=293||ellipse(x,y,202,308,55,55)||ellipse(x,y,293,308,55,55)))color=cream;
      if(y>373&&y<385&&x>138&&x<365)color=gold;
      if(y>118&&y<184&&(Math.abs(x-(222+7*Math.sin((y-118)/66*Math.PI*2)))<4||Math.abs(x-(280+7*Math.sin((y-118)/66*Math.PI*2)))<4))color=gold;
      if(ellipse(x,y,249,281,36,39))color=green;
      if(x>225&&x<273&&Math.abs(y-(351-x*.28))<3.5&&y>255&&y<311)color=cream;
      for(let c=0;c<3;c++)sum[c]+=color[c];
    }
    const i=(row*size+col)*4;
    for(let c=0;c<3;c++)png.data[i+c]=Math.round(sum[c]/4);
    png.data[i+3]=255;
  }
  return PNG.sync.write(png);
}
fs.writeFileSync(path.join(folder,'icon-192.png'),create(192));
const large=create(512);
fs.writeFileSync(path.join(folder,'icon-512.png'),large);
fs.writeFileSync(path.join(folder,'icon-maskable-512.png'),large);
