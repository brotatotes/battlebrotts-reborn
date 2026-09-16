import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,startBattle,step,retryBattle,command} from '../src/sim.js';

// Synthetic positions, production damage resolution. Fixtures never represent a playtest.
function scene(gear='rivet') {
  const s=createRun();s.encounter=1;startBattle(s);
  Object.assign(s.player,{x:100,y:100,prevX:100,prevY:100,speed:0,cooldown:999,gear});
  for(const [i,e] of s.enemies.entries())Object.assign(e,{x:260+i*90,y:300,prevX:260+i*90,prevY:300,speed:0,cooldown:999,radius:10});
  s.bullets=[{id:0,team:0,owner:'pip',x:200,y:300,vx:12000,vy:0,damage:20,life:2,gear,hitIds:[]}];
  return s;
}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('the compact second encounter supplies one fragile Relay linked only to Rivet',()=>{
  const s=scene();assert.equal(s.enemies[1].kind,'relay');assert.equal(s.enemies[1].linkedId,s.enemies[0].id);assert.equal(s.enemies[1].maxHp,48);
});
test('a living Relay reduces buddy damage once but does not shield itself',()=>{
  const s=scene('barrel');step(s);close(s.enemies[0].hp,105-13);close(s.enemies[1].hp,48-13);
  const shielded=s.events.find(e=>e.type==='hit'&&e.targetId==='enemy-0');close(shielded.damage,13);assert.equal(shielded.shielded,true);
});
test('dead, absent, hostile and self-linked sources provide no protection',()=>{
  for(const fault of ['dead','absent','hostile','self']){
    const s=scene();const relay=s.enemies[1];
    if(fault==='dead')relay.hp=0;
    if(fault==='absent')s.enemies.pop();
    if(fault==='hostile')relay.team=0;
    if(fault==='self')relay.linkedId=relay.id;
    step(s);close(s.enemies[0].hp,85);
  }
});
test('Relay killed first removes protection for a later piercing hit in the same tick',()=>{
  const s=scene('barrel');const [buddy,relay]=s.enemies;
  Object.assign(relay,{x:260,prevX:260,hp:10});Object.assign(buddy,{x:350,prevX:350});step(s);
  close(buddy.hp,92);assert.equal(relay.hp,0);assert.equal(s.events.filter(e=>e.type==='linkBreak').length,1);assert.ok(s.notice.includes('LINK BROKEN'));
});
test('a pulse applies shield reduction once to its secondary recipient',()=>{
  const s=scene('coil');const [buddy,relay]=s.enemies;
  Object.assign(relay,{x:260,prevX:260});Object.assign(buddy,{x:260,prevX:260,y:350,prevY:350});step(s);
  close(relay.hp,28);close(buddy.hp,105-8*0.65);
});
test('pulse killing Relay removes buddy protection before its secondary damage',()=>{
  const s=scene('coil');const [buddy,relay]=s.enemies;
  Object.assign(relay,{x:260,prevX:260,hp:10});Object.assign(buddy,{x:260,prevX:260,y:350,prevY:350});step(s);
  close(buddy.hp,97);assert.equal(relay.hp,0);assert.equal(s.player.expression,'pleased');
});
test('repair resets link, cue and expression while keeping weapon and clears transient attacks',()=>{
  const s=scene('coil');s.enemies[1].hp=0;s.notice='LINK BROKEN';s.noticeLife=1;s.player.expression='pleased';s.player.expressionLife=1;
  s.player.hp=0;step(s);assert.equal(s.phase,'loss');assert.equal(retryBattle(s),true);
  assert.equal(s.enemies[1].kind,'relay');assert.equal(s.enemies[1].linkedId,'enemy-0');assert.equal(s.enemies[1].hp,48);
  assert.equal(s.player.gear,'coil');assert.equal(s.player.expression,'neutral');assert.equal(s.player.expressionLife,0);assert.equal(s.notice,'');assert.equal(s.bullets.length,0);assert.equal(s.effects.length,0);
});
test('new weapons preserve long route, firing, keyboard precedence, target death and return to auto',()=>{
  for(const gear of ['coil','barrel']){
    const s=createRun();s.encounter=1;startBattle(s);s.player.gear=gear;
    command(s,'move',{x:880,y:530});command(s,'target','enemy-1');
    for(let i=0;i<181;i++)step(s);assert.ok(s.waypoint);assert.ok(s.player.shots>0);
    const x=s.player.x;command(s,'keys',{x:-1,y:0});step(s);assert.ok(s.player.x<x);
    s.enemies[1].hp=0;step(s);assert.equal(s.targetId,null);assert.ok(s.waypoint);
    command(s,'auto');assert.equal(s.waypoint,null);assert.deepEqual(s.keys,{x:0,y:0});
    command(s,'move',{x:s.player.x,y:s.player.y+30});for(let i=0;i<30;i++)step(s);assert.equal(s.waypoint,null);
  }
});

test('link break and expression expire in simulation time, not renderer time',()=>{
  const s=scene('barrel');const [buddy,relay]=s.enemies;
  Object.assign(relay,{x:260,prevX:260,hp:10});Object.assign(buddy,{x:350,prevX:350});step(s);
  assert.equal(s.player.expression,'pleased');assert.ok(s.notice);
  for(let i=0;i<160;i++)step(s);
  assert.equal(s.player.expression,'neutral');assert.equal(s.player.expressionLife,0);assert.equal(s.notice,'');assert.equal(s.noticeLife,0);
});
test('supported pair simultaneous pulse deaths emit one kill per body and one link break',()=>{
  const s=scene('coil');const [buddy,relay]=s.enemies;
  Object.assign(relay,{x:260,prevX:260,hp:5});Object.assign(buddy,{x:260,prevX:260,y:350,prevY:350,hp:5});
  for(let i=1;i<30;i++)s.bullets.push({...s.bullets[0],id:i,hitIds:[]});step(s);
  assert.equal(s.phase,'reward');assert.equal(s.events.filter(e=>e.type==='kill').length,2);assert.equal(s.events.filter(e=>e.type==='linkBreak').length,1);assert.ok(s.effects.length<=60);
});
