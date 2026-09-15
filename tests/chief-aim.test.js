import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,startBattle,step,command,angleDelta} from '../src/sim.js';

test('Chief predicts observed movement before warning, never retargets afterwards',()=>{
  const s=createRun();s.encounter=4;startBattle(s);
  // Start within warning range so the observed moving player has not already
  // reached the south wall before the Chief can acquire it.
  Object.assign(s.player,{x:450,y:200,prevX:450,prevY:200});
  Object.assign(s.enemies[0],{x:700,y:300,prevX:700,prevY:300,cooldown:0.5});
  command(s,'keys',{x:0,y:1});
  while(!s.enemies[0].windup&&s.time<10)step(s);
  const chief=s.enemies[0],locked=chief.angle;
  assert.ok(chief.windup>0);
  const direct=Math.atan2(s.player.y-chief.y,s.player.x-chief.x);
  assert.ok(Math.abs(angleDelta(locked,direct))>0.05,'warning should lead movement instead of trailing current position');
  command(s,'keys',{x:0,y:-1});
  while(chief.windup||chief.burstLeft){step(s);assert.equal(chief.angle,locked);}
  assert.equal(chief.shots,3);
});

test('Chief prediction handles stationary player and boundaries without NaN',()=>{
  for(const point of [{x:38,y:38},{x:922,y:562}]){
    const s=createRun();s.encounter=4;startBattle(s);command(s,'move',point);
    for(let i=0;i<1800&&s.phase==='battle';i++){
      step(s);assert.ok(Number.isFinite(s.enemies[0].angle));
      for(const b of s.bullets)assert.ok(Number.isFinite(b.x)&&Number.isFinite(b.y));
    }
    assert.ok(s.enemies[0].shots>0);
  }
});
