import { midi, noteName, TRACKS, stepTime } from './model.js';
import { encodeWav } from './wav.js';
const hz = (n) => 440 * 2 ** ((midi(n) - 69) / 12);
function random(seed = 17) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}
export class AudioEngine {
  constructor(context, fx, samples = []) {
    this.ctx = context;
    this.offline = typeof context.startRendering === 'function';
    this.samples = samples;
    this.voices = new Set();
    this.sampleVoices = Array.from({ length: 4 }, () => new Set());
    this.noiseCache = new Map();
    this.setup(fx);
  }
  setup(fx) {
    const c = this.ctx;
    this.filter = c.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.master = c.createGain();
    this.limiter = c.createDynamicsCompressor();
    this.limiter.threshold.value = -6;
    this.limiter.knee.value = 6;
    this.limiter.ratio.value = 12;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.18;
    this.delay = c.createDelay(1);
    this.delay.delayTime.value = 0.25;
    this.feedback = c.createGain();
    this.feedback.gain.value = 0.25;
    this.delayWet = c.createGain();
    this.reverb = c.createConvolver();
    const n = Math.ceil(c.sampleRate * 2.2),
      b = c.createBuffer(2, n, c.sampleRate),
      rng = random();
    for (let ch = 0; ch < 2; ch++) {
      const a = b.getChannelData(ch);
      for (let i = 0; i < n; i++) a[i] = (rng() * 2 - 1) * (1 - i / n) ** 2.6;
    }
    this.reverb.buffer = b;
    this.reverbWet = c.createGain();
    this.analyser = c.createAnalyser();
    this.analyser.fftSize = 256;
    this.filter.connect(this.master);
    this.filter.connect(this.delay);
    this.delay.connect(this.feedback).connect(this.delay);
    this.delay.connect(this.delayWet).connect(this.master);
    this.filter.connect(this.reverb);
    this.reverb.connect(this.reverbWet).connect(this.master);
    this.master.connect(this.limiter).connect(this.analyser).connect(c.destination);
    this.setFx(fx, true);
  }
  setFx(fx, immediate = false) {
    const t = this.ctx.currentTime;
    for (const [param, v] of [
      [this.filter.frequency, fx.filter],
      [this.delayWet.gain, fx.delay / 100],
      [this.reverbWet.gain, fx.space / 100],
      [this.master.gain, fx.master / 100],
    ])
      if (immediate) param.setValueAtTime(v, t);
      else param.setTargetAtTime(v, t, 0.01);
    this.fx = { ...fx };
  }
  trackSource(source, time, duration, slot, cleanup = []) {
    if (!this.offline && this.voices.size >= 128) {
      const oldest = this.voices.values().next().value;
      try {
        oldest.stop(this.ctx.currentTime);
      } catch {}
      this.voices.delete(oldest);
    }
    this.voices.add(source);
    if (slot !== undefined) this.sampleVoices[slot].add(source);
    source.onended = () => {
      this.voices.delete(source);
      if (slot !== undefined) this.sampleVoices[slot].delete(source);
      source.disconnect();
      cleanup.forEach((node) => node.disconnect());
    };
    source.start(time);
    if (duration !== undefined) source.stop(time + duration);
  }
  envelope(time, duration, amount, attack = 0.003) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, amount), time + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    g.connect(this.filter);
    return g;
  }
  tone(note, time, duration = 0.35, type = 'triangle', amount = 0.2, attack = 0.008) {
    const o = this.ctx.createOscillator(),
      g = this.envelope(time, duration, amount, attack);
    o.type = type;
    o.frequency.value = typeof note === 'number' ? note : hz(note);
    o.connect(g);
    this.trackSource(o, time, duration + 0.02, undefined, [g]);
  }
  pitchedDrum(start, end, time, duration, amount) {
    const o = this.ctx.createOscillator(),
      g = this.envelope(time, duration, amount);
    o.frequency.setValueAtTime(start, time);
    o.frequency.exponentialRampToValueAtTime(end, time + duration * 0.6);
    o.connect(g);
    this.trackSource(o, time, duration + 0.02, undefined, [g]);
  }
  noise(time, duration, cutoff, amount) {
    const key = duration;
    let b = this.noiseCache.get(key);
    if (!b) {
      const rng = random(31),
        len = Math.ceil(this.ctx.sampleRate * duration);
      b = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const a = b.getChannelData(0);
      for (let i = 0; i < len; i++) a[i] = rng() * 2 - 1;
      this.noiseCache.set(key, b);
    }
    const s = this.ctx.createBufferSource(),
      f = this.ctx.createBiquadFilter(),
      g = this.envelope(time, duration, amount, 0.001);
    s.buffer = b;
    f.type = 'highpass';
    f.frequency.value = cutoff;
    s.connect(f).connect(g);
    this.trackSource(s, time, duration + 0.01, undefined, [f, g]);
  }
  sample(index, time, settings, { loop = false, amount = 0.8 } = {}) {
    const slot = this.samples[index];
    if (!slot?.buffer) return null;
    const voices = this.sampleVoices[index];
    if (!settings.overlap || (!this.offline && voices.size >= 16))
      for (const v of voices) {
        try {
          v.stop(time);
        } catch {}
      }
    const source = this.ctx.createBufferSource(),
      g = this.ctx.createGain();
    g.gain.value = amount;
    source.buffer = slot.buffer;
    source.loop = loop;
    source.connect(g).connect(this.filter);
    this.trackSource(source, time, loop ? undefined : slot.buffer.duration, index, [g]);
    return source;
  }
  stopSlot(i) {
    for (const v of this.sampleVoices[i]) {
      try {
        v.stop();
      } catch {}
    }
    this.sampleVoices[i].clear();
  }
  trigger(id, time, p, index = 0, note) {
    const a = p.vol[id] ?? 0.8,
      n = note ?? p.notes[index] ?? 'C2';
    if (a === 0) return;
    switch (id) {
      case 'kick':
        this.pitchedDrum(150, 42, time, 0.35, a);
        break;
      case 'snare':
        this.noise(time, 0.19, 900, 0.58 * a);
        this.tone(180, time, 0.12, 'triangle', 0.3 * a);
        break;
      case 'hat':
        this.noise(time, 0.055, 6500, 0.24 * a);
        break;
      case 'clap':
        for (const d of [0, 0.018, 0.038]) this.noise(time + d, 0.09, 1300, 0.22 * a);
        break;
      case 'bass':
        this.tone(n, time, 0.3, 'sawtooth', 0.22 * a);
        break;
      case 'chord':
        for (const [i, r] of [1, 1.25, 1.5].entries())
          this.tone(
            hz(noteName((midi(n) % 12) + 48)) * r,
            time,
            0.72,
            i ? 'triangle' : 'sine',
            0.105 * a,
            0.04,
          );
        break;
      case 'tom':
        this.pitchedDrum(190, 78, time, 0.38, 0.55 * a);
        break;
      case 'shaker':
        this.noise(time, 0.11, 4200, 0.2 * a);
        break;
      case 'cowbell':
        for (const f of [540, 810]) this.tone(f, time, 0.18, 'square', 0.11 * a);
        break;
      case 'perc':
        this.pitchedDrum(620, 240, time, 0.13, 0.22 * a);
        break;
      case 'lead':
        this.tone(
          note ?? p.leadNotes[index] ?? noteName((midi(n) % 12) + 60),
          time,
          0.42,
          'triangle',
          0.24 * a,
        );
        break;
      case 'pluck':
        this.tone(
          note ?? p.pluckNotes[index] ?? noteName((midi(n) % 12) + 60),
          time,
          0.2,
          'sine',
          0.28 * a,
        );
        break;
      case 'guitar': {
        const gn = note ?? p.guitarNotes[index] ?? 'E3';
        this.tone(gn, time, 0.75, 'triangle', 0.18 * a, 0.003);
        this.tone(hz(gn) * 2.01, time, 0.42, 'sine', 0.06 * a, 0.003);
        break;
      }
      default:
        if (id.startsWith('sample')) {
          const i = id === 'sample' ? 0 : Number(id.slice(6)) - 1;
          this.sample(i, time, p.sampleSettings[i], { amount: a });
        }
    }
  }
  silence() {
    for (const s of this.voices) {
      try {
        s.stop();
      } catch {}
    }
    this.voices.clear();
    this.sampleVoices.forEach((s) => s.clear());
    this.analyser.disconnect();
    this.feedback.disconnect();
    this.filter.disconnect();
    this.setup(this.fx);
  }
}
export class Transport {
  constructor(engine, getProject, onStep, onState) {
    this.engine = engine;
    this.getProject = getProject;
    this.onStep = onStep;
    this.onState = onState;
    this.playing = false;
    this.nextStep = 0;
    this.heardStep = 0;
    this.queue = [];
    this.elapsed = 0;
  }
  play() {
    if (this.playing) return;
    this.playing = true;
    this.nextTime = this.engine.ctx.currentTime + 0.045;
    this.startTime = this.nextTime - this.elapsed;
    this.tick();
    this.frame();
    this.onState(true);
  }
  pause(reset = false) {
    this.playing = false;
    clearTimeout(this.timer);
    cancelAnimationFrame(this.animation);
    this.engine.silence();
    this.queue = [];
    this.nextStep = reset ? 0 : (this.heardStep + 1) % this.getProject().length;
    if (reset) {
      this.heardStep = 0;
      this.elapsed = 0;
    }
    this.onState(false);
    this.onStep(-1, this.elapsed);
  }
  tick() {
    if (!this.playing) return;
    const p = this.getProject(),
      c = this.engine.ctx,
      base = 60 / p.bpm / 4;
    // A backgrounded tab must not burst every missed note when it returns.
    if (this.nextTime < c.currentTime - 0.1) {
      this.nextTime = c.currentTime + 0.025;
      this.queue = [];
    }
    while (this.nextTime < c.currentTime + 0.1) {
      const i = this.nextStep,
        t = this.nextTime + (i % 2 ? (base * p.swing) / 100 : 0);
      for (const tr of TRACKS)
        if (p.pattern[tr.id][i] && !p.muted[tr.id]) this.engine.trigger(tr.id, t, p, i);
      this.queue.push({ i, t });
      this.nextTime += base;
      this.nextStep = (i + 1) % p.length;
    }
    this.timer = setTimeout(() => this.tick(), 25);
  }
  frame() {
    if (!this.playing) return;
    const now = this.engine.ctx.currentTime;
    while (this.queue.length && this.queue[0].t <= now) {
      this.heardStep = this.queue.shift().i;
      this.elapsed = Math.max(0, now - this.startTime);
      this.onStep(this.heardStep, this.elapsed);
    }
    this.animation = requestAnimationFrame(() => this.frame());
  }
  recordIndex() {
    return this.heardStep % this.getProject().length;
  }
}
export async function renderWav(p, samples, { tail = true } = {}) {
  const duration = (p.length * 60) / p.bpm / 4;
  const sampleTail = Math.max(0, ...samples.map((s) => s.buffer?.duration ?? 0));
  const extra = tail ? Math.max(2.8, sampleTail + 2.2) : 0;
  const c = new OfflineAudioContext(2, Math.ceil((duration + extra) * 44100), 44100),
    engine = new AudioEngine(c, p.fx, samples);
  for (let i = 0; i < p.length; i++)
    for (const tr of TRACKS)
      if (p.pattern[tr.id][i] && !p.muted[tr.id])
        engine.trigger(tr.id, stepTime(i, p.bpm, p.swing), p, i);
  return encodeWav(await c.startRendering());
}
