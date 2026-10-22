import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createProject,
  parseProject,
  applyPreset,
  stepTime,
  midi,
  noteName,
} from '../src/model.js';
import { encodeWav } from '../src/wav.js';
test('legacy 3.1 projects migrate with defaults for absent lanes', () => {
  const p = createProject();
  p.version = '3.1';
  delete p.pattern.sample4;
  delete p.sampleSettings;
  const next = parseProject(p);
  assert.equal(next.version, 4);
  assert.deepEqual(next.pattern.sample4, Array(32).fill(false));
});
test('reject hostile or malformed imported projects before changing state', () => {
  for (const change of [
    (p) => (p.length = 1e7),
    (p) => (p.bpm = Infinity),
    (p) => (p.swing = -1),
    (p) => (p.pattern.kick = ['yes']),
    (p) => (p.notes[0] = '<img>'),
    (p) => (p.activeSample = 1.5),
    (p) => (p.fx.master = 101),
    (p) => (p.sampleSettings = [{}]),
    (p) => (p.version = 999),
  ]) {
    const p = createProject();
    change(p);
    assert.throws(() => parseProject(p));
  }
});
test('prototype and unexpected keys cannot pollute the restored project', () => {
  const p = createProject();
  const raw = JSON.parse(
    JSON.stringify(p).replace(
      '"pattern":{',
      '"pattern":{"__proto__":{"polluted":true},"constructor":[true],',
    ),
  );
  const out = parseProject(raw);
  assert.equal({}.polluted, undefined);
  assert.equal(Object.hasOwn(out.pattern, '__proto__'), false);
  assert.equal(Object.keys(out.pattern).length, 17);
});
test('imports are deeply independent from raw input', () => {
  const p = createProject(),
    next = parseProject(p);
  p.pattern.kick[0] = true;
  p.fx.master = 0;
  assert.equal(next.pattern.kick[0], false);
  assert.equal(next.fx.master, 70);
});
test('presets repeat for longer loops and clear other lanes', () => {
  const p = createProject();
  p.length = 32;
  p.pattern.sample[0] = true;
  applyPreset(p, 'house');
  assert.equal(p.pattern.kick[16], true);
  assert.equal(p.pattern.kick[17], false);
  assert.equal(p.pattern.sample[0], false);
  assert.equal(p.bpm, 118);
});
test('swing offsets only offbeats and does not stretch the loop', () => {
  assert.equal(stepTime(0, 120, 55), 0);
  assert.equal(stepTime(1, 120, 50), 0.1875);
  assert.equal(stepTime(2, 120, 50), 0.25);
  assert.equal(stepTime(16, 120, 50), 2);
});
test('notes roundtrip with sharps and reject malformed names', () => {
  for (let i = 12; i < 96; i++) assert.equal(midi(noteName(i)), i);
  for (const n of ['C8', 'A-1', '<C2>', 'foo', 'C2junk']) assert.throws(() => midi(n));
});
test('WAV header, stereo interleave and clipping are correct', () => {
  const data = encodeWav({
      numberOfChannels: 2,
      length: 3,
      sampleRate: 44100,
      getChannelData: (i) => (i ? new Float32Array([0.5, -0.5, 0]) : new Float32Array([2, -2, 1])),
    }),
    v = new DataView(data);
  assert.equal(new TextDecoder().decode(data.slice(0, 4)), 'RIFF');
  assert.equal(v.getUint32(24, true), 44100);
  assert.equal(v.getUint32(40, true), 12);
  assert.equal(v.getInt16(44, true), 32767);
  assert.equal(v.getInt16(46, true), 16383);
  assert.equal(v.getInt16(48, true), -32768);
  assert.equal(v.getInt16(50, true), -16384);
});
