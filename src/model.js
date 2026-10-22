export const TRACKS = [
  ['kick', 'Kick', 'Deep pulse', '#ff914d'],
  ['snare', 'Snare', 'Paper snap', '#ffc078'],
  ['hat', 'Hi-hat', 'Silver air', '#8cbfae'],
  ['clap', 'Clap', 'Wide hands', '#e99b95'],
  ['bass', 'Bass', 'Warm mono', '#b0a2db'],
  ['chord', 'Chord', 'Dream poly', '#8aafdc'],
  ['tom', 'Tom', 'Round drum', '#e2bd6a'],
  ['shaker', 'Shaker', 'Bright sand', '#89c5b4'],
  ['cowbell', 'Cowbell', 'Metal tick', '#e9a780'],
  ['perc', 'Percussion', 'Wood click', '#cba3cc'],
  ['lead', 'Lead', 'Neon voice', '#92bddd'],
  ['pluck', 'Pluck', 'Glass string', '#dea1b6'],
  ['guitar', 'Guitar', 'Picked strings', '#c9ab79'],
  ...Array.from({ length: 4 }, (_, i) => [
    i ? `sample${i + 1}` : 'sample',
    `Sample ${i + 1}`,
    `Audio slot ${i + 1}`,
    '#a6c69c',
  ]),
].map(([id, name, sub, tone]) => ({ id, name, sub, tone }));
export const LENGTHS = [8, 16, 24, 32];
export const NOTE_RE = /^[A-G]#?[0-7]$/;
export const BASE_NOTES = [
  'C2',
  'C2',
  'G1',
  'C2',
  'D#2',
  'C2',
  'G1',
  'A#1',
  'C2',
  'C2',
  'G1',
  'C2',
  'D#2',
  'F2',
  'G2',
  'A#1',
];
export const PRESETS = {
  house: {
    name: 'Neon House',
    bpm: 118,
    kick: [0, 4, 8, 12],
    snare: [4, 12],
    hat: [2, 6, 10, 14],
    clap: [12],
    bass: [0, 3, 6, 8, 11, 14],
    chord: [0, 8],
  },
  chill: {
    name: 'Lo-fi Sunday',
    bpm: 84,
    kick: [0, 7, 10],
    snare: [4, 12],
    hat: [2, 6, 10, 14],
    bass: [0, 3, 8, 11, 14],
    chord: [0, 6, 10],
  },
  trap: {
    name: 'Soft Trap',
    bpm: 140,
    kick: [0, 6, 10, 11],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 7, 8, 10, 12, 14, 15],
    bass: [0, 6, 8, 11, 14],
    chord: [0, 8],
  },
  disco: {
    name: 'Pocket Disco',
    bpm: 120,
    kick: [0, 4, 8, 12],
    snare: [4, 12],
    hat: [2, 6, 10, 14],
    clap: [4, 12],
    bass: [0, 2, 5, 7, 8, 10, 13, 15],
    chord: [0, 4, 8, 12],
  },
  funk: {
    name: 'Midnight Funk',
    bpm: 104,
    kick: [0, 3, 7, 10, 12],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
    bass: [0, 3, 5, 7, 10, 13],
    cowbell: [2, 6, 10, 14],
  },
  afro: {
    name: 'Afro Garden',
    bpm: 112,
    kick: [0, 3, 6, 10, 13],
    snare: [4, 12],
    shaker: [0, 2, 4, 6, 8, 10, 12, 14],
    tom: [7, 11, 15],
    perc: [1, 5, 9, 13],
    bass: [0, 6, 10, 13],
  },
  ambient: {
    name: 'Cloud Ambient',
    bpm: 70,
    kick: [0, 8],
    hat: [6, 14],
    bass: [0, 7, 12],
    chord: [0, 8],
    lead: [3, 11, 15],
    pluck: [2, 6, 10, 14],
  },
  dnb: {
    name: 'Pocket DnB',
    bpm: 172,
    kick: [0, 6, 10],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
    bass: [0, 3, 7, 10, 14],
    lead: [6, 15],
  },
  arcade: {
    name: 'Pixel Arcade',
    bpm: 128,
    kick: [0, 4, 8, 12],
    snare: [4, 12],
    hat: [2, 6, 10, 14],
    bass: [0, 2, 5, 8, 10, 13],
    lead: [0, 3, 6, 9, 12, 15],
    pluck: [1, 5, 9, 13],
  },
  latin: {
    name: 'Latin Spark',
    bpm: 108,
    kick: [0, 6, 10],
    snare: [4, 12],
    shaker: [0, 2, 4, 6, 8, 10, 12, 14],
    cowbell: [3, 7, 11, 15],
    perc: [1, 5, 9, 13],
    tom: [6, 14],
    bass: [0, 5, 8, 11, 14],
  },
};
export const FX_LIMITS = {
  filter: [300, 14000, 9000],
  delay: [0, 55, 16],
  space: [0, 60, 22],
  master: [0, 100, 70],
};
export function createProject() {
  return {
    version: 4,
    name: 'Untitled session',
    length: 16,
    bpm: 118,
    swing: 12,
    pattern: Object.fromEntries(TRACKS.map((t) => [t.id, Array(32).fill(false)])),
    muted: Object.fromEntries(TRACKS.map((t) => [t.id, false])),
    vol: Object.fromEntries(TRACKS.map((t) => [t.id, 0.8])),
    notes: Array.from({ length: 32 }, (_, i) => BASE_NOTES[i % 16]),
    guitarNotes: Array(32).fill('E3'),
    leadNotes: Array(32).fill(null),
    pluckNotes: Array(32).fill(null),
    activeSample: 0,
    sampleSettings: Array.from({ length: 4 }, () => ({ loop: false, overlap: true })),
    fx: Object.fromEntries(Object.entries(FX_LIMITS).map(([k, v]) => [k, v[2]])),
  };
}
const own = (o, k) => Object.hasOwn(o, k);
function finite(value, min, max, fallback) {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new Error('Number out of range');
  return value;
}
// Reconstruct a fresh known-key object. Never merge untrusted JSON into application state.
export function parseProject(input) {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    !input.pattern ||
    typeof input.pattern !== 'object' ||
    Array.isArray(input.pattern)
  )
    throw new Error('Invalid project');
  if (input.version !== undefined && ![1, 2, 3, '3.1', 4].includes(input.version))
    throw new Error('Unsupported project version');
  const p = createProject();
  p.length = input.length ?? 16;
  if (!LENGTHS.includes(p.length)) throw new Error('Invalid loop length');
  p.bpm = finite(input.bpm, 60, 190, 118);
  p.swing = finite(input.swing, 0, 55, 0);
  p.name = typeof input.name === 'string' ? input.name.trim().slice(0, 80) || p.name : p.name;
  for (const t of TRACKS) {
    if (own(input.pattern, t.id)) {
      const a = input.pattern[t.id];
      if (
        !Array.isArray(a) ||
        a.length < p.length ||
        a.length > 32 ||
        a.some((x) => typeof x !== 'boolean')
      )
        throw new Error('Invalid lane');
      p.pattern[t.id] = Array.from({ length: 32 }, (_, i) => a[i] ?? false);
    }
    const mute = input.muted?.[t.id];
    if (mute !== undefined && typeof mute !== 'boolean') throw new Error('Invalid mute state');
    p.muted[t.id] = mute ?? false;
    p.vol[t.id] = finite(input.vol?.[t.id], 0, 1, 0.8);
  }
  for (const key of ['notes', 'guitarNotes'])
    if (input[key] !== undefined) {
      const a = input[key];
      if (
        !Array.isArray(a) ||
        a.length < p.length ||
        a.length > 32 ||
        a.some((n) => typeof n !== 'string' || !NOTE_RE.test(n))
      )
        throw new Error('Invalid notes');
      p[key] = Array.from({ length: 32 }, (_, i) => a[i] ?? p[key][i]);
    }
  for (const key of ['leadNotes', 'pluckNotes'])
    if (input[key] !== undefined) {
      const a = input[key];
      if (
        !Array.isArray(a) ||
        a.length < p.length ||
        a.length > 32 ||
        a.some((n) => n !== null && (typeof n !== 'string' || !NOTE_RE.test(n)))
      )
        throw new Error('Invalid instrument notes');
      p[key] = Array.from({ length: 32 }, (_, i) => a[i] ?? null);
    }
  for (const [k, [min, max, def]] of Object.entries(FX_LIMITS))
    p.fx[k] = finite(input.fx?.[k], min, max, def);
  p.activeSample = finite(input.activeSample, 0, 3, 0);
  if (!Number.isInteger(p.activeSample)) throw new Error('Invalid slot');
  if (input.sampleSettings !== undefined) {
    if (!Array.isArray(input.sampleSettings) || input.sampleSettings.length !== 4)
      throw new Error('Invalid sample settings');
    p.sampleSettings = input.sampleSettings.map((s) => {
      if (!s || typeof s.loop !== 'boolean' || typeof s.overlap !== 'boolean')
        throw new Error('Invalid sample mode');
      return { loop: s.loop, overlap: s.overlap };
    });
  }
  return p;
}
export function applyPreset(p, id) {
  const preset = PRESETS[id];
  if (!preset) return;
  for (const t of TRACKS)
    p.pattern[t.id] = Array.from({ length: 32 }, (_, i) => (preset[t.id] || []).includes(i % 16));
  p.bpm = preset.bpm;
}
export function stepTime(index, bpm, swing) {
  const base = 60 / bpm / 4;
  return (index + (index % 2 ? swing / 100 : 0)) * base;
}
export function midi(note) {
  const m = /^([A-G])(#?)([0-7])$/.exec(note);
  if (!m) throw new Error('Invalid note');
  return (+m[3] + 1) * 12 + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] ? 1 : 0);
}
export function noteName(n) {
  return (
    ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][n % 12] +
    (Math.floor(n / 12) - 1)
  );
}
export const sampleLane = (i) => (i ? `sample${i + 1}` : 'sample');
