import {createRun,startBattle,step,command,chooseUpgrade,retryBattle,snapshot,UPGRADES,ENCOUNTERS,STEP,WIDTH,HEIGHT,distance,shieldSource} from './sim.js';
import {render} from './render.js';
import {viewportSize,pointerToWorld} from './view.js';
import {upgradePreview} from './upgrade-view.js';
import {createAudio} from './audio.js';
import {commandLabel} from './command-label.js';
const audio=createAudio();
const el=id=>document.getElementById(id),canvas=el('arena');
let state=createRun(1),paused=false,last=performance.now(),accumulator=0,lastPhase='',runNumber=1,portrait=false;
const held=new Set();
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion=motionPreference.matches;
motionPreference.addEventListener('change',event=>{reducedMotion=event.matches;});
function resize(){
  const nextPortrait=matchMedia('(max-width:600px)').matches;
  if(nextPortrait!==portrait){portrait=nextPortrait;held.clear();command(state,'keys',{x:0,y:0});}
  const size=viewportSize(portrait);
  const width=Math.round(canvas.clientWidth*Math.min(2,devicePixelRatio||1)),height=Math.round(width*size.height/size.width);
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;render(canvas,state,1,portrait,reducedMotion);}
}
new ResizeObserver(resize).observe(canvas);resize();
function button(label,fn,primary=false){const b=document.createElement('button');b.textContent=label;b.className=primary?'primary':'';b.addEventListener('click',fn);return b;}
function start(){startBattle(state);paused=false;audio.setSuspended(false);lastPhase='';canvas.focus();}
function newRun(){audio.setSuspended(true);state=createRun(++runNumber);paused=false;held.clear();lastPhase='';}
function sync(){
  el('stats').innerHTML=`<dt>Hull</dt><dd>${Math.ceil(state.player.hp)} / ${state.player.maxHp}</dd><dt>Damage</dt><dd>${state.player.damage.toFixed(1)}</dd><dt>Range</dt><dd>${Math.round(state.player.range)}</dd>`;
  const weapon=state.player.gear==='coil'?'Close Coil riveter':state.player.gear==='barrel'?'Long Barrel bolt thrower':'Standard riveter';
  el('gear').replaceChildren(...[weapon,...state.upgrades.filter(id=>!['coil','barrel'].includes(id)).map(id=>UPGRADES.find(u=>u.id===id).name)].map(name=>{const li=document.createElement('li');li.textContent=name;return li;}));
  el('retries').textContent=`${state.retries} repairs available`;
  el('progress').textContent=`ENCOUNTER ${state.encounter+1} / ${ENCOUNTERS.length}`;
  el('title').textContent=state.phase==='ready'?'Meet Pip. Make a little trouble.':ENCOUNTERS[state.encounter].name;
  el('subtitle').textContent=state.phase==='ready'?'Watch your Brott battle. Pick its gear. Take the wheel when it matters.':ENCOUNTERS[state.encounter].subtitle;
  const feedback=commandLabel(state,paused);
  el('command').textContent=feedback;
  el('battle-hull').textContent=`Pip · Hull ${Math.ceil(state.player.hp)} / ${state.player.maxHp}`;
  el('battle-gear').textContent=state.player.gear==='coil'?'Coil · pulses hit nearby rivals':state.player.gear==='barrel'?'Barrel · pierces two aligned rivals':'Standard riveter';
  const linked=state.enemies.some(e=>shieldSource(state,e));
  el('battle-rule').textContent=state.notice || (linked?'Rivet takes 35% less damage. Target Relay to break the link.':'');
  el('battle-feedback').textContent=feedback;
  el('pause').disabled=state.phase!=='battle';el('pause').textContent=paused?'Resume':'Pause';el('auto').disabled=state.phase!=='battle'||paused;
  const phase=paused?'paused':state.phase;
  document.body.classList.toggle('battle-active',phase==='battle');
  if(phase===lastPhase)return;lastPhase=phase;
  const overlay=el('overlay');overlay.replaceChildren();if(phase==='battle')return;
  const panel=document.createElement('div');panel.className='panel';
  const h=document.createElement('h2'),p=document.createElement('p'),actions=document.createElement('div');actions.className='actions';
  if(phase==='ready'){h.textContent='Ready, little Brott?';p.textContent='Pip does the fighting. You choose when to help.';actions.append(button('Start the circuit',start,true));}
  if(phase==='paused'){h.textContent='Taking a breather.';p.textContent='Your battle is right where you left it.';actions.append(button('Resume battle',()=>{togglePause();canvas.focus();},true),button('New run',newRun));}
  if(phase==='reward'){
    h.textContent='Good work, Pip.';p.textContent='Choose one upgrade. Your hull is restored for the next battle.';actions.className='choices';
    for(const id of state.choiceIds){
      const u=UPGRADES.find(x=>x.id===id),b=button(u.name,()=>{if(chooseUpgrade(state,id))start();});
      const small=document.createElement('small');small.textContent=u.detail;b.append(small);
      const comparison=document.createElement('span');comparison.className='upgrade-comparison';
      comparison.textContent=upgradePreview(state.player,id).map(change=>change.text).join(' · ');
      b.append(comparison);actions.append(b);
    }
  }
  if(phase==='loss'){h.textContent='Down, not forgotten.';p.textContent=state.retries?'Keep your gear. Repair Pip and try this encounter again.':'No repairs left. A new build is a new chance.';if(state.retries)actions.append(button('Repair and retry',()=>{retryBattle(state);canvas.focus();},true));actions.append(button('New run',newRun));}
  if(phase==='win'){h.textContent='Small Brott. Big day.';p.textContent='Five encounters. One very proud machine. Try a different build?';actions.append(button('Start a new run',newRun,true));}
  panel.append(h,p,actions);overlay.append(panel);
  if(phase!=='ready')requestAnimationFrame(()=>{
    actions.querySelector('button')?.focus({preventScroll:true});
    panel.scrollIntoView({block:'center',behavior:'instant'});
  });
}
function togglePause(){if(state.phase==='battle'){paused=!paused;audio.setSuspended(paused);held.clear();command(state,'keys',{x:0,y:0});}}
el('sound').addEventListener('click',async()=>{
  const sound=el('sound');sound.disabled=true;
  const enabled=await audio.setEnabled(!audio.status().enabled);
  sound.textContent=enabled?'Sound on':'Sound off';sound.setAttribute('aria-pressed',String(enabled));sound.disabled=false;
  if(enabled)audio.play('command');
});
el('pause').addEventListener('click',togglePause);el('auto').addEventListener('click',()=>command(state,'auto'));
canvas.addEventListener('pointerdown',event=>{
  if(paused||state.phase!=='battle')return;event.preventDefault();canvas.focus();
  const r=canvas.getBoundingClientRect(),point=pointerToWorld({x:event.clientX,y:event.clientY},r,portrait);
  const enemy=state.enemies.filter(e=>e.hp>0).sort((a,b)=>distance(a,point)-distance(b,point)).find(e=>distance(e,point)<=e.radius+12);
  command(state,enemy?'target':'move',enemy?enemy.id:point);
  audio.play('command');
});
function keys(){const x=Number(held.has('d')||held.has('arrowright'))-Number(held.has('a')||held.has('arrowleft')),y=Number(held.has('s')||held.has('arrowdown'))-Number(held.has('w')||held.has('arrowup'));command(state,'keys',portrait?{x:y,y:-x}:{x,y});}
canvas.addEventListener('keydown',event=>{
  const k=event.key.toLowerCase();if(k==='escape'){event.preventDefault();togglePause();return;}
  if(paused)return;
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){event.preventDefault();held.add(k);keys();}
  if(k==='q'){event.preventDefault();const living=state.enemies.filter(e=>e.hp>0),index=living.findIndex(e=>e.id===state.targetId);if(living.length)command(state,'target',living[(index+1)%living.length].id);}
});
window.addEventListener('keyup',event=>{held.delete(event.key.toLowerCase());keys();});
canvas.addEventListener('blur',()=>{held.clear();keys();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){audio.setSuspended(true);if(state.phase==='battle'){paused=true;held.clear();keys();}}else if(!paused)audio.setSuspended(false);accumulator=0;last=performance.now();});
// Read-only diagnostics expose copies, never a state-mutating test shortcut.
Object.defineProperty(window,'battlebrotts',{value:Object.freeze({snapshot:()=>snapshot(state),isPaused:()=>paused,reducedMotion:()=>reducedMotion,audio:()=>audio.status()}),writable:false});
let uiClock=0;
function frame(now){
  const dt=Math.min(0.1,Math.max(0,(now-last)/1000));last=now;
  if(!paused){accumulator+=dt;let count=0;while(accumulator>=STEP&&count++<6){
    const before=state.phase,previousNotice=state.notice;step(state);
    if(state.notice!==previousNotice)uiClock=1;
    if(before==='battle'){
      if(state.phase!==before)audio.play(state.phase);else audio.events(state.events);
    }
    accumulator-=STEP;
  }}else accumulator=0;
  render(canvas,state,paused?1:accumulator/STEP,portrait,reducedMotion);uiClock+=dt;
  if(uiClock>0.08||lastPhase!==(paused?'paused':state.phase)){sync();uiClock=0;}
  requestAnimationFrame(frame);
}
sync();requestAnimationFrame(frame);
