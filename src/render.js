import {WIDTH, HEIGHT} from './sim.js';
const ink='#213d39', cream='#faf0d7', teal='#4bada4', coral='#db7763';
function rounded(ctx,x,y,w,h,r,fill,stroke=ink) {ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.stroke();}}
export function render(canvas,s,alpha=1) {
  const ctx=canvas.getContext('2d'), scale=canvas.width/WIDTH;
  ctx.setTransform(scale,0,0,scale,0,0); ctx.clearRect(0,0,WIDTH,HEIGHT);
  ctx.fillStyle='#e4e8d6';ctx.fillRect(0,0,WIDTH,HEIGHT);
  ctx.strokeStyle='#cdd6c3';ctx.lineWidth=1;
  for(let x=0;x<WIDTH;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,HEIGHT);ctx.stroke();}
  for(let y=0;y<HEIGHT;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WIDTH,y);ctx.stroke();}
  rounded(ctx,12,12,WIDTH-24,HEIGHT-24,34,'#e9ecdccc');
  ctx.setLineDash([7,13]);ctx.strokeStyle='#bbcbbb';ctx.strokeRect(50,50,WIDTH-100,HEIGHT-100);ctx.setLineDash([]);
  ctx.fillStyle='#b6c4af';ctx.font='bold 13px system-ui';ctx.textAlign='left';ctx.fillText('SUNROOM  /  TRAINING FLOOR',70,80);
  ctx.textAlign='right';ctx.fillText('KEEP YOUR WHEELS TURNING',WIDTH-70,HEIGHT-65);
  if(s.waypoint){const w=s.waypoint;ctx.strokeStyle=teal;ctx.lineWidth=3;ctx.beginPath();ctx.arc(w.x,w.y,14,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(w.x-22,w.y);ctx.lineTo(w.x+22,w.y);ctx.moveTo(w.x,w.y-22);ctx.lineTo(w.x,w.y+22);ctx.stroke();ctx.setLineDash([5,8]);ctx.beginPath();ctx.moveTo(s.player.x,s.player.y);ctx.lineTo(w.x,w.y);ctx.stroke();ctx.setLineDash([]);}
  const bots=[s.player,...s.enemies];
  for(const b of bots){
    if(b.hp<=0) continue;
    const x=b.prevX+(b.x-b.prevX)*alpha,y=b.prevY+(b.y-b.prevY)*alpha,r=b.radius;
    const selected=b.id===s.targetId;
    if(selected){ctx.strokeStyle=coral;ctx.lineWidth=3;ctx.setLineDash([12,6]);ctx.beginPath();ctx.arc(x,y,r+19,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
    // A visible wind-up follows the actual simulation aim, not a separate facing rule.
    if(b.cooldown<0.6){ctx.strokeStyle=b.team?'#c7655366':'#338b8466';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(b.angle)*Math.min(160,b.range),y+Math.sin(b.angle)*Math.min(160,b.range));ctx.stroke();}
    ctx.save();ctx.translate(x,y);
    ctx.fillStyle='#294a3925';ctx.beginPath();ctx.ellipse(0,14,r+13,r*0.65,0,0,Math.PI*2);ctx.fill();
    rounded(ctx,-r-7,-r+5,13,r*2-4,6,'#45605a');rounded(ctx,r-6,-r+5,13,r*2-4,6,'#45605a');
    const body=b.flash>0?'#ffffff':b.team?'#e9b5a0':cream;
    rounded(ctx,-r,-r,r*2,r*2, b.kind==='skitter'?10:18,body);
    rounded(ctx,-r+5,-r+8,r*2-10,r*0.85,7,b.team?'#713f37':'#245d59');
    ctx.fillStyle=b.team?'#ffe3a3':'#a8f1d7';
    ctx.fillRect(-r*0.42,-r*0.38,5,7);ctx.fillRect(r*0.27,-r*0.38,5,7);
    ctx.strokeStyle=ink;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(5,-r-12);ctx.stroke();
    ctx.fillStyle=b.team?coral:teal;ctx.beginPath();ctx.arc(5,-r-13,4,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.rotate(b.angle);const length=b.gear==='barrel'?43:b.gear==='coil'?23:30;
    rounded(ctx,4,4,length,11,4,b.team?coral:teal);rounded(ctx,length-3,1,9,17,3,'#c9d3bf');ctx.restore();
    if(b.kind==='chief'){rounded(ctx,-15,-r-8,30,8,2,'#d5b348');}
    rounded(ctx,-r-6,r+16,r*2+12,7,3,'#bdc8b7',null);rounded(ctx,-r-6,r+16,(r*2+12)*b.hp/b.maxHp,7,3,b.team?coral:teal,null);
    ctx.fillStyle=ink;ctx.font='600 12px system-ui';ctx.textAlign='center';ctx.fillText(b.name,0,r+39);ctx.restore();
  }
  for(const b of s.bullets){ctx.strokeStyle=b.team?coral:'#2c8b83';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(b.x-b.vx*0.025,b.y-b.vy*0.025);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.fillStyle=cream;ctx.beginPath();ctx.arc(b.x,b.y,2,0,Math.PI*2);ctx.fill();}
  for(const e of s.effects){ctx.strokeStyle=e.death?'#d4a244':'#fff5d5';ctx.lineWidth=4;ctx.beginPath();ctx.arc(e.x,e.y,(0.3-e.life)*80+5,0,Math.PI*2);ctx.stroke();}
}
