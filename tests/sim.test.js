import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,startBattle,step,command,sweepHit,chooseUpgrade,retryBattle,STEP,UPGRADES,muzzleLength} from '../src/sim.js';
test('fast swept projectile cannot tunnel through moving small target',()=>{assert.notEqual(sweepHit(0,0,100,0,50,5,50,0,6),null);assert.equal(sweepHit(0,0,100,0,50,20,50,20,6),null);});
test('normal entry advances combat and reaches a real outcome',()=>{const s=createRun(1);assert.equal(startBattle(s),true);for(let i=0;i<60*180&&s.phase==='battle';i++)step(s);assert.notEqual(s.phase,'battle');assert.ok(s.player.shots>0);assert.ok(s.enemies[0].shots>0);console.log({phase:s.phase,duration:s.time,hp:s.player.hp,hits:s.player.hits});});
test('command persists longer than legacy expiry and cannot be overridden by shooting',()=>{const s=createRun();startBattle(s);command(s,'move',{x:850,y:550});for(let i=0;i<180;i++)step(s);assert.ok(s.waypoint);assert.ok(s.player.x>400);assert.ok(s.player.y>370);assert.ok(s.player.shots>0);});
test('target selection does not cancel waypoint',()=>{const s=createRun();startBattle(s);command(s,'move',{x:800,y:500});command(s,'target','enemy-0');assert.ok(s.waypoint);step(s);assert.equal(s.targetId,'enemy-0');});
test('opposite keyboard command reverses next update',()=>{const s=createRun();startBattle(s);command(s,'keys',{x:1,y:0});step(s);const x=s.player.x;command(s,'keys',{x:-1,y:0});step(s);assert.ok(s.player.x<x);});
test('reward application is once and persists to next encounter',()=>{const s=createRun();startBattle(s);while(s.phase==='battle'&&s.time<180)step(s);assert.equal(s.phase,'reward');const id=s.choiceIds[0];assert.equal(chooseUpgrade(s,id),true);assert.equal(chooseUpgrade(s,id),false);assert.equal(startBattle(s),true);assert.equal(s.encounter,1);assert.deepEqual(s.upgrades,[id]);});
test('retry restores encounter snapshot and decrements once',()=>{const s=createRun();startBattle(s);s.player.hp=0;step(s);assert.equal(s.phase,'loss');assert.equal(retryBattle(s),true);assert.equal(retryBattle(s),false);assert.equal(s.retries,1);assert.equal(s.player.hp,s.player.maxHp);assert.equal(s.bullets.length,0);});
test('three-skitter encounter remains finite and in bounds',()=>{const s=createRun();s.encounter=2;startBattle(s);for(let i=0;i<3600&&s.phase==='battle';i++){step(s);for(const b of [s.player,...s.enemies]){assert.ok(Number.isFinite(b.x)&&Number.isFinite(b.y));assert.ok(b.x>=0&&b.x<=960&&b.y>=0&&b.y<=600);}}});

test('thirty constrained intro seeds win at a readable cadence without HP padding',()=>{
  for(let seed=1;seed<=30;seed++){
    const s=createRun(seed);startBattle(s);let firstHit=null,lastHit=0,maxGap=0,previous=245;
    while(s.phase==='battle'&&s.time<60){step(s);const hp=s.player.hp+s.enemies[0].hp;if(hp<previous){firstHit??=s.time;maxGap=Math.max(maxGap,s.time-lastHit);lastHit=s.time;previous=hp;}if(s.time<8)assert.ok(s.enemies[0].hp>0);}
    assert.equal(s.phase,'reward');assert.ok(s.time>=25&&s.time<=45,`seed ${seed} duration ${s.time}`);assert.ok(maxGap<10);assert.ok(firstHit<8);assert.ok(s.choiceIds.includes('coil')&&s.choiceIds.includes('barrel'));
  }
});
test('target death cannot clear a pending movement order',()=>{const s=createRun();startBattle(s);command(s,'move',{x:900,y:540});command(s,'target','enemy-0');s.enemies[0].hp=0;step(s);assert.equal(s.targetId,null);assert.ok(s.waypoint);});
test('waypoint arrival, keyboard precedence and invalid commands',()=>{
  const s=createRun();startBattle(s);command(s,'move',{x:185,y:450});command(s,'keys',{x:-1,y:0});step(s);assert.ok(s.player.x<185);assert.ok(s.waypoint);command(s,'keys',{x:0,y:0});
  for(let i=0;i<100&&s.waypoint;i++)step(s);assert.equal(s.waypoint,null);assert.ok(Math.hypot(s.player.x-185,s.player.y-450)<=6);assert.equal(command(s,'move',{x:NaN,y:0}),false);command(s,'move',{x:-100,y:900});assert.deepEqual(s.waypoint,{x:38,y:562});
});
test('five living heterogeneous enemies and repeated near-boundary steps stay finite',()=>{
  const s=createRun();s.encounter=3;startBattle(s);
  for(let i=2;i<5;i++)s.enemies.push({...s.enemies[i%2],id:`extra-${i}`,x:710+(i%2)*70,y:80+i*90,prevX:710,prevY:80+i*90});
  assert.equal(s.enemies.length,5);
  for(let i=0;i<7200&&s.phase==='battle';i++){step(s);for(const b of [s.player,...s.enemies]){assert.ok(Number.isFinite(b.x)&&Number.isFinite(b.y)&&Number.isFinite(b.hp));assert.ok(b.x>=b.radius+12&&b.x<=960-b.radius-12);assert.ok(b.y>=b.radius+12&&b.y<=600-b.radius-12);}}
  assert.notEqual(s.phase,'battle');
});

test('Repair Mesh regenerates in combat and never exceeds maximum hull',()=>{
  const s=createRun();startBattle(s);UPGRADES.find(u=>u.id==='mesh').apply(s.player);s.player.hp=130;
  for(let i=0;i<60;i++)step(s);assert.ok(Math.abs(s.player.hp-131)<1e-7);
  s.player.hp=s.player.maxHp;step(s);assert.equal(s.player.hp,s.player.maxHp);
});
test('physical muzzle and projectile share forward axis for every weapon and quadrant',()=>{
  for(const gear of ['rivet','coil','barrel'])for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    const s=createRun();startBattle(s);Object.assign(s.player,{x:480,y:300,prevX:480,prevY:300,angle,gear,cooldown:0});
    Object.assign(s.enemies[0],{x:480+200*Math.cos(angle),y:300+200*Math.sin(angle)});
    const origin={x:s.player.x,y:s.player.y};step(s);const bullet=s.bullets.find(b=>b.team===0);assert.ok(bullet);
    const traveled=muzzleLength(s.player)+s.player.shotSpeed*STEP;
    assert.ok(Math.abs(bullet.x-origin.x-Math.cos(angle)*traveled)<1e-7);
    assert.ok(Math.abs(bullet.y-origin.y-Math.sin(angle)*traveled)<1e-7);
  }
});

test('Chief locks aim during a visible one-second windup and three-shot burst',()=>{
  const s=createRun();s.encounter=4;startBattle(s);
  while(!s.enemies[0].windup&&s.time<10)step(s);
  const chief=s.enemies[0],angle=chief.angle,shots=chief.shots;
  assert.ok(chief.windup>=1);command(s,'move',{x:185,y:100});
  for(let i=0;i<60;i++){step(s);assert.equal(chief.angle,angle);assert.equal(chief.shots,shots);}
  while(chief.windup||chief.burstLeft){step(s);assert.equal(chief.angle,angle);}
  assert.equal(chief.shots-shots,3);assert.equal(chief.cooldown,4.2);
});
test('selected target death during ongoing pair fight preserves route and resumes targeting',()=>{
  const s=createRun();s.encounter=1;startBattle(s);command(s,'move',{x:880,y:530});command(s,'target','enemy-1');s.enemies[1].hp=0;step(s);
  assert.equal(s.phase,'battle');assert.equal(s.targetId,null);assert.ok(s.waypoint);const from=s.player.x;
  for(let i=0;i<180;i++)step(s);assert.ok(s.player.x>from+200);assert.ok(s.player.shots>0);assert.ok(s.waypoint);
});
test('both actual reward build directions complete five encounters without input',()=>{
  for(const role of ['coil','barrel'])for(let seed=1;seed<=6;seed++){
    const s=createRun(seed);startBattle(s);
    for(let i=0;i<5;i++){
      while(s.phase==='battle'&&s.time<120)step(s);
      if(i===4){assert.equal(s.phase,'win',`${role} seed ${seed}`);break;}
      assert.equal(s.phase,'reward');const id=[role,'shell','mesh','return','spring','lens','bearings'].find(id=>s.choiceIds.includes(id));assert.ok(id);chooseUpgrade(s,id);startBattle(s);
    }
    assert.ok(s.upgrades.includes(role));assert.equal(s.upgrades.length,4);
  }
});
