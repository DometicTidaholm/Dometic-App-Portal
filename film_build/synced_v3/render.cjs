'use strict';
// Deterministic 60 fps film. Continuous subpixel camera; genuine app captures.
// The soundtrack is stream-copied from the approved film: no resynthesis or offset.
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {once} = require('node:events');
let cv;
try { cv=require('@napi-rs/canvas'); } catch(e) { cv=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas')); }
const {createCanvas,loadImage,GlobalFonts}=cv;
const {drawBackdrop,drawLaptop,drawPhone,drawGlassPanel}=require('./graphics.cjs');
const ROOT=path.resolve(__dirname,'../..');
const CAP=path.join(__dirname,'captures');
const argv=process.argv.slice(2);
const arg=(n,d)=>{const i=argv.indexOf(n);return i<0?d:argv[i+1];};
const WIDTH=+arg('--width','3840'), HEIGHT=WIDTH*9/16, FPS=60;
const OUT=path.resolve(arg('--output',path.join(ROOT,'media')));
const AUDIO=path.resolve(arg('--audio',path.join(ROOT,'media/app-portal-intro-sv.mp4')));
const framesArg=arg('--frames','');
const duration=+arg('--duration','70');
const offset=+arg('--offset','0');
const IM={}, THUMBS={};
const PM=JSON.parse(fs.readFileSync(path.join(CAP,'portal_capture_metadata.json'),'utf8'));
const canvas=createCanvas(WIDTH,HEIGHT),ctx=canvas.getContext('2d');
const screen=createCanvas(2880,1800),sc=screen.getContext('2d');
const phone=createCanvas(1170,2532),pc=phone.getContext('2d');
const K='#77d3d5',WHITE='#f0f7f8',MUTED='#9bb6bf';
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const smooth=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
const ramp=(t,a,b)=>smooth((t-a)/(b-a));
const lerp=(a,b,u)=>a+(b-a)*u;
const envelope=(t,a,b,d=.35)=>ramp(t,a-d/2,a+d/2)*(1-ramp(t,b-d/2,b+d/2));
function round(c,x,y,w,h,r=12){c.beginPath();c.roundRect(x,y,w,h,r);}
function text(c,s,x,y,size=40,color=WHITE,weight=400,align='left'){
  c.font=`${weight} ${size}px 'Open Sans'`;c.fillStyle=color;c.textAlign=align;c.textBaseline='alphabetic';c.fillText(s,x,y);
}
function tracked(c,s,x,y,size=21,gap=4,color=K){
  c.font=`600 ${size}px 'Open Sans'`;c.fillStyle=color;c.textAlign='left';
  for(const char of s){c.fillText(char,x,y);x+=c.measureText(char).width+gap;}
}
function lines(c,arr,x,y,size=62,color=WHITE,weight=600,gap=1.13){arr.forEach((s,i)=>text(c,s,x,y+i*size*gap,size,color,weight));}
function image(name){if(!IM[name])throw Error('Missing authentic source frame: '+name);return IM[name];}
function fit(c,im,x,y,w,h,cover=false){
  const ratio=cover?Math.max(w/im.width,h/im.height):Math.min(w/im.width,h/im.height);
  const iw=im.width*ratio,ih=im.height*ratio;c.drawImage(im,x+(w-iw)/2,y+(h-ih)/2,iw,ih);
}
function viewport(c,name,alpha=1,scroll=0){
  if(alpha<=0)return;const im=image(name);
  const normalize=['portal_process.png','portal_ergonomi.png','portal_production.png','portal_information.png','portal_search_full.png'].includes(name);
  if(normalize){const control=PM[name]?.controls_css_px?.search;scroll=Math.max(0,(control?.center_y||142.171875)-142.171875);}
  const sy=clamp(scroll*2,0,Math.max(0,im.height-1)),sh=Math.min(1800,im.height-sy);
  c.save();c.globalAlpha=alpha;
  if(normalize){c.fillStyle='#1a252c';c.fillRect(0,0,1440,900);}
  c.drawImage(im,0,sy,im.width,sh,0,0,1440,sh/2);c.restore();
}
function cursor(c,x,y,t,click=-100,alpha=1){
  if(alpha<=.001)return;c.save();c.globalAlpha*=alpha;
  const age=t-click;if(age>=0&&age<.65){c.strokeStyle=`rgba(111,237,228,${.9*(1-age/.65)})`;c.lineWidth=3;c.beginPath();c.arc(x,y,9+age*65,0,Math.PI*2);c.stroke();}
  c.translate(x,y);c.beginPath();c.moveTo(0,0);c.lineTo(0,25);c.lineTo(7,19);c.lineTo(12,29);c.lineTo(17,26);c.lineTo(12,17);c.lineTo(22,16);c.closePath();
  c.fillStyle='#f8ffff';c.strokeStyle='#0c2834';c.lineWidth=2;c.stroke();c.fill();c.restore();
}
function pointerPath(t,points){
  if(t<=points[0][0])return points[0].slice(1);
  for(let i=1;i<points.length;i++)if(t<points[i][0]){
    const u=ramp(t,points[i-1][0],points[i][0]);return [lerp(points[i-1][1],points[i][1],u),lerp(points[i-1][2],points[i][2],u)];
  }return points.at(-1).slice(1);
}
const STATES=[
  [0,'portal_full.png'],[8.85,'portal_process.png'],[10.36,'portal_ergonomi.png'],
  [11.20,'portal_production.png'],[12.58,'portal_information.png'],[13.77,'portal_process.png'],[15.0,'portal_search_full.png'],
  [18.10,'cycle_desktop.png'],[20.91,'cycle_results.png'],[22.78,'step_desktop.png'],
  [26.48,'frequency_results.png'],[29.87,'movement_desktop_full.png'],
  [31.00,'movement_route_01_full.png'],[31.49,'movement_route_02_full.png'],[31.98,'movement_route_03_full.png'],
  [32.47,'movement_route_04_full.png'],[32.96,'movement_route_05_full.png'],
  [38.35,'portal_desktop.png'],[46.33,'portal_desktop.png'],[48.29,'portal_en.png'],
  [48.97,'portal_de.png'],[49.81,'portal_desktop.png'],[50.40,'install_desktop.png'],
  [53.3,'portal_desktop.png']
];
function screenAt(t){
  sc.resetTransform();sc.clearRect(0,0,2880,1800);sc.scale(2,2);sc.fillStyle='#111e28';sc.fillRect(0,0,1440,900);
  let ix=0;for(let i=1;i<STATES.length;i++)if(t>=STATES[i][0])ix=i;
  const [at,name]=STATES[ix],prev=STATES[Math.max(0,ix-1)][1];
  const u=ix===0?1:ramp(t,at,at+.20);
  const scr=name==='portal_full.png'?lerp(0,425,ramp(t,5.5,8.65)):name.startsWith('movement_')?300:0;
  if(u<1)viewport(sc,prev,1,prev==='portal_full.png'?425:prev.startsWith('movement_')?300:0);
  viewport(sc,name,u,scr);
  // Interaction choreography uses the controls actually present in the capture.
  if(t>=14.0&&t<18.22){
    const [x,y]=pointerPath(t,[[14,1000,760],[14.65,1164,143],[15.5,1185,143],[16.5,726,413],[17.95,726,413]]);
    const a=envelope(t,14.0,18.12,.25);cursor(sc,x,y,t,t<16?14.7:17.95,a);
    if(t>14.6&&t<15.8){sc.save();sc.globalAlpha=.6*envelope(t,14.6,15.8,.25);sc.strokeStyle=K;sc.lineWidth=3;round(sc,1006,121,360,43,10);sc.stroke();sc.restore();}
  }
  if(t>=47.35&&t<49.8){
    const p=pointerPath(t,[[47.35,800,120],[47.7,935,40],[48.25,935,40],[48.48,1035,40],[48.9,1035,40],[49.16,1135,40]]);
    cursor(sc,...p,t,t<48.4?47.74:t<49.1?48.5:49.18,envelope(t,47.35,49.7,.2));
  }
  if(t>=49.9&&t<50.7){const p=pointerPath(t,[[49.9,1110,140],[50.35,1283,40]]);cursor(sc,...p,t,50.4,envelope(t,49.9,50.7,.2));}
  return screen;
}
function phoneAt(t){
  pc.resetTransform();pc.clearRect(0,0,1170,2532);pc.scale(3,3);
  const im=image('portal_mobile_full.png');
  const scroll=lerp(0,480,ramp(t,56.3,62.0));
  pc.drawImage(im,0,scroll*3,1170,2532,0,0,390,844);
  const a=envelope(t,51.0,53.1,.4);
  if(a>0){pc.globalAlpha=a;pc.drawImage(image('install_mobile.png'),0,0,390,844);pc.globalAlpha=1;}
  return phone;
}
function drawLogo(t){
  const initial=1-ramp(t,2.8,3.5),header=ramp(t,3.0,3.7)*(1-ramp(t,55.0,55.8));
  const appear=ramp(t,0,.75);
  if(initial>0){ctx.save();ctx.globalAlpha=initial*appear;const w=870+30*(1-appear),h=w*24/181;
    ctx.drawImage(IM.logo,960-w/2,405+18*(1-appear),w,h);
    text(ctx,'APP PORTAL',960,612,52,WHITE,300,'center');
    text(ctx,'TIDAHOLM',960,667,23,K,600,'center');ctx.restore();}
  if(header>0){ctx.save();ctx.globalAlpha=header;ctx.drawImage(IM.logo,90,58,226,226*24/181);
    tracked(ctx,'TIDAHOLM',350,81,16,3,MUTED);ctx.restore();}
}
const EDITORIAL=[
  [3.38,8.9,'DIGITALA VERKTYG',['Från analys','till förbättring.'],'Allt på ett ställe.'],
  [8.9,13.8,'APPBIBLIOTEK',['Hitta rätt','verktyg.'],'Välj ditt arbetsområde.'],
  [13.8,18.1,'ENKEL ÅTKOMST',['Sök. Öppna.','Kom igång.'],'Direkt från appkortet.'],
  [18.1,22.8,'PROCESSANALYS',['Twenty','Cycle Check'],'Mät cykler. Se variationen.'],
  [22.8,26.5,'PROCESSANALYS',['Moment','& tider'],'Se tiden i varje arbetsmoment.'],
  [26.5,29.9,'PROCESSANALYS',['Frekvens-','analys'],'Så fördelas arbetstiden.'],
  [29.9,33.65,'PROCESSANALYS',['Rörelser','& gångvägar'],'Gör förflyttningarna synliga.'],
  [46.35,49.84,'SPRÅK',['Samma verktyg.','Tre språk.'],''],
  [49.84,55.48,'ALLTID NÄRA',['På datorn.','I mobilen.'],'Installera från portalen.']
];
function editorial(t){
  for(const [a,b,kicker,title,sub] of EDITORIAL){const op=envelope(t,a,b,.40);if(op<.001)continue;
    ctx.save();ctx.globalAlpha=op;const lift=lerp(18,0,ramp(t,a-.2,a+.4));
    tracked(ctx,kicker,96,297+lift,18,3.3);
    lines(ctx,title,90,385+lift,60,WHITE,600,1.15);
    if(sub)text(ctx,sub,96,550+lift,25,MUTED,400);
    if(a===3.38){
      const names=['Förstå','Utveckla','Förbättra'],times=[5.72,6.52,7.32];
      names.forEach((s,i)=>{const q=ramp(t,times[i]-.16,times[i]+.1);ctx.globalAlpha=op*q;
        ctx.fillStyle=K;ctx.beginPath();ctx.arc(103,635+i*48,3.3,0,Math.PI*2);ctx.fill();text(ctx,s,124,643+i*48,25,WHITE);});
    }
    if(a===8.9){
      const labs=['Processanalys','Ergonomi','Produktionsstöd','Information'],starts=[9.4,10.58,11.42,12.8];
      labs.forEach((s,i)=>{const active=envelope(t,starts[i]-.08,i===3?13.8:starts[i+1]-.08,.23);
        const y=608+i*58;ctx.fillStyle=`rgba(103,210,211,${.04+.11*active})`;round(ctx,95,y-30,360,48,12);ctx.fill();
        text(ctx,s,112,y,25,active>.3?WHITE:MUTED,active>.3?600:400);ctx.fillStyle=K;ctx.globalAlpha=op*active;ctx.fillRect(96,y-14,3,17);ctx.globalAlpha=op;});
    }
    if(a===46.35){
      ['Svenska','English','Deutsch'].forEach((s,i)=>{const times=[47.74,48.5,49.18],q=envelope(t,times[i]-.1,i===2?49.84:times[i+1]-.1,.18);
        text(ctx,s,98,630+i*56,32,q>.3?WHITE:MUTED,q>.3?600:300);ctx.globalAlpha=op*q;ctx.fillStyle=K;ctx.fillRect(96,642+i*56,130+i*10,2);ctx.globalAlpha=op;});
    }
    if(a===49.84){
      ctx.fillStyle='rgba(110,213,215,.12)';round(ctx,96,606,268,57,16);ctx.fill();text(ctx,'Installera app',121,644,27,WHITE,600);
      const q=envelope(t,50.62,51.9,.3);ctx.globalAlpha=op*q;ctx.strokeStyle=K;ctx.lineWidth=1.4;round(ctx,96,606,268,57,16);ctx.stroke();
    }
    ctx.restore();
  }
}
function demoBadge(t){const a=envelope(t,18.15,38.22,.3);if(a<.001)return;
 ctx.save();ctx.globalAlpha=a*.8;tracked(ctx,'EXEMPELDATA',96,997,14,2,MUTED);ctx.restore();}
function thumb(name,kind='normal'){
  const key=name+kind;if(THUMBS[key])return THUMBS[key];const c=createCanvas(1440,900),x=c.getContext('2d');x.fillStyle='#10232d';x.fillRect(0,0,1440,900);
  const im=image(name);fit(x,im,0,0,1440,900,false);THUMBS[key]=c;return c;
}
function kimMontage(t){
  if(t>=37.98&&t<38.90)return;
  const op=envelope(t,33.65,38.32,.6);if(op<.001)return;ctx.save();ctx.globalAlpha=op;
  tracked(ctx,'ERGONOMI',96,172,20,3.5);text(ctx,'Bedöm belastningen. Hitta förbättringarna.',90,255,59,WHITE,600);
  const cards=[['KIM 1','Lyft & bärande','kim1_posture.png',34.36],['KIM 2','Skjuta & dra','kim2_equipment.png',34.82],['KIM 3','Repetitivt arbete','kim3_posture.png',35.32]];
  cards.forEach(([name,label,asset,start],i)=>{
    const emphasis=ramp(t,start-.14,start+.12), x=370+i*590, y=550+Math.sin(t*.28+i)*4;
    const arrive=ramp(t,33.4+i*.08,34.05+i*.08);const w=505+12*emphasis;
    drawGlassPanel(ctx,thumb(asset),{x,y:y+35*(1-arrive),w,h:w*.625,yaw:(i-1)*-.09,roll:Math.sin(t*.13+i)*.009,opacity:arrive*(.72+.28*emphasis)});
    text(ctx,name,x,785,42,emphasis>.5?WHITE:MUTED,600,'center');text(ctx,label,x,835,26,MUTED,400,'center');
    ctx.globalAlpha=op*emphasis;ctx.fillStyle=K;round(ctx,x-55,866,110,3,1.5);ctx.fill();ctx.globalAlpha=op;
  });ctx.restore();
}
function otherMontage(t){
  if(t>=37.98&&t<38.90)return;
  const op=envelope(t,38.32,46.35,.6);if(op<.001)return;ctx.save();ctx.globalAlpha=op;
  tracked(ctx,'FLER VERKTYG',96,145,20,3.5);text(ctx,'Samma portal. Fler möjligheter.',90,215,57,WHITE,600);
  const cards=[['Resursplanering','resources_desktop.png',39.64],['Kalibrering','calibration_desktop.png',40.78],['Personalhandbok','handbook_desktop.png',41.72],['RTM 3.0','portal_rtm_card.png',43.06],['Marknad & bransch','market_desktop.png',43.98],['Lunchkollen','lunch_desktop.png',45.36]];
  cards.forEach(([title,asset,start],i)=>{
    const row=Math.floor(i/3),col=i%3,x=380+col*580,y=420+row*400;
    const enter=ramp(t,38.03+i*.035,38.65+i*.035);const active=envelope(t,start-.14,i===5?46.35:cards[i+1][2]-.14,.24);
    const seen=ramp(t,start-.14,start+.1);const w=465+12*active;
    drawGlassPanel(ctx,thumb(asset),{x,y:y+20*(1-enter)-4*active+Math.sin(t*.17+i)*2,w,h:w*.625,yaw:(col-1)*-.055,roll:Math.sin(t*.11+i)*.004,opacity:enter*(.58+.25*seen+.17*active)});
    text(ctx,title,x,y+186,30,active>.15?WHITE:MUTED,active>.15?600:400,'center');
    ctx.globalAlpha=op*active;ctx.strokeStyle=K;ctx.lineWidth=2;round(ctx,x-w/2-13,y-w*.3125-13,w+26,w*.625+26,15);ctx.stroke();ctx.globalAlpha=op;
  });ctx.restore();
}
const montageBlends=[0,1,2].map(()=>createCanvas(1440,900));
function montageChange(t){
  if(t<37.98||t>=38.90)return;
  const move=ramp(t,37.98,38.90),blend=ramp(t,38.13,38.63);
  const oldText=1-ramp(t,38.00,38.26),newText=ramp(t,38.40,38.72);
  ctx.save();ctx.globalAlpha=oldText;
  tracked(ctx,'ERGONOMI',96,172,20,3.5);text(ctx,'Bedöm belastningen. Hitta förbättringarna.',90,255,59,WHITE,600);
  ctx.globalAlpha=newText;tracked(ctx,'FLER VERKTYG',96,145,20,3.5);text(ctx,'Samma portal. Fler möjligheter.',90,215,57,WHITE,600);
  const from=[['KIM 1','Lyft & bärande','kim1_posture.png'],['KIM 2','Skjuta & dra','kim2_equipment.png'],['KIM 3','Repetitivt arbete','kim3_posture.png']];
  const to=[['Resursplanering','resources_desktop.png'],['Kalibrering','calibration_desktop.png'],['Personalhandbok','handbook_desktop.png'],['RTM 3.0','portal_rtm_card.png'],['Marknad & bransch','market_desktop.png'],['Lunchkollen','lunch_desktop.png']];
  // The same three panels move into the new grid; only their content dissolves.
  // Headlines fade sequentially, so different lines never cross one another.
  for(let i=0;i<3;i++){
    const c=montageBlends[i],b=c.getContext('2d');b.globalAlpha=1;b.drawImage(thumb(from[i][2]),0,0);b.globalAlpha=blend;b.drawImage(thumb(to[i][1]),0,0);b.globalAlpha=1;
    const x=lerp(370+i*590,380+i*580,move),y=lerp(550+Math.sin(t*.28+i)*4,420+Math.sin(t*.17+i)*2,move),w=lerp(517,465,move);
    ctx.globalAlpha=1;drawGlassPanel(ctx,c,{x,y,w,h:w*.625,yaw:lerp((i-1)*-.09,(i-1)*-.055,move),roll:lerp(Math.sin(t*.13+i)*.009,Math.sin(t*.11+i)*.004,move),opacity:lerp(1,.58,move)});
    const labelY=lerp(785,606,move);ctx.globalAlpha=oldText;
    text(ctx,from[i][0],x,labelY,42,WHITE,600,'center');text(ctx,from[i][1],x,lerp(835,650,move),26,MUTED,400,'center');
    ctx.fillStyle=K;round(ctx,x-55,lerp(866,676,move),110,3,1.5);ctx.fill();
    ctx.globalAlpha=newText;text(ctx,to[i][0],x,labelY,30,MUTED,400,'center');
  }
  for(let i=3;i<6;i++){
    const col=i-3,x=380+col*580,enter=ramp(t,38.20+(i-3)*.035,38.84),y=lerp(980,820,enter),w=465;
    ctx.globalAlpha=1;drawGlassPanel(ctx,thumb(to[i][1]),{x,y:y+Math.sin(t*.17+i)*2,w,h:w*.625,yaw:(col-1)*-.055,roll:Math.sin(t*.11+i)*.004,opacity:.58*enter});
    ctx.globalAlpha=enter;text(ctx,to[i][0],x,y+186,30,MUTED,400,'center');
  }
  ctx.restore();
}
function devicePose(t){
  const intro=ramp(t,2.9,4.3), process=envelope(t,17.9,33.6,1.1), exit=ramp(t,55.1,56.7);
  const install=ramp(t,50.9,54.3);
  const w=lerp(995,865,install)+30*process;
  return {x:lerp(1250,1100,exit)+Math.sin(t*.16)*7,
    y:lerp(505,655,exit)+Math.cos(t*.19)*5+100*(1-intro),
    w:lerp(lerp(w*.88,w,intro),760,exit),yaw:lerp(-.19,.10,ramp(t,3,18))+Math.sin(t*.12)*.035,
    pitch:.04+Math.sin(t*.09)*.025,roll:lerp(-.018,.013,ramp(t,3,33))+Math.sin(t*.11)*.003,
    opacity:intro*(1-envelopesMontage(t))};
}
function envelopesMontage(t){return clamp(envelope(t,33.65,38.32,.6)+envelope(t,38.32,46.35,.6));}
function outro(t){
  const op=ramp(t,55.25,56.3);if(op<.001)return;ctx.save();ctx.globalAlpha=op;
  const w=560;ctx.drawImage(IM.logo,960-w/2,112,w,w*24/181);
  text(ctx,'APP PORTAL · TIDAHOLM',960,250,29,K,400,'center');
  const q=ramp(t,57.34,57.85);ctx.globalAlpha=op*q;text(ctx,'Från analys till förbättring.',960,325,48,WHITE,600,'center');
  const q2=ramp(t,59.5,60.03);ctx.globalAlpha=op*q2;text(ctx,'Allt på ett ställe.',960,383,38,K,300,'center');
  ctx.globalAlpha=op*ramp(t,61,62.3);lines(ctx,['Öppna portalen.','Kom igång.'],96,685,36,WHITE,400,1.3);
  text(ctx,'Dometic Tidaholm',96,800,23,MUTED,400);ctx.restore();
}
function drawFrame(t){
 ctx.resetTransform();ctx.clearRect(0,0,WIDTH,HEIGHT);ctx.scale(WIDTH/1920,HEIGHT/1080);drawBackdrop(ctx,t);
 // A restrained, continuously moving data ribbon echoes the first film's depth.
 ctx.save();ctx.globalAlpha=.09*(1-ramp(t,55,58));ctx.strokeStyle='#8cdee0';ctx.lineWidth=1;
 for(let i=0;i<3;i++){ctx.beginPath();for(let x=0;x<=1920;x+=15){const y=957+i*27+Math.sin(x*.006+t*.18+i)*12; x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}ctx.restore();
 const pose=devicePose(t);if(pose.opacity>.001){drawLaptop(ctx,screenAt(t),pose);}
 const ph=ramp(t,52.1,53.5);if(ph>.001){const end=ramp(t,55,57);drawPhone(ctx,phoneAt(t),{x:lerp(1680,1570,end)+Math.sin(t*.15)*3,y:lerp(610,710,end)+90*(1-ph),w:lerp(276,225,end),yaw:lerp(.23,-.04,ph),pitch:.02,roll:-.035+Math.sin(t*.13)*.004,opacity:ph});}
 drawLogo(t);editorial(t);kimMontage(t);otherMontage(t);montageChange(t);demoBadge(t);outro(t);
 // Last 0.8 seconds fades cleanly with the pre-existing soundtrack's tail.
 const ending=ramp(t,69.1,70);if(ending>0){ctx.fillStyle=`rgba(2,8,13,${ending})`;ctx.fillRect(0,0,1920,1080);}
 return canvas;
}
async function main(){
 fs.mkdirSync(OUT,{recursive:true});
 const candidates=[path.join(__dirname,'fonts'),'/usr/share/fonts/truetype/open-sans',path.resolve(ROOT,'../work/fonts')];
 let registered=false;
 for(const d of candidates){if(!fs.existsSync(path.join(d,'OpenSans-Regular.ttf')))continue;
   for(const f of ['OpenSans-Regular.ttf','OpenSans-Semibold.ttf','OpenSans-Light.ttf'])GlobalFonts.registerFromPath(path.join(d,f),'Open Sans');registered=true;break;}
 if(!registered)throw Error('Open Sans font files missing');
 for(const f of fs.readdirSync(CAP).filter(f=>f.endsWith('.png')&&!f.includes('contact')&&!f.includes('card_')&&!f.includes('forms')&&!f.includes('calibration_full')&&!f.includes('market_full')&&!f.includes('lunch_full'))){
   if(/kim[123]_full|frequency_results_full|cycle_results_full|step_results_full|handbook_full|movement_route_full/.test(f))continue;
   IM[f]=await loadImage(path.join(CAP,f));
 }
 // Source SVG's geometry and fills are passed directly to the rasterizer.
 const logoSVG=fs.readFileSync(path.join(ROOT,'apps/market-intelligence/dometic-logo.svg'),'utf8');
 IM.logo=await loadImage(Buffer.from(logoSVG.replace('<svg ','<svg width="2172" height="288" ')));
 if(framesArg){
   for(const t of framesArg.split(',').map(Number)){drawFrame(t);const f=path.join(OUT,`frame-${t.toFixed(2).replace('.','-')}.png`);await fs.promises.writeFile(f,canvas.toBuffer('image/png'));console.log('FRAME',t,f);}
   return;
 }
 const master=path.join(OUT,'Dometic-App-Portal-4K-60fps.mp4');
 const web=path.join(OUT,'app-portal-intro-sv-smooth-60fps.mp4');
 const args=['-hide_banner','-loglevel','warning','-y','-f','rawvideo','-pixel_format','rgba','-video_size',`${WIDTH}x${HEIGHT}`,'-framerate',String(FPS),'-i','pipe:0','-i',AUDIO,
 '-filter_complex',`[0:v]format=yuv420p,split=2[master][src];[src]scale=1920:1080:flags=lanczos[web]`,
 '-map','[master]','-map','1:a:0','-c:v','libx264','-preset','veryfast','-crf','18','-maxrate','10M','-bufsize','20M','-threads','4','-r','60','-fps_mode','cfr','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-c:a','copy','-t',String(duration),'-movflags','+faststart',master,
 '-map','[web]','-map','1:a:0','-c:v','libx264','-preset','veryfast','-crf','18','-maxrate','5M','-bufsize','10M','-threads','3','-r','60','-fps_mode','cfr','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-c:a','copy','-t',String(duration),'-movflags','+faststart',web];
 const ff=spawn('ffmpeg',args,{stdio:['pipe','inherit','inherit']});let failed=false;
 ff.on('error',e=>{failed=true;console.error(e);});ff.stdin.on('error',()=>{failed=true;});
 const n=Math.round(duration*FPS),start=Date.now();
 for(let i=0;i<n;i++){
   if(failed)throw Error('Encoder stopped');drawFrame(offset+i/FPS);
   if(!ff.stdin.write(canvas.data()))await once(ff.stdin,'drain');
   if(i%120===0)console.log(JSON.stringify({frame:i,total:n,seconds:i/FPS,elapsed:Math.round((Date.now()-start)/1000)}));
 }
 ff.stdin.end();const [code]=await once(ff,'close');if(code!==0)throw Error('FFmpeg exit '+code);
 console.log('DONE',master,web);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
