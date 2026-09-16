import {worldToView,viewportSize} from './view.js';
import {clamp} from './sim.js';

// Lay out readable screen-aligned hull/name plates independently of body rotation.
// The leader line preserves ownership when nearby plates need to move apart.
export function layoutLabels(bots,portrait,cssScale,alpha=1) {
  const size=viewportSize(portrait),font=Math.max(12,12/cssScale),gap=6/cssScale;
  const placed=[];
  for(const bot of bots.filter(b=>b.hp>0)) {
    const point=worldToView({x:bot.prevX+(bot.x-bot.prevX)*alpha,y:bot.prevY+(bot.y-bot.prevY)*alpha},portrait);
    const text=bot.kind==='chief'&&bot.windup>0?'MOVE!':bot.name;
    const width=Math.max(44/cssScale,text.length*font*0.68+12),height=font+20;
    const candidates=[];
    for(let ring=0;ring<6;ring++) {
      const offset=bot.radius+18+ring*(height+gap);
      for(const [dx,dy] of [[0,offset], [0,-offset-height], [offset, -height/2],[-offset-width,-height/2]]) {
        const x=clamp(point.x+dx-(dx===0?width/2:0),8,size.width-width-8);
        const y=clamp(point.y+dy,8,size.height-height-8);
        const overlaps=placed.some(p=>x<p.x+p.width+gap&&x+width+gap>p.x&&y<p.y+p.height+gap&&y+height+gap>p.y);
        candidates.push({id:bot.id,x,y,width,height,font,text,point,overlaps});
      }
    }
    const choice=candidates.find(c=>!c.overlaps)||candidates[0];
    placed.push({...choice,bot});
  }
  return placed;
}
