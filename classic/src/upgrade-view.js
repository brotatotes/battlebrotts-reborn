import {UPGRADES} from './sim.js';

const number = value => String(Math.round(value * 10) / 10);
const fields = [
  ['maxHp', 'Maximum hull', number],
  ['damage', 'Damage per hit', number],
  ['range', 'Range', number],
  ['interval', 'Seconds between shots', value => value.toFixed(2)],
  ['speed', 'Movement speed', number],
  ['turnSpeed', 'Aim speed', value => `${number(value)} rad/s`],
  ['regen', 'Hull restored each second', number],
];

// Preview uses the very same upgrade function as the simulation, on a copy.
// It never heals, equips or otherwise changes the real player before selection.
export function upgradePreview(player, id) {
  const upgrade = UPGRADES.find(item => item.id === id);
  if (!upgrade) return [];
  const after = {...player};
  upgrade.apply(after);
  return fields.filter(([key]) => player[key] !== after[key]).map(([key, label, format]) => ({
    key, label, before: player[key], after: after[key],
    text: `${label}: ${format(player[key])} → ${format(after[key])}`,
  }));
}
