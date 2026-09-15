import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudio} from '../src/audio.js';

function harness() {
  let creations = 0;
  const nodes = [];
  const parameter = {setValueAtTime() {}, exponentialRampToValueAtTime() {}};
  const context = {state: 'running', currentTime: 0, destination: {},
    async resume() { this.state = 'running'; },
    createOscillator() {
      const node = {frequency: parameter, connect() {}, disconnect() { this.disconnected = true; }, start() {}, stop() {}};
      nodes.push(node); return node;
    },
    createGain() { return {gain: parameter, connect() {}, disconnect() {}}; },
  };
  return {audio: createAudio(() => { creations++; return context; }), context, nodes, creations: () => creations};
}

test('audio is opt-in and one context survives mute, repeated runs and re-enabling', async () => {
  const h = harness();
  assert.equal(h.audio.play('shot'), false);
  assert.equal(h.creations(), 0);
  for (let i = 0; i < 20; i++) {
    assert.equal(await h.audio.setEnabled(true), true);
    h.context.currentTime += 1;
    assert.equal(h.audio.play('shot'), true);
    await h.audio.setEnabled(false);
    assert.equal(h.audio.status().activeVoices, 0);
    assert.equal(h.audio.play('hit'), false);
  }
  assert.equal(h.creations(), 1);
  assert.ok(h.nodes.every(node => node.disconnected));
});

test('simultaneous events, voice count and cleanup remain bounded', async () => {
  const h = harness(); await h.audio.setEnabled(true);
  for (let i = 0; i < 30; i++) {
    h.context.currentTime += 0.1;
    h.audio.events([{type: 'warning'}, {type: 'hit'}, {type: 'shot'}]);
    h.audio.play('shot');
  }
  assert.equal(h.audio.status().activeVoices, 6);
  assert.equal(h.nodes.length, 6);
  h.nodes[0].onended();
  assert.equal(h.audio.status().activeVoices, 5);
  h.audio.setSuspended(true);
  assert.equal(h.audio.status().activeVoices, 0);
  assert.equal(h.audio.play('warning'), false);
  h.audio.setSuspended(false); h.context.currentTime += 1;
  assert.equal(h.audio.play('win'), true);
});

test('unavailable or denied audio never prevents a playable silent game', async () => {
  for (const factory of [() => null, () => { throw Error('unavailable'); }, () => ({resume: async () => { throw Error('denied'); }})]) {
    const audio = createAudio(factory);
    assert.equal(await audio.setEnabled(true), false);
    assert.equal(audio.play('shot'), false);
    assert.equal(audio.status().activeVoices, 0);
  }
});
