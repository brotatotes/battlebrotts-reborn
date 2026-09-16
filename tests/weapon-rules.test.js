import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,startBattle,step,STEP} from '../src/sim.js';

// Synthetic collision geometry. All damage resolution runs production step().
function scene(gear, positions, {vx=6000,life=2.5}={}) {
  const s=createRun(); startBattle(s);
  Object.assign(s.player,{x:100,y:100,prevX:100,prevY:100,speed:0,cooldown:999,gear});
  const template=s.enemies[0];
  s.enemies=positions.map(([x,y],i)=>({...template,id:`e${i}`,x,y,prevX:x,prevY:y,radius:10,hp:100,maxHp:100,speed:0,cooldown:999}));
  s.bullets=[{id:0,team:0,owner:'pip',x:200,y:300,vx,vy:0,damage:20,life,gear,hitIds:[]}];
  return s;
}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('Coil pulse hits offset neighbour once, not self/friendly/distant/dead recipients',()=>{
  const s=scene('coil',[[270,300],[270,350],[270,440],[235,250]]);
  s.enemies[3].hp=0; step(s);
  assert.deepEqual(s.enemies.map(e=>e.hp),[80,92,100,0]);
  assert.equal(s.player.hp,140);assert.equal(s.bullets.length,0);
  assert.ok(s.effects.some(e=>e.kind==='pulse'&&e.radius===75));
});
test('pulse is not recursive through nearby recipients',()=>{
  const s=scene('coil',[[270,300],[270,365],[270,430]]);step(s);
  assert.deepEqual(s.enemies.map(e=>e.hp),[80,92,100]);
});
test('Barrel resolves ordered swept hits and stops after two distinct enemies',()=>{
  const s=scene('barrel',[[260,300],[350,300],[440,300]],{vx:18000});
  s.enemies.reverse();step(s);
  assert.equal(s.enemies.find(e=>e.id==='e0').hp,80);
  assert.equal(s.enemies.find(e=>e.id==='e1').hp,87);
  assert.equal(s.enemies.find(e=>e.id==='e2').hp,100);assert.equal(s.bullets.length,0);
});
test('Barrel does not hit offset targets and Coil cannot reach distant aligned one',()=>{
  const b=scene('barrel',[[260,300],[270,350],[400,300]],{vx:18000});step(b);
  assert.deepEqual(b.enemies.map(e=>e.hp),[80,100,87]);
  const c=scene('coil',[[260,300],[400,300]],{vx:18000});step(c);
  assert.deepEqual(c.enemies.map(e=>e.hp),[80,100]);
});
test('piercing bullet remembers first victim across frames inside its body',()=>{
  const s=scene('barrel',[[260,300],[400,300]],{vx:600});
  for(let i=0;i<13;i++)step(s);
  close(s.enemies[0].hp,80);assert.equal(s.bullets.length,1);
  assert.deepEqual(s.bullets[0].hitIds,['e0']);
  for(let i=0;i<12;i++)step(s);
  close(s.enemies[1].hp,87);assert.equal(s.bullets.length,0);
});
test('standard and legacy enemy projectiles remain first-hit only',()=>{
  const s=scene('rivet',[[260,300],[350,300]],{vx:18000});delete s.bullets[0].gear;delete s.bullets[0].hitIds;step(s);
  assert.deepEqual(s.enemies.map(e=>e.hp),[80,100]);assert.equal(s.bullets.length,0);
});
test('expired piercing projectile cannot damage anything',()=>{
  const s=scene('barrel',[[260,300],[350,300]],{life:0});step(s);
  assert.deepEqual(s.enemies.map(e=>e.hp),[100,100]);assert.equal(s.bullets.length,0);
});
test('actual fired projectile snapshots equipped weapon and starts without victims',()=>{
  for(const gear of ['coil','barrel']){
    const s=createRun();startBattle(s);Object.assign(s.player,{gear,cooldown:0,x:480,y:300,speed:0});Object.assign(s.enemies[0],{x:680,y:300,speed:0});step(s);
    const bullet=s.bullets.find(b=>b.team===0);assert.ok(bullet);assert.equal(bullet.gear,gear);assert.deepEqual(bullet.hitIds,[]);
  }
});
test('reset clears piercing victim history and effects, while preserving equipped gear',()=>{
  const s=scene('barrel',[[260,300],[400,300]],{vx:600});for(let i=0;i<7;i++)step(s);
  assert.equal(s.bullets[0].hitIds.length,1);s.phase='between';startBattle(s);
  assert.equal(s.bullets.length,0);assert.equal(s.effects.length,0);assert.equal(s.player.gear,'barrel');
});

test('a moving small second victim crossing the bolt path is swept rather than sampled',()=>{
  const s=scene('barrel',[[260,300],[350,315]],{vx:12000});
  Object.assign(s.enemies[1],{radius:4,speed:900,range:1000});
  // A near-range retreat sends it away from Pip diagonally. Choose Pip below/right
  // so the moving victim crosses upward into the projectile during this tick.
  Object.assign(s.player,{x:350,y:500,prevX:350,prevY:500});
  step(s);assert.equal(s.enemies[0].hp,80);assert.equal(s.enemies[1].hp,87);
});
test('bullet lifetime bounds its final swept travel and then discards it',()=>{
  const s=scene('barrel',[[280,300]],{vx:6000,life:STEP/2});step(s);
  assert.equal(s.enemies[0].hp,100);assert.equal(s.bullets.length,0);
});
test('multiple pulse kills cannot hit dead bodies again or exceed effect budget',()=>{
  const s=scene('coil',[[260,300],[260,340],[260,375]],{vx:12000});
  for(const e of s.enemies)e.hp=5;
  for(let i=1;i<80;i++)s.bullets.push({...s.bullets[0],id:i,hitIds:[]});
  step(s);
  assert.deepEqual(s.enemies.map(e=>e.hp),[0,0,0]);
  assert.equal(s.events.filter(e=>e.type==='kill').length,3);
  assert.ok(s.effects.length<=60);assert.equal(s.phase,'reward');
});
