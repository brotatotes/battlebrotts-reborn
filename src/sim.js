export const WIDTH = 960, HEIGHT = 600, STEP = 1 / 60;
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const angleDelta = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
export function rng(seed) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}
export const UPGRADES = [
  {id: 'coil', name: 'Close Coil', detail: 'Impact pulses hit nearby enemies for 40% damage. +55% direct damage, range 220.', apply: p => { p.damage *= 1.55; p.range = 220; p.gear = 'coil'; }},
  {id: 'barrel', name: 'Long Barrel', detail: 'Bolts pierce two aligned enemies. Second hit deals 65% damage. +30% direct damage, range 410.', apply: p => { p.damage *= 1.3; p.range = 410; p.gear = 'barrel'; }},
  {id: 'spring', name: 'Twin Spring', detail: 'Fire 20% more often.', apply: p => { p.interval /= 1.2; }},
  {id: 'shell', name: 'Reinforced Shell', detail: '+35 maximum hull.', apply: p => { p.maxHp += 35; p.hp += 35; }},
  {id: 'bearings', name: 'Rolling Bearings', detail: '+20% movement speed.', apply: p => { p.speed *= 1.2; }},
  {id: 'lens', name: 'Steady Lens', detail: 'Aim turns 40% faster. +10% damage.', apply: p => { p.turnSpeed *= 1.4; p.damage *= 1.1; }},
  {id: 'return', name: 'Return Spring', detail: '+20% damage.', apply: p => { p.damage *= 1.2; }},
  {id: 'mesh', name: 'Repair Mesh', detail: 'Restore 1 hull per second during combat, up to maximum hull.', apply: p => { p.regen = 1; }},
];
const templates = {
  pip: {name: 'Pip', maxHp: 140, speed: 100, range: 285, damage: 9, interval: 2.3, radius: 24, turnSpeed: 2.5, shotSpeed: 330},
  riveter: {name: 'Rivet', maxHp: 105, speed: 65, range: 240, damage: 5, interval: 1.9, radius: 25, turnSpeed: 1.4, shotSpeed: 230},
  skitter: {name: 'Skitter', maxHp: 48, speed: 115, range: 160, damage: 4, interval: 1.8, radius: 20, turnSpeed: 2, shotSpeed: 250},
  surveyor: {name: 'Surveyor', maxHp: 85, speed: 55, range: 390, damage: 8, interval: 2.4, radius: 24, turnSpeed: 1.1, shotSpeed: 310},
  relay: {name: 'Relay', maxHp: 48, speed: 60, range: 280, damage: 3, interval: 2.6, radius: 21, turnSpeed: 1.5, shotSpeed: 240},
  chief: {name: 'The Chief', maxHp: 280, speed: 50, range: 425, damage: 9, interval: 1.4, radius: 39, turnSpeed: 1.2, shotSpeed: 250},
};
export const ENCOUNTERS = [
  {name: 'First Shift', subtitle: 'An old riveter. A fresh start.', enemies: ['riveter']},
  {name: 'Linked Trouble', subtitle: 'Relay protects Rivet. Target Relay to break the link.', enemies: ['riveter', 'relay']},
  {name: 'Small Trouble', subtitle: 'Small machines. Big opinions.', enemies: ['skitter', 'skitter', 'skitter']},
  {name: 'Long Reach', subtitle: 'Watch the barrel, not just the bot.', enemies: ['surveyor', 'riveter']},
  {name: 'The Chief', subtitle: 'The Chief locks a line, then fires three bolts. Move sideways to dodge.', enemies: ['chief']},
];
function entity(kind, id, x, y, team) {
  const base = templates[kind];
  return {...base, kind, id, team, x, y, prevX: x, prevY: y, hp: base.maxHp, angle: team ? Math.PI : 0, bodyAngle: team ? Math.PI : 0, cooldown: 1, flash: 0, shots: 0, hits: 0, gear: 'rivet', regen: 0, windup: 0, burstLeft: 0, burstTimer: 0, expression: 'neutral', expressionLife: 0};
}
export const muzzleLength = bot => bot.radius + (bot.gear === 'barrel' ? 25 : bot.gear === 'coil' ? 8 : 12);
export function createRun(seed = 1) {
  const s = {seed, random: rng(seed), phase: 'ready', encounter: 0, retries: 2, upgrades: [], time: 0, ticks: 0, player: entity('pip', 'pip', 200, 300, 0), enemies: [], bullets: [], effects: [], events: [], waypoint: null, targetId: null, keys: {x: 0, y: 0}, choiceIds: [], nextBullet: 0, notice: '', noticeLife: 0, lastCommand: 'Autopilot ready'};
  return s;
}
export function startBattle(s) {
  if (!['ready', 'between', 'retry'].includes(s.phase)) return false;
  s.phase = 'battle'; s.notice = ''; s.noticeLife = 0; s.time = 0; s.ticks = 0; s.bullets = []; s.effects = []; s.waypoint = null; s.targetId = null; s.keys = {x: 0, y: 0};
  Object.assign(s.player, {x: 185, y: 300, prevX: 185, prevY: 300, hp: s.player.maxHp, angle: 0, bodyAngle: 0, cooldown: 1.5, shots: 0, hits: 0, flash: 0, autoTargetId: null, edgeRecovery: false, expression: 'neutral', expressionLife: 0});
  s.enemies = ENCOUNTERS[s.encounter].enemies.map((kind, i, all) => entity(kind, `enemy-${i}`, 740 + (i % 2) * 65, 300 + (i - (all.length - 1) / 2) * 120, 1));
  const relay=s.enemies.find(e=>e.kind==='relay');
  if(relay)relay.linkedId=s.enemies.find(e=>e.kind==='riveter')?.id??null;
  s.lastCommand = 'Autopilot engaged'; s.events = [{type: 'start'}];
  return true;
}
export function command(s, type, payload) {
  if (s.phase !== 'battle') return false;
  if (type === 'move') {
    if (!Number.isFinite(payload?.x) || !Number.isFinite(payload?.y)) return false;
    s.waypoint = {x: clamp(payload.x, 38, WIDTH - 38), y: clamp(payload.y, 38, HEIGHT - 38)};
    s.lastCommand = 'Moving to your marker';
  } else if (type === 'target') {
    if (!s.enemies.some(e => e.id === payload && e.hp > 0)) return false;
    s.targetId = payload; s.lastCommand = 'Target locked';
  } else if (type === 'auto') {
    s.waypoint = null; s.targetId = null; s.keys = {x: 0, y: 0}; s.lastCommand = 'Autopilot engaged';
  } else if (type === 'keys') {
    s.keys = {x: clamp(Number(payload?.x) || 0, -1, 1), y: clamp(Number(payload?.y) || 0, -1, 1)};
  } else return false;
  return true;
}
export function chooseUpgrade(s, id) {
  if (s.phase !== 'reward' || !s.choiceIds.includes(id)) return false;
  const upgrade = UPGRADES.find(u => u.id === id);
  upgrade.apply(s.player); s.upgrades.push(id); s.choiceIds = []; s.encounter++; s.phase = 'between';
  return true;
}
export function retryBattle(s) {
  if (s.phase !== 'loss' || s.retries <= 0) return false;
  s.retries--; s.phase = 'retry'; return startBattle(s);
}
// Earliest intersection of a swept point with a moving circle in relative space.
export function sweepHit(ax, ay, bx, by, cx, cy, dx, dy, radius) {
  const x = ax - cx, y = ay - cy, vx = (bx - ax) - (dx - cx), vy = (by - ay) - (dy - cy);
  const c = x*x + y*y - radius*radius;
  if (c <= 0) return 0;
  const a = vx*vx + vy*vy;
  if (a < 1e-12) return null;
  const b = 2*(x*vx + y*vy), d = b*b - 4*a*c;
  if (d < 0) return null;
  const t = (-b - Math.sqrt(d))/(2*a);
  return t >= 0 && t <= 1 ? t : null;
}
function fire(s, bot) {
  const ux = Math.cos(bot.angle), uy = Math.sin(bot.angle);
  s.bullets.push({id: s.nextBullet++, team: bot.team, owner: bot.id, x: bot.x+ux*muzzleLength(bot), y: bot.y+uy*muzzleLength(bot), vx: ux*bot.shotSpeed, vy: uy*bot.shotSpeed, damage: bot.damage, life: 2.5, gear: bot.gear, hitIds: []});
  bot.shots++; s.events.push({type: 'shot', team: bot.team});
}
// Fixed buddy link, queried at impact time so a source death takes effect immediately.
export function shieldSource(s, target) {
  if(target.hp<=0)return null;
  return s.enemies.find(e=>e.kind==='relay' && e.hp>0 && e.team===target.team && e.id!==target.id && e.linkedId===target.id)??null;
}
// Every damage recipient has one owner. Secondary damage never emits another attack.
function damageTarget(s, bullet, target, amount, secondary = false) {
  if (target.hp <= 0) return;
  const shielded=Boolean(shieldSource(s,target));
  if(shielded)amount*=0.65;
  const dealt = Math.min(target.hp, amount);
  target.hp = Math.max(0, target.hp - amount); target.flash = 0.12;
  if(target.team===0){target.expression='hurt';target.expressionLife=0.5;}
  const owner = [s.player, ...s.enemies].find(e => e.id === bullet.owner);
  if (owner && !secondary) owner.hits++;
  s.effects.push({x:target.x,y:target.y,life:0.3,death:target.hp===0});
  s.events.push({type:'hit',team:target.team,targetId:target.id,owner:bullet.owner,damage:dealt,shielded,secondary,attackId:bullet.id});
  if (target.hp === 0) {
    s.events.push({type:'kill',team:bullet.team,targetId:target.id,owner:bullet.owner,attackId:bullet.id});
    if(owner?.team===0 && owner.hp>0){owner.expression='pleased';owner.expressionLife=0.9;}
    if(target.kind==='relay' && s.enemies.some(e=>e.id===target.linkedId && e.hp>0)){
      s.events.push({type:'linkBreak',targetId:target.linkedId});s.notice='LINK BROKEN';s.noticeLife=2.4;
    }
  }
}
function getTarget(s, bot) {
  const foes = bot.team === 0 ? s.enemies.filter(e => e.hp > 0) : (s.player.hp > 0 ? [s.player] : []);
  const explicit=bot.team===0&&foes.find(e=>e.id===s.targetId);
  const target=explicit||foes.find(e=>e.id===bot.autoTargetId)||foes.sort((a,b)=>distance(bot,a)-distance(bot,b))[0];
  bot.autoTargetId=target?.id??null;
  return target;
}
export function step(s, dt = STEP) {
  if (s.phase !== 'battle') return;
  s.time += dt; s.ticks++; s.events = [];
  s.noticeLife=Math.max(0,s.noticeLife-dt);if(!s.noticeLife)s.notice='';
  const bots = [s.player, ...s.enemies].filter(e => e.hp > 0);
  const proposals = new Map();
  // Read last committed velocity before previous positions advance. Chief may
  // predict during aiming, but cannot change its line after the warning starts.
  const velocities = new Map(bots.map(b => [b.id, {x: (b.x-b.prevX)/dt, y: (b.y-b.prevY)/dt}]));
  for (const bot of bots) {
    bot.prevX = bot.x; bot.prevY = bot.y; bot.flash = Math.max(0, bot.flash-dt);
    bot.expressionLife=Math.max(0,(bot.expressionLife||0)-dt);if(!bot.expressionLife)bot.expression='neutral';
    bot.hp = Math.min(bot.maxHp, bot.hp + bot.regen * dt);
    const target = getTarget(s, bot);
    let vx = 0, vy = 0;
    const keyboard = bot.team === 0 && (s.keys.x || s.keys.y);
    const waypoint = bot.team === 0 && s.waypoint;
    if (keyboard) { vx = s.keys.x; vy = s.keys.y; }
    else if (waypoint) {
      const d = distance(bot, waypoint);
      if (d <= 6) { s.waypoint = null; s.lastCommand = 'Arrived. Autopilot engaged'; }
      else { vx = (waypoint.x-bot.x)/d; vy = (waypoint.y-bot.y)/d; }
    } else if (target) {
      const d = distance(bot, target), dx = (target.x-bot.x)/Math.max(1,d), dy = (target.y-bot.y)/Math.max(1,d);
      if (d > bot.range * 0.86) { vx = dx; vy = dy; }
      else if (d < bot.range * 0.58) { vx = -dx; vy = -dy; }
      else { vx = -dy * 0.28; vy = dx * 0.28; }
    }
    // A short inward arc keeps the autonomous player out of boundary parking.
    // Hysteresis prevents per-frame direction chatter. Explicit orders always win.
    if (bot.team === 0 && !keyboard && !waypoint && target) {
      const edge = Math.min(bot.x, WIDTH-bot.x, bot.y, HEIGHT-bot.y);
      if (edge < bot.radius+45) bot.edgeRecovery = true;
      if (edge > bot.radius+95) bot.edgeRecovery = false;
      if (bot.edgeRecovery) {
        const dx = WIDTH/2-bot.x, dy = HEIGHT/2-bot.y, length = Math.hypot(dx,dy);
        vx = dx/length * 0.85; vy = dy/length * 0.85;
      }
    }
    if (bot.kind === 'chief' && (bot.windup > 0 || bot.burstLeft > 0)) { vx = 0; vy = 0; }
    const magnitude = Math.max(1, Math.hypot(vx,vy));
    if (vx || vy) bot.bodyAngle += clamp(angleDelta(bot.bodyAngle, Math.atan2(vy,vx)), -3*dt, 3*dt);
    proposals.set(bot.id, {x: bot.x + vx/magnitude*bot.speed*dt, y: bot.y + vy/magnitude*bot.speed*dt});
    if (target) {
      const velocity = velocities.get(target.id) || {x: 0, y: 0};
      const lead = bot.kind === 'chief' ? 0.75 + distance(bot,target)/bot.shotSpeed : 0;
      const aimX = clamp(target.x + velocity.x*lead, target.radius+12, WIDTH-target.radius-12);
      const aimY = clamp(target.y + velocity.y*lead, target.radius+12, HEIGHT-target.radius-12);
      const aim = Math.atan2(aimY-bot.y, aimX-bot.x);
      // Chief commits to the visible line for the entire warning and burst.
      // Regular weapons retain their independent tracking/cadence.
      if (bot.kind === 'chief' && (bot.windup > 0 || bot.burstLeft > 0)) {
        if (bot.windup > 0) {
          bot.windup = Math.max(0, bot.windup-dt);
          if (bot.windup === 0) { bot.burstLeft = 3; bot.burstTimer = 0; }
        }
        if (bot.burstLeft > 0) {
          bot.burstTimer -= dt;
          if (bot.burstTimer <= 0) {
            fire(s,bot); bot.burstLeft--; bot.burstTimer = 0.24;
            if (bot.burstLeft === 0) bot.cooldown = 4.2;
          }
        }
      } else {
        bot.angle += clamp(angleDelta(bot.angle, aim), -bot.turnSpeed*dt, bot.turnSpeed*dt);
        bot.cooldown = Math.max(0, bot.cooldown-dt);
        if (distance(bot,target) <= bot.range && Math.abs(angleDelta(bot.angle,aim)) < 0.09 && bot.cooldown <= 0) {
          if (bot.kind === 'chief') { bot.windup = 1.05; s.events.push({type:'warning',team:bot.team}); }
          else { fire(s,bot); bot.cooldown = bot.interval; }
        }
      }
    }
  }
  // Project contacts and walls together. A single pair pass followed by a wall
  // clamp can push a corner body straight back into its neighbour. All passes
  // operate only on proposals, so each actual position still commits once.
  const constrain = (bot,p) => {
    p.x=clamp(p.x,bot.radius+12,WIDTH-bot.radius-12);
    p.y=clamp(p.y,bot.radius+12,HEIGHT-bot.radius-12);
  };
  for(const bot of bots)constrain(bot,proposals.get(bot.id));
  for(let pass=0;pass<64;pass++) {
    let maxOverlap=0;
    for(let i=0;i<bots.length;i++)for(let j=i+1;j<bots.length;j++) {
      const a=bots[i],b=bots[j],pa=proposals.get(a.id),pb=proposals.get(b.id);
      const dx=pb.x-pa.x,dy=pb.y-pa.y,d=Math.hypot(dx,dy),overlap=a.radius+b.radius+3-d;
      maxOverlap=Math.max(maxOverlap,overlap);
      if(overlap>0.001) {
        const ux=d>0.001?dx/d:1,uy=d>0.001?dy/d:0;
        pa.x-=ux*overlap/2;pa.y-=uy*overlap/2;
        pb.x+=ux*overlap/2;pb.y+=uy*overlap/2;
        constrain(a,pa);constrain(b,pb);
      }
    }
    if(maxOverlap<0.001)break;
  }
  for(const bot of bots) {
    const p=proposals.get(bot.id);bot.x=p.x;bot.y=p.y;
  }
  const surviving=[];
  for (const bullet of s.bullets) {
    if (bullet.life <= 0) continue;
    const travel = Math.min(dt, bullet.life);
    const nx=bullet.x+bullet.vx*travel, ny=bullet.y+bullet.vy*travel;
    const piercing=bullet.gear==='barrel', cap=piercing?2:1;
    bullet.hitIds ??= [];
    const contacts=[];
    for (const target of bots) {
      if (target.team===bullet.team || target.hp<=0 || bullet.hitIds.includes(target.id)) continue;
      const fraction=travel/dt;
      const tx=target.prevX+(target.x-target.prevX)*fraction, ty=target.prevY+(target.y-target.prevY)*fraction;
      const t=sweepHit(bullet.x,bullet.y,nx,ny,target.prevX,target.prevY,tx,ty,target.radius+3);
      if (t!==null) contacts.push({target,t});
    }
    contacts.sort((a,b)=>a.t-b.t || a.target.id.localeCompare(b.target.id));
    for (const {target} of contacts) {
      if (bullet.hitIds.length>=cap) break;
      if (target.hp<=0) continue;
      const amount=bullet.damage*(piercing && bullet.hitIds.length ? 0.65 : 1);
      bullet.hitIds.push(target.id);
      damageTarget(s,bullet,target,amount);
      if (bullet.gear==='coil') {
        s.effects.push({kind:'pulse',x:target.x,y:target.y,radius:75,life:0.3});
        for (const neighbour of bots) {
          if (neighbour.id!==target.id && neighbour.team!==bullet.team && neighbour.hp>0 && distance(target,neighbour)<=75) {
            damageTarget(s,bullet,neighbour,bullet.damage*0.4,true);
          }
        }
      }
    }
    bullet.x=nx; bullet.y=ny; bullet.life-=dt;
    if(bullet.hitIds.length<cap && bullet.life>0 && nx>-20 && nx<WIDTH+20 && ny>-20 && ny<HEIGHT+20) surviving.push(bullet);
  }
  s.bullets=surviving;
  s.effects=s.effects.filter(e=>(e.life-=dt)>0).slice(-60);
  if (s.targetId && !s.enemies.some(e=>e.id===s.targetId && e.hp>0)) s.targetId=null;
  if (s.player.hp<=0) s.phase='loss';
  else if (s.enemies.every(e=>e.hp<=0)) {
    s.phase=s.encounter===ENCOUNTERS.length-1?'win':'reward';
    if(s.phase==='reward') {
      const eligible=UPGRADES.filter(u=>!s.upgrades.includes(u.id) && !(s.upgrades.includes('coil') && u.id==='barrel') && !(s.upgrades.includes('barrel') && u.id==='coil'));
      for(let i=eligible.length-1;i>0;i--) { const j=Math.floor(s.random()*(i+1)); [eligible[i],eligible[j]]=[eligible[j],eligible[i]]; }
      // The first decision always exposes both build directions. Later rewards
      // stay varied without offering a hidden, unequipped replacement.
      s.choiceIds=s.encounter===0 ? ['coil','barrel',eligible.find(u=>!['coil','barrel'].includes(u.id)).id] : eligible.slice(0,3).map(u=>u.id);
    }
  }
}
export function snapshot(s) {
  return JSON.parse(JSON.stringify(s, (key,value)=>key==='random'?undefined:value));
}
