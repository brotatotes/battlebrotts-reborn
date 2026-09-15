import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,startBattle,step,command,WIDTH,HEIGHT} from '../src/sim.js';
import {layoutLabels} from '../src/labels.js';
import {viewportSize} from '../src/view.js';
test('automatic corner escape stays subordinate to keyboard and persistent marker',()=>{
 for(const [x,y] of [[36,36],[924,36],[36,564],[924,564]]) {
  const s=createRun();startBattle(s);Object.assign(s.player,{x,y,prevX:x,prevY:y});
  Object.assign(s.enemies[0],{x:480,y:300});step(s);
  assert.ok(Math.min(s.player.x,WIDTH-s.player.x,s.player.y,HEIGHT-s.player.y)>36);
  command(s,'move',{x:500,y:500});command(s,'keys',{x:x<480?-1:1,y:0});
  const before=s.player.x;step(s);assert.ok(x<480?s.player.x<before:s.player.x>before);assert.ok(s.waypoint);
 }
});
test('crowded corner label plates do not overlap or leave either viewport',()=>{
 for(const portrait of [false,true])for(const [x,y] of [[36,36],[924,36],[36,564],[924,564]]) {
  const s=createRun();s.encounter=2;startBattle(s);
  const bots=[s.player,...s.enemies];bots.forEach((b,i)=>Object.assign(b,{x:x+(x<480?1:-1)*i*24,y,prevX:x+(x<480?1:-1)*i*24,prevY:y}));
  const plates=layoutLabels(bots,portrait,portrait?0.58:1),size=viewportSize(portrait);
  for(const [i,p] of plates.entries()) {
   assert.ok(p.x>=0&&p.x+p.width<=size.width&&p.y>=0&&p.y+p.height<=size.height);
   for(const q of plates.slice(i+1))assert.ok(p.x+p.width<=q.x||q.x+q.width<=p.x||p.y+p.height<=q.y||q.y+q.height<=p.y);
  }
 }
});
