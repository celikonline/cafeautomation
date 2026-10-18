const fs=require('fs');
const path=require('path');
const webpack=require('webpack');
const {mediaPath}=require('./cloud-config.cjs');
const root=path.resolve(__dirname,'../..');
const output=path.join(root,'build','cafe');
// Only generated artifacts in this exact directory can be cleared.
if(output!==path.resolve(root,'build/cafe'))throw new Error('Unexpected build output path.');
const secret=process.env.CAFE_QR_SECRET;
if(!secret||secret.length<32)throw new Error('Build için en az 32 karakterlik CAFE_QR_SECRET ortam değişkeni gerekli.');
if(fs.existsSync(output))fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync(output,{recursive:true});
const config={
  mode:'production',context:root,entry:path.join(__dirname,'index.js'),
  output:{path:output,filename:'app.js',publicPath:'/'},devtool:false,
  resolve:{alias:{'@kuveytturk/boa-base':path.join(root,'packages/base/src'),'@kuveytturk/boa-components':path.join(root,'packages/components/src'),'@kuveytturk/boa-utils':path.join(root,'packages/utils/src')}},
  module:{rules:[
    {test:/\.js$/,exclude:/node_modules/,use:{loader:'babel-loader',options:{configFile:path.join(root,'babel.config.js')}}},
    {test:/\.css$/,use:['style-loader','css-loader']},
    {test:/\.(svg|png|jpe?g|webp|woff2?|ttf|eot)$/,use:{loader:'url-loader',options:{limit:8192,name:'assets/[name].[hash:8].[ext]'}}}
  ]},
  performance:{hints:false}
};
webpack(config,(error,stats)=>{
  if(error||stats.hasErrors()){console.error(error||stats.toString({all:false,errors:true}));process.exitCode=1;return;}
  fs.copyFileSync(path.join(__dirname,'index.html'),path.join(output,'index.html'));
  fs.cpSync(path.join(__dirname,'pwa'),path.join(output,'pwa'),{recursive:true});
  fs.copyFileSync(path.join(__dirname,'pwa/sw.js'),path.join(output,'sw.js'));
  const library=require('./video-catalog.json');
  fs.mkdirSync(path.join(output,'video-assets'),{recursive:true});
  for(const clip of library)fs.copyFileSync(path.join(__dirname,'assets/videos',clip.file+'.mp4'),path.join(output,mediaPath(clip.file,secret)));
  console.log('Vercel build ready: build/cafe · '+library.length+' CDN videos · app.js');
});
