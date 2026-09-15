import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,startBattle,step,WIDTH,HEIGHT,distance} from '../src/sim.js';

function crowded(corner) {
  const s=createRun();s.encounter=3;startBattle(s);
  for(let i=2;i<5;i++)s.enemies.push({...s.enemies[i%2],id:`crowd-${i}`});
  for(const b of [s.player,...s.enemies]) {
    b.x=corner.x?WIDTH-b.radius-12:b.radius+12;
    b.y=corner.y?HEIGHT-b.radius-12:b.radius+12;
    b.speed=0;b.damage=0;
  }
  return s;
}
function worstOverlap(s) {
  const bots=[s.player,...s.enemies];let worst=0;
  for(let i=0;i<bots.length;i++)for(let j=i+1;j<bots.length;j++)worst=Math.max(worst,bots[i].radius+bots[j].radius+3-distance(bots[i],bots[j]));
  return worst;
}
test('six heterogeneous bodies resolve all corner contacts before position commit',()=>{
  for(const corner of [{x:0,y:0},{x:0,y:1},{x:1,y:0},{x:1,y:1}]) {
    const s=crowded(corner);step(s);
    assert.ok(worstOverlap(s)<0.1,`${JSON.stringify(corner)} overlap ${worstOverlap(s)}`);
    const positions=[s.player,...s.enemies].map(b=>({x:b.x,y:b.y}));
    for(let i=0;i<120;i++)step(s);
    assert.ok(worstOverlap(s)<0.1);
    for(const [i,b] of [s.player,...s.enemies].entries()) {
      assert.ok(b.x>=b.radius+12&&b.x<=WIDTH-b.radius-12);
      assert.ok(b.y>=b.radius+12&&b.y<=HEIGHT-b.radius-12);
      assert.ok(distance(b,positions[i])<0.1,'settled contacts must not oscillate');
    }
  }
});
