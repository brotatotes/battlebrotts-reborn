import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,startBattle,step,command} from '../src/sim.js';
test('autopilot keeps a living target when neighbours exchange nearest position',()=>{
  const s=createRun();s.encounter=1;startBattle(s);step(s);
  const chosen=s.player.autoTargetId;assert.ok(chosen);
  const other=s.enemies.find(e=>e.id!==chosen);other.x=s.player.x+80;other.y=s.player.y;
  step(s);assert.equal(s.player.autoTargetId,chosen);
  command(s,'target',other.id);step(s);assert.equal(s.player.autoTargetId,other.id);
  other.hp=0;step(s);assert.equal(s.player.autoTargetId,chosen);assert.equal(s.targetId,null);
});
