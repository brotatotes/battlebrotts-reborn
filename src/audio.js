// Original little mechanical tones. No samples, files, network or music loop.
// One lazy context outlives every run. Muting/pausing tears down all live voices.
const tones = {
  shot: [260, 125, 0.055, 'triangle', 0.018],
  hit: [120, 65, 0.07, 'sine', 0.025],
  warning: [390, 470, 0.18, 'sine', 0.028],
  reward: [420, 670, 0.22, 'sine', 0.03],
  win: [520, 880, 0.32, 'sine', 0.03],
  loss: [230, 115, 0.25, 'triangle', 0.025],
  command: [330, 390, 0.06, 'sine', 0.02],
};

export function createAudio(makeContext = () => {
  const Constructor = globalThis.AudioContext || globalThis.webkitAudioContext;
  return Constructor ? new Constructor() : null;
}) {
  let context = null, enabled = false, suspended = false, lastSound = -Infinity;
  const voices = new Set();
  function clear() {
    for (const voice of voices) {
      try { voice.oscillator.stop(); } catch { /* Already ended. */ }
      voice.oscillator.disconnect(); voice.gain.disconnect();
    }
    voices.clear();
  }
  async function setEnabled(value) {
    enabled = Boolean(value);
    if (!enabled) { clear(); return false; }
    try {
      context ||= makeContext();
      if (!context) { enabled = false; return false; }
      await context.resume();
    } catch { enabled = false; clear(); }
    return enabled;
  }
  function setSuspended(value) {
    suspended = Boolean(value);
    if (suspended) clear();
  }
  function play(type) {
    if (!enabled || suspended || !context || context.state !== 'running' || !tones[type]) return false;
    const time = context.currentTime;
    if (voices.size >= 6 || time - lastSound < 0.045) return false;
    lastSound = time;
    const [from, to, duration, wave, volume] = tones[type];
    const oscillator = context.createOscillator(), gain = context.createGain();
    const voice = {oscillator, gain};
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(from, time);
    oscillator.frequency.exponentialRampToValueAtTime(to, time + duration);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain); gain.connect(context.destination); voices.add(voice);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); voices.delete(voice); };
    oscillator.start(time); oscillator.stop(time + duration + 0.01);
    return true;
  }
  function events(items) {
    // Important warnings beat little impacts; several hits in a step make one sound.
    const selected = ['warning', 'hit', 'shot'].find(type => items.some(item => item.type === type));
    if (selected) play(selected);
  }
  return Object.freeze({setEnabled, setSuspended, play, events,
    status: () => ({enabled, suspended, activeVoices: voices.size, hasContext: Boolean(context)})});
}
