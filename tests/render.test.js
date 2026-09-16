import test from 'node:test';
import assert from 'node:assert/strict';
import {render} from '../src/render.js';
import {createRun,startBattle,step,snapshot} from '../src/sim.js';

function instrument(){
  const calls=[];
  const context=new Proxy({}, {
    get(target,key){return target[key]??((...args)=>calls.push([key,...args]));},
    set(target,key,value){target[key]=value;calls.push(['set',key,value]);return true;}
  });
  return {calls,canvas:{width:1440,clientWidth:960,getContext:()=>context}};
}
test('reduced motion removes hit flashes and rings but retains actual bots and projectiles',()=>{
  const state=createRun();startBattle(state);
  for(let i=0;i<240;i++)step(state);
  state.player.flash=0.1;state.effects=[{x:400,y:300,life:0.2,death:false}];
  const before=snapshot(state),normal=instrument(),reduced=instrument();
  render(normal.canvas,state,1,false,false);render(reduced.canvas,state,1,false,true);
  assert.deepEqual(snapshot(state),before,'render must never change simulation');
  assert.ok(normal.calls.some(c=>c[0]==='set'&&c[1]==='fillStyle'&&c[2]==='#ffffff'));
  assert.ok(!reduced.calls.some(c=>c[0]==='set'&&c[1]==='fillStyle'&&c[2]==='#ffffff'));
  assert.equal(normal.calls.filter(c=>c[0]==='arc').length,reduced.calls.filter(c=>c[0]==='arc').length+1);
  assert.equal(normal.calls.filter(c=>c[0]==='lineTo').length,reduced.calls.filter(c=>c[0]==='lineTo').length);
});

test('reduced motion keeps the essential full pulse boundary without mutating state',()=>{
  const state=createRun();startBattle(state);state.player.gear='coil';
  state.effects=[{kind:'pulse',x:400,y:300,life:0.2,radius:75}];
  const before=snapshot(state),reduced=instrument();render(reduced.canvas,state,1,false,true);
  assert.deepEqual(snapshot(state),before);
  assert.ok(reduced.calls.some(c=>c[0]==='arc'&&c[1]===400&&c[2]===300&&c[3]===75));
});

test('Relay tether and protected outline use the live link in normal and reduced motion',()=>{
  const s=createRun();s.encounter=1;startBattle(s);
  for(const reduced of [false,true]){
    const before=snapshot(s),live=instrument();render(live.canvas,s,1,false,reduced);assert.deepEqual(snapshot(s),before);
    assert.ok(live.calls.some(c=>c[0]==='arc'&&c[1]===s.enemies[0].x&&c[2]===s.enemies[0].y&&c[3]===s.enemies[0].radius+10));
    s.enemies[1].hp=0;const dead=instrument();render(dead.canvas,s,1,false,reduced);
    assert.ok(!dead.calls.some(c=>c[0]==='arc'&&c[1]===s.enemies[0].x&&c[2]===s.enemies[0].y&&c[3]===s.enemies[0].radius+10));
    s.enemies[1].hp=s.enemies[1].maxHp;
  }
});
test('Pip expressions alter only face drawing and preserve simulation in portrait reduced motion',()=>{
  const s=createRun();startBattle(s);
  for(const expression of ['neutral','hurt','pleased']){
    s.player.expression=expression;s.player.expressionLife=0.5;const before=snapshot(s),screen=instrument();
    render(screen.canvas,s,1,true,true);assert.deepEqual(snapshot(s),before);assert.ok(screen.calls.length>0);
  }
});
