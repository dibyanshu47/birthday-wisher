// Tiny Web Audio engine: synthesized "Happy Birthday" + sound effects. No audio files needed.
import { config } from './config.js';

let ctx = null;
const ac = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

function tone(freq, start, dur, dest, type = 'triangle', vol = 1) {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(g).connect(dest);
  o.start(start);
  o.stop(start + dur + 0.05);
}

function noise(dur, filterType, freq, vol) {
  const c = ac();
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = filterType;
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(c.destination);
  src.start();
}

const N = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
const SONG = [
  ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
  ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
  ['G4', 0.75], ['G4', 0.25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
  ['F5', 0.75], ['F5', 0.25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 3],
];

let enabled = config.music;
let master = null;
let timer = null;

function playOnce() {
  const c = ac();
  if (master) master.disconnect();
  master = c.createGain();
  master.gain.value = 0.09;
  master.connect(c.destination);
  const beat = 0.4;
  let t = c.currentTime + 0.15;
  for (const [n, d] of SONG) {
    tone(N[n], t, d * beat * 0.9, master);
    tone(N[n] * 2, t, d * beat * 0.5, master, 'sine', 0.25);
    t += d * beat;
  }
  timer = setTimeout(() => enabled && playOnce(), (t - c.currentTime + 2.5) * 1000);
}

export const music = {
  get enabled() { return enabled; },
  start() {
    if (!enabled || timer) return;
    playOnce();
  },
  stop() {
    clearTimeout(timer);
    timer = null;
    if (master) {
      const m = master;
      m.gain.setTargetAtTime(0, ac().currentTime, 0.1);
      setTimeout(() => m.disconnect(), 500);
      master = null;
    }
  },
  toggle() {
    enabled = !enabled;
    enabled ? this.start() : this.stop();
    return enabled;
  },
};

export const sfx = {
  chime(f = 880) {
    if (!enabled) return;
    const c = ac();
    tone(f, c.currentTime, 0.35, c.destination, 'sine', 0.15);
    tone(f * 1.5, c.currentTime + 0.05, 0.3, c.destination, 'sine', 0.07);
  },
  pop() { if (enabled) noise(0.15, 'highpass', 700, 0.6); },
  whoosh() { if (enabled) noise(0.4, 'bandpass', 500, 0.5); },
};
