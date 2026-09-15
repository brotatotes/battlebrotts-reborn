import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun, UPGRADES} from '../src/sim.js';
import {upgradePreview} from '../src/upgrade-view.js';

test('every preview matches the actual equipped effect without changing the real player', () => {
  const player = createRun().player;
  for (const earlier of [null, ...UPGRADES]) {
    const current = {...player};
    earlier?.apply(current);
    for (const upgrade of UPGRADES) {
      const unchanged = structuredClone(current), actual = {...current};
      upgrade.apply(actual);
      const preview = upgradePreview(Object.freeze({...current}), upgrade.id);
      assert.deepEqual(current, unchanged);
      for (const change of preview) {
        assert.equal(change.before, current[change.key]);
        assert.equal(change.after, actual[change.key]);
        assert.ok(change.text.includes(' → '));
      }
    }
  }
});

test('reward choices disclose both a build benefit and its range trade-off', () => {
  const player = createRun().player;
  const coil = upgradePreview(player, 'coil'), barrel = upgradePreview(player, 'barrel');
  assert.equal(coil.find(x => x.key === 'range').after, 220);
  assert.equal(barrel.find(x => x.key === 'range').after, 410);
  assert.ok(coil.some(x => x.key === 'damage' && x.after > x.before));
  assert.ok(upgradePreview(player, 'spring').some(x => x.after < x.before));
  assert.deepEqual(upgradePreview(player, 'unknown'), []);
});
