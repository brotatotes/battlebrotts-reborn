// Derive control feedback from current simulation ownership, not the last key event.
export function commandLabel(state, paused = false) {
  if (paused) return 'Paused. Pip can wait.';
  if (state.phase !== 'battle') return state.lastCommand;
  if (state.keys.x || state.keys.y) return 'You are steering. Pip keeps firing.';
  if (state.waypoint) return state.targetId ? 'Moving to your marker. Target locked.' : 'Moving to your marker';
  if (state.targetId && state.enemies.some(enemy => enemy.id === state.targetId && enemy.hp > 0)) return 'Target locked. Autopilot moving.';
  return 'Autopilot engaged';
}
