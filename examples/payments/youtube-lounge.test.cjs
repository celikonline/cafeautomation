const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
test('YouTube ending advances recommendations, opt-out stops advancement, and hidden player pauses',async()=>{
 let events,interval,now=1000,paused=0,destroyed=0,profile={},loaded;
 const interest=require('./video-interest.cjs');
 function Component(props){this.props=props;}
 Component.prototype.setState=function(update,callback){this.state={...this.state,...update};if(callback)callback();};
 class Player{constructor(host,options){events=options.events;}playVideo(){}loadVideoById(id){loaded=id;}pauseVideo(){paused++;}destroy(){destroyed++;}}
 const context={exports:{},require:id=>id==='react'?{Component}:id==='./video-interest.cjs'?interest:require(id),window:{YT:{Player}},location:{origin:'https://cafe.test'},document:{hidden:false,addEventListener(){},removeEventListener(){}},performance:{now:()=>now},setInterval:fn=>{interval=fn;return 1;},clearInterval(){},setTimeout,clearTimeout};
 const code=require('@babel/core').transformFileSync(require('path').join(__dirname,'YoutubeLounge.js'),{presets:['@babel/preset-env','@babel/preset-react'],plugins:['@babel/plugin-proposal-class-properties']}).code;
 vm.runInNewContext(code,context);
 const props={profile,onWatch:(clip,seconds,done)=>{profile=interest.record(profile,clip,seconds,done);props.profile=profile;},onReset(){}};
 const view=new context.exports.default(props);view.componentDidMount();await Promise.resolve();
 const first=view.state.clip.id;events.onStateChange({data:1});now+=1000;interval();assert.equal(profile[first].seconds,1);
 context.document.hidden=true;now+=1000;interval();assert.equal(profile[first].seconds,1);view.visibility();assert.equal(paused,1);
 events.onStateChange({data:0});assert.notEqual(view.state.clip.id,first);assert.equal(loaded,view.state.clip.id);assert.equal(profile[first].completions,1);
 view.setState({auto:false});const second=view.state.clip.id;events.onStateChange({data:0});assert.equal(view.state.clip.id,second);
 view.componentWillUnmount();assert.equal(destroyed,1);
});
