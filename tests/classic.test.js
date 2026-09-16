import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRun,startBattle,step,chooseUpgrade} from '../classic/src/sim.js';
const root=new URL('../classic/',import.meta.url);
test('classic runtime files retain the declared immutable original hashes',async()=>{
 const identity=JSON.parse(await readFile(new URL('SOURCE.json',root),'utf8'));
 assert.equal(identity.commit,'8fadd89528e3de5100b0050c61f5030f10cacf5b');assert.equal(identity.version,'1.0.0');
 for(const [path,hash] of Object.entries(identity.sha256))assert.equal(createHash('sha256').update(await readFile(new URL(path,root))).digest('hex'),hash,path);
 assert.ok(!(await readdir(root)).includes('media'),'do not duplicate old video');
 for(const file of ['presentation.html','demo.html'])assert.match(await readFile(new URL(file,root),'utf8'),/releases\/tag\/v1\.0\.0/);
});
test('preserved classic first fight and both legal reward paths remain playable',()=>{
 for(const role of ['coil','barrel']){
  const s=createRun(1);startBattle(s);
  for(let fight=0;fight<5;fight++){
   while(s.phase==='battle'&&s.time<75)step(s);
   assert.equal(s.phase,fight===4?'win':'reward');
   if(fight===0){assert.equal(s.player.hp,70);assert.ok(Math.abs(s.time-27.583333333333048)<1e-8);}
   if(fight<4){const id=[role,'shell','mesh','return','spring','lens','bearings'].find(id=>s.choiceIds.includes(id));chooseUpgrade(s,id);startBattle(s);}
  }
 }
});
