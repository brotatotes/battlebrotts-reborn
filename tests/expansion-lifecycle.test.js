import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,startBattle,step,command,retryBattle,chooseUpgrade,UPGRADES,distance} from '../src/sim.js';

for(const gear of ['coil','barrel']){
 test(`${gear} actual equipment keeps long travel and next-tick keyboard priority while firing`,()=>{
  const s=createRun();s.encounter=1;startBattle(s);UPGRADES.find(u=>u.id===gear).apply(s.player);
  command(s,'move',{x:880,y:530});command(s,'target','enemy-1');
  const start={x:s.player.x,y:s.player.y};
  for(let i=0;i<190;i++)step(s);
  assert.ok(s.waypoint);assert.ok(s.player.shots>0);assert.ok(distance(start,s.player)>280);
  const before=s.player.x;command(s,'keys',{x:-1,y:0});step(s);assert.ok(s.player.x<before);assert.ok(s.waypoint);
  command(s,'keys',{x:1,y:0});const reverse=s.player.x;step(s);assert.ok(s.player.x>reverse);
  s.enemies[1].hp=0;step(s);assert.equal(s.targetId,null);assert.ok(s.waypoint);step(s);assert.equal(s.player.autoTargetId,'enemy-0');
  assert.equal(command(s,'target','absent'),false);assert.ok(s.waypoint);
  command(s,'auto');assert.equal(s.waypoint,null);assert.equal(s.targetId,null);assert.deepEqual(s.keys,{x:0,y:0});
  command(s,'move',{x:s.player.x,y:s.player.y+35});for(let i=0;i<30;i++)step(s);assert.equal(s.waypoint,null);
 });
 test(`${gear} six ordinary production runs bound transient attacks through every reward`,()=>{
  let maxBullets=0,maxEffects=0;
  for(let seed=1;seed<=6;seed++){
   const s=createRun(seed);startBattle(s);
   for(let fight=0;fight<5;fight++){
    while(s.phase==='battle'&&s.time<75){step(s);maxBullets=Math.max(maxBullets,s.bullets.length);maxEffects=Math.max(maxEffects,s.effects.length);assert.ok(s.bullets.every(b=>b.hitIds.length<=2));}
    assert.equal(s.phase,fight===4?'win':'reward');assert.equal(s.retries,2);
    if(fight<4){const id=[gear,'shell','mesh','return','spring','lens','bearings'].find(id=>s.choiceIds.includes(id));assert.ok(chooseUpgrade(s,id));assert.equal(chooseUpgrade(s,id),false);startBattle(s);assert.equal(s.effects.length,0);assert.equal(s.bullets.length,0);assert.equal(s.notice,'');assert.equal(s.player.expression,'neutral');}
   }
  }
  assert.ok(maxBullets<40,`observed ${maxBullets} projectiles`);assert.ok(maxEffects<=60);
 });
 test(`${gear} exhausted repairs do not reanimate or alter the fitted weapon`,()=>{
  const s=createRun();s.encounter=1;startBattle(s);UPGRADES.find(u=>u.id===gear).apply(s.player);
  const damage=s.player.damage,range=s.player.range;
  for(let i=0;i<3;i++){
   // Explicit synthetic death fixture tests retry boundaries, not difficulty.
   s.player.hp=0;step(s);assert.equal(s.phase,'loss');
   if(i<2){assert.equal(retryBattle(s),true);assert.equal(retryBattle(s),false);assert.equal(s.retries,1-i);assert.equal(s.player.hp,s.player.maxHp);assert.equal(s.enemies[1].hp,48);}
   else {const before=JSON.stringify(s);assert.equal(retryBattle(s),false);assert.equal(JSON.stringify(s),before);}
   assert.equal(s.player.gear,gear);assert.equal(s.player.damage,damage);assert.equal(s.player.range,range);
  }
 });
}
