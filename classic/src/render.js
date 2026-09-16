import {WIDTH, HEIGHT, muzzleLength} from './sim.js';
import {setWorldTransform,viewportSize} from './view.js';
import {layoutLabels} from './labels.js';
const ink='#213d39', cream='#faf0d7', teal='#4bada4', coral='#db7763';
function rounded(ctx,x,y,w,h,r,fill,stroke=ink) {ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.stroke();}}
export function render(canvas,s,alpha=1,portrait=false,reducedMotion=false) {
  const ctx=canvas.getContext('2d'),cssScale=(canvas.clientWidth||canvas.width)/viewportSize(portrait).width;
  setWorldTransform(ctx,canvas.width,portrait);ctx.clearRect(0,0,WIDTH,HEIGHT);
  ctx.fillStyle='#e4e8d6';ctx.fillRect(0,0,WIDTH,HEIGHT);
  ctx.strokeStyle='#cdd6c3';ctx.lineWidth=1;
  for(let x=0;x<WIDTH;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,HEIGHT);ctx.stroke();}
  for(let y=0;y<HEIGHT;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WIDTH,y);ctx.stroke();}
  rounded(ctx,12,12,WIDTH-24,HEIGHT-24,34,'#e9ecdccc');
  ctx.setLineDash([7,13]);ctx.strokeStyle='#bbcbbb';ctx.strokeRect(50,50,WIDTH-100,HEIGHT-100);ctx.setLineDash([]);
  ctx.save();const view=viewportSize(portrait),scale=canvas.width/view.width;ctx.setTransform(scale,0,0,scale,0,0);
  ctx.fillStyle='#b6c4af';ctx.font='bold 13px system-ui';ctx.textAlign='left';ctx.fillText('SUNROOM  /  TRAINING FLOOR',50,65);
  ctx.textAlign='right';ctx.fillText('KEEP YOUR WHEELS TURNING',view.width-50,view.height-45);ctx.restore();
  if(s.waypoint){const w=s.waypoint;ctx.strokeStyle=teal;ctx.lineWidth=3;ctx.beginPath();ctx.arc(w.x,w.y,14,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(w.x-22,w.y);ctx.lineTo(w.x+22,w.y);ctx.moveTo(w.x,w.y-22);ctx.lineTo(w.x,w.y+22);ctx.stroke();ctx.setLineDash([5,8]);ctx.beginPath();ctx.moveTo(s.player.x,s.player.y);ctx.lineTo(w.x,w.y);ctx.stroke();ctx.setLineDash([]);}
  const bots=[s.player,...s.enemies];
  for(const b of bots){
    if(b.hp<=0) continue;
    const x=b.prevX+(b.x-b.prevX)*alpha,y=b.prevY+(b.y-b.prevY)*alpha,r=b.radius;
    const selected=b.id===s.targetId;
    if(selected){ctx.strokeStyle=coral;ctx.lineWidth=3;ctx.setLineDash([12,6]);ctx.beginPath();ctx.arc(x,y,r+19,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
    if(b.kind==='chief' && (b.windup>0 || b.burstLeft>0)) {
      ctx.save();ctx.translate(x,y);ctx.rotate(b.angle);
      ctx.fillStyle='#bc493119';ctx.fillRect(0,-b.radius,Math.max(WIDTH,HEIGHT),b.radius*2);
      ctx.strokeStyle='#a8412d';ctx.lineWidth=3;ctx.setLineDash([12,8]);
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.max(WIDTH,HEIGHT),0);ctx.stroke();ctx.restore();
    }
    // A visible wind-up follows the actual simulation aim, not a separate facing rule.
    if(b.cooldown<0.6){ctx.strokeStyle=b.team?'#c7655366':'#338b8466';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(b.angle)*Math.min(160,b.range),y+Math.sin(b.angle)*Math.min(160,b.range));ctx.stroke();}
    ctx.save();ctx.translate(x,y);
    ctx.fillStyle='#294a3925';ctx.beginPath();ctx.ellipse(0,14,r+13,r*0.65,0,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.rotate(b.bodyAngle+Math.PI/2);
    rounded(ctx,-r-7,-r+5,13,r*2-4,6,'#45605a');rounded(ctx,r-6,-r+5,13,r*2-4,6,'#45605a');
    const body=b.flash>0&&!reducedMotion?'#ffffff':b.team?'#e9b5a0':cream;
    rounded(ctx,-r,-r,r*2,r*2, b.kind==='skitter'?10:18,body);
    rounded(ctx,-r+5,-r+8,r*2-10,r*0.85,7,b.team?'#713f37':'#245d59');
    ctx.fillStyle=b.team?'#ffe3a3':'#a8f1d7';
    ctx.fillRect(-r*0.42,-r*0.38,5,7);ctx.fillRect(r*0.27,-r*0.38,5,7);
    ctx.strokeStyle=ink;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(5,-r-12);ctx.stroke();
    ctx.fillStyle=b.team?coral:teal;ctx.beginPath();ctx.arc(5,-r-13,4,0,Math.PI*2);ctx.fill();
    if(b.kind==='chief'){rounded(ctx,-15,-r-8,30,8,2,'#d5b348');}
    ctx.restore();
    ctx.save();ctx.rotate(b.angle);const length=muzzleLength(b);
    rounded(ctx,0,-6,length-3,12,4,b.team?coral:teal);rounded(ctx,length-9,-9,9,18,3,'#c9d3bf');ctx.restore();
    ctx.restore();
  }
  for(const b of s.bullets){ctx.strokeStyle=b.team?coral:'#2c8b83';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(b.x-b.vx*0.025,b.y-b.vy*0.025);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.fillStyle=cream;ctx.beginPath();ctx.arc(b.x,b.y,2,0,Math.PI*2);ctx.fill();}
  ctx.save();ctx.setTransform(scale,0,0,scale,0,0);
  for(const plate of layoutLabels(bots,portrait,cssScale,alpha)) {
    const {x,y,width,height,font,text,point,bot}=plate;
    ctx.strokeStyle='#61766d';ctx.lineWidth=1/cssScale;
    ctx.beginPath();ctx.moveTo(point.x,point.y);ctx.lineTo(x+width/2,y+height/2);ctx.stroke();
    rounded(ctx,x,y,width,height,5,'#faf0d7ef',null);
    rounded(ctx,x+4,y+3,width-8,6,2,'#bdc8b7',null);
    rounded(ctx,x+4,y+3,(width-8)*bot.hp/bot.maxHp,6,2,bot.team?coral:teal,null);
    ctx.font=`600 ${font}px system-ui`;ctx.textAlign='center';ctx.fillStyle=ink;
    ctx.fillText(text,x+width/2,y+height-4);
  }
  ctx.restore();
  if(!reducedMotion)for(const e of s.effects){ctx.strokeStyle=e.death?'#d4a244':'#fff5d5';ctx.lineWidth=4;ctx.beginPath();ctx.arc(e.x,e.y,(0.3-e.life)*80+5,0,Math.PI*2);ctx.stroke();}
}
