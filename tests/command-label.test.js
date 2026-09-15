import test from 'node:test';
import assert from 'node:assert/strict';
import {commandLabel} from '../src/command-label.js';
import {createRun,startBattle,command} from '../src/sim.js';
test('feedback tracks keyboard priority, waypoint and target without changing control state',()=>{
 const state=createRun();startBattle(state);
 assert.equal(commandLabel(state),'Autopilot engaged');
 command(state,'move',{x:600,y:300});command(state,'target','enemy-0');
 assert.equal(commandLabel(state),'Moving to your marker. Target locked.');
 command(state,'keys',{x:1,y:0});const before=JSON.stringify(state);
 assert.equal(commandLabel(state),'You are steering. Pip keeps firing.');
 assert.equal(JSON.stringify(state),before);
 command(state,'keys',{x:0,y:0});assert.equal(commandLabel(state),'Moving to your marker. Target locked.');
 command(state,'auto');assert.equal(commandLabel(state),'Autopilot engaged');
 assert.equal(commandLabel(state,true),'Paused. Pip can wait.');
});
