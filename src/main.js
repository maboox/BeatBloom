import './style.css';
import {
  createIcons,
  AudioLines,
  CircleHelp,
  Languages,
  CodeXml,
  Play,
  Pause,
  Square,
  Circle,
  Download,
  Undo2,
  Redo2,
  Shuffle,
  Eraser,
  Piano,
  Guitar,
  Mic,
  Upload,
  ShieldCheck,
  SlidersHorizontal,
  Sunset,
  Disc3,
  Sparkles,
  Wind,
  FolderOpen,
  Save,
  FileDown,
  FileUp,
  HardDrive,
  Lightbulb,
  X,
  Trash2,
} from 'lucide';
import {
  TRACKS,
  LENGTHS,
  PRESETS,
  FX_LIMITS,
  createProject,
  parseProject,
  applyPreset,
  midi,
  noteName,
  sampleLane,
} from './model.js';
import { AudioEngine, Transport, renderWav } from './audio.js';
import * as storage from './storage.js';
import { language, setLanguage, tr } from './i18n.js';
const icons = {
  AudioLines,
  CircleHelp,
  Languages,
  CodeXml,
  Play,
  Pause,
  Square,
  Circle,
  Download,
  Undo2,
  Redo2,
  Shuffle,
  Eraser,
  Piano,
  Guitar,
  Mic,
  Upload,
  ShieldCheck,
  SlidersHorizontal,
  Sunset,
  Disc3,
  Sparkles,
  Wind,
  FolderOpen,
  Save,
  FileDown,
  FileUp,
  HardDrive,
  Lightbulb,
  X,
  Trash2,
};
const $ = (id) => document.getElementById(id),
  $$ = (s) => document.querySelectorAll(s);
const iconize = () => createIcons({ icons });
let p = createProject();
applyPreset(p, 'house');
let engine,
  transport,
  recording = false,
  dirty = false,
  group = 'all',
  noteLane = 'notes',
  preset = 'house',
  undo = [],
  redo = [],
  toastTimer,
  loadingSamples = true,
  busy = false;
const samples = Array.from({ length: 4 }, () => ({
  buffer: null,
  blob: null,
  name: '',
  loopSource: null,
}));
const MAX_AUDIO = 20 * 1024 * 1024,
  MAX_DURATION = 30,
  MAX_PROJECT = 114 * 1024 * 1024;
function notify(message) {
  $('toast').textContent = message;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 4000);
}
function safe(handler) {
  return async (...args) => {
    try {
      await handler(...args);
    } catch (error) {
      console.error(error.name, error.message);
      notify(
        tr(
          'That did not work. Check the file or browser permissions and try again.',
          'عملیات انجام نشد. فایل یا دسترسی مرورگر را بررسی و دوباره تلاش کن.',
        ),
      );
    }
  };
}
function changed() {
  dirty = true;
  $('saveStatus').textContent = tr('Unsaved changes', 'تغییرات ذخیره نشده');
}
function checkpoint() {
  undo.push(structuredClone(p));
  if (undo.length > 50) undo.shift();
  redo = [];
  updateHistory();
}
function updateHistory() {
  $('undo').disabled = !undo.length;
  $('redo').disabled = !redo.length;
}
function mutate(fn, { rebuild = false } = {}) {
  checkpoint();
  fn();
  preset = 'custom';
  changed();
  if (rebuild) render();
  else renderSteps();
}
function history(back) {
  const from = back ? undo : redo,
    to = back ? redo : undo;
  if (!from.length) return;
  to.push(structuredClone(p));
  stop();
  p = from.pop();
  preset = 'custom';
  changed();
  render();
  updateHistory();
  engine?.setFx(p.fx);
}
function renderSteps() {
  $$('.step').forEach((b) => {
    const active = p.pattern[b.dataset.track][+b.dataset.step];
    b.classList.toggle('on', active);
    b.setAttribute('aria-pressed', String(active));
  });
  $('pattern').value = preset;
}
function visible(t) {
  return (
    group === 'all' ||
    (group === 'samples'
      ? t.id.startsWith('sample')
      : group === 'melody'
        ? ['bass', 'chord', 'lead', 'pluck', 'guitar'].includes(t.id)
        : !['bass', 'chord', 'lead', 'pluck', 'guitar'].includes(t.id) &&
          !t.id.startsWith('sample'))
  );
}
function render() {
  $('sequencer').style.setProperty('--steps', p.length);
  $('sequencer').style.minWidth = Math.max(700, 140 + p.length * 34) + 'px';
  $('ruler').innerHTML =
    '<span>SOUND / STEP</span>' +
    Array.from(
      { length: p.length },
      (_, i) =>
        `<span class="${i % 4 === 0 ? 'beat' : ''}">${String(i + 1).padStart(2, '0')}</span>`,
    ).join('');
  $('tracks').innerHTML = TRACKS.map(
    (t) =>
      `<div class="track ${p.muted[t.id] ? 'muted' : ''}" data-lane="${t.id}" style="--tone:${t.tone}" ${visible(t) ? '' : 'hidden'}><div class="track-label"><button class="track-mute" data-mute="${t.id}" aria-label="${tr('Mute', 'قطع صدای')} ${t.name}" aria-pressed="${p.muted[t.id]}" title="${t.sub}"><span class="lane-icon"></span><span>${t.name}</span></button><input class="track-volume" type="range" min="0" max="100" value="${p.vol[t.id] * 100}" data-volume="${t.id}" aria-label="${t.name} volume"></div>${Array.from({ length: p.length }, (_, i) => `<button class="step ${i % 4 < 2 ? 'beat' : ''}" data-track="${t.id}" data-step="${i}" aria-label="${t.name} step ${i + 1}" aria-pressed="false"></button>`).join('')}</div>`,
  ).join('');
  $('notes').innerHTML =
    '<select id="noteLane" aria-label="Instrument note lane"><option value="notes">Bass / Chord</option><option value="leadNotes">Lead</option><option value="pluckNotes">Pluck</option><option value="guitarNotes">Guitar</option></select>';
  $('noteLane').value = noteLane;
  $('noteLane').onchange = (e) => {
    noteLane = e.target.value;
    render();
  };
  for (let i = 0; i < p.length; i++) {
    const select = document.createElement('select');
    select.className = 'note';
    select.dataset.note = i;
    select.setAttribute('aria-label', `Melody note step ${i + 1}`);
    const current = p[noteLane][i] ?? noteName((midi(p.notes[i]) % 12) + 60);
    for (let n = 12; n <= 107; n++) {
      const note = noteName(n);
      select.add(new Option(note, note, false, note === current));
    }
    $('notes').append(select);
  }
  $('bpm').value = p.bpm;
  $('swing').value = p.swing;
  $('swingV').textContent = p.swing + '%';
  $('loopLength').value = p.length;
  $('stepCount').textContent = p.length + ' ' + tr('STEPS', 'مرحله');
  $('projectName').value = p.name;
  for (const k of Object.keys(FX_LIMITS)) {
    $(k).value = p.fx[k];
    fxValue(k);
  }
  renderSteps();
  renderSamples();
  updateHistory();
}
function renderSamples() {
  // Filenames and saved names are untrusted: insert them only with textContent.
  $('sampleSlots').replaceChildren();
  samples.forEach((s, i) => {
    const cfg = p.sampleSettings[i],
      card = document.createElement('div');
    card.className = 'sample-slot' + (p.activeSample === i ? ' selected' : '');
    card.innerHTML = `<div class="slot-header"><button class="slot-select" data-select="${i}" aria-label="Select sample ${i + 1}" aria-pressed="${p.activeSample === i}">${tr('SLOT', 'اسلات')} 0${i + 1}</button><button class="icon-button small" data-delete="${i}" aria-label="Delete sample ${i + 1}" ${!s.buffer ? 'disabled' : ''}><i data-lucide="trash-2"></i></button></div><p class="slot-name"></p><p class="slot-detail"></p><div class="slot-actions"><button data-sample="${i}" ${!s.buffer ? 'disabled' : ''}>${s.loopSource ? tr('Stop', 'توقف') : tr('Play', 'پخش')}</button><button data-loop="${i}" class="${cfg.loop ? 'on' : ''}" aria-pressed="${cfg.loop}">${cfg.loop ? 'Loop' : '1-shot'}</button><button data-overlap="${i}" class="${cfg.overlap ? 'on' : ''}" aria-pressed="${cfg.overlap}">${cfg.overlap ? 'Stack' : 'Mono'}</button></div>`;
    card.querySelector('.slot-name').textContent =
      s.name || tr('Your sound goes here', 'جای صدای تو');
    card.querySelector('.slot-name').title = s.name;
    card.querySelector('.slot-detail').textContent = s.buffer
      ? `${s.buffer.duration.toFixed(1)}s · S${i + 1}`
      : tr('Record or import audio', 'صدا ضبط یا وارد کن');
    $('sampleSlots').append(card);
  });
  iconize();
}
let audioPromise;
async function audio() {
  if (audioPromise) return audioPromise;
  audioPromise = (async () => {
    if (!engine) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('Web Audio is unavailable');
      engine = new AudioEngine(new Audio(), p.fx, samples);
      transport = new Transport(engine, () => p, showStep, onPlayState);
      engine.ctx.onstatechange = () => {
        if (engine.ctx.state === 'suspended' && transport.playing) stop();
      };
    }
    if (engine.ctx.state === 'suspended') await engine.ctx.resume();
    $('audioStatus').textContent = tr('Audio ready · on device', 'صدا آماده است · روی دستگاه');
    return engine;
  })();
  try {
    return await audioPromise;
  } finally {
    audioPromise = null;
  }
}
function onPlayState(playing) {
  $('play').setAttribute('aria-label', playing ? tr('Pause', 'مکث') : tr('Play', 'پخش'));
  $('play').innerHTML = `<i data-lucide="${playing ? 'pause' : 'play'}"></i>`;
  iconize();
  if (!playing) {
    recording = false;
    updateRecord();
  }
  drawScope();
}
function updateRecord() {
  $('record').classList.toggle('active', recording);
  $('record').setAttribute('aria-pressed', String(recording));
}
function stop() {
  transport?.pause(true);
  recording = false;
  updateRecord();
  samples.forEach((s) => (s.loopSource = null));
  renderSamples();
  showStep(-1, 0);
}
async function togglePlay() {
  await audio();
  if (transport.playing) transport.pause();
  else transport.play();
}
function showStep(i, seconds) {
  $$('.step.playing').forEach((b) => b.classList.remove('playing'));
  if (i >= 0) $$(`.step[data-step="${i}"]`).forEach((b) => b.classList.add('playing'));
  const min = Math.floor(seconds / 60),
    sec = Math.floor(seconds % 60),
    cs = Math.floor((seconds % 1) * 100);
  $('time').textContent =
    `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}
function capture(id, note) {
  if (!recording || !transport?.playing) return;
  const i = transport.recordIndex();
  checkpoint();
  p.pattern[id][i] = true;
  if (note) {
    if (id === 'guitar') p.guitarNotes[i] = note;
    else if (id === 'lead') p.leadNotes[i] = note;
    else if (id === 'pluck') p.pluckNotes[i] = note;
    else p.notes[i] = note;
  }
  changed();
  renderSteps();
  const sel = $('notes').querySelector(`[data-note="${i}"]`);
  if (sel) sel.value = p[noteLane][i] ?? noteName((midi(p.notes[i]) % 12) + 60);
}
async function hit(id, node, note) {
  await audio();
  engine.trigger(id, engine.ctx.currentTime, p, 0, note);
  drawScope();
  capture(id, note);
  if (node) {
    node.classList.add('hit', 'active');
    setTimeout(() => node.classList.remove('hit', 'active'), 140);
  }
}
async function triggerSample(i) {
  await audio();
  const s = samples[i];
  if (!s.buffer) return;
  const cfg = p.sampleSettings[i];
  p.activeSample = i;
  if (cfg.loop && s.loopSource) {
    engine.stopSlot(i);
    s.loopSource = null;
  } else {
    const source = engine.sample(i, engine.ctx.currentTime, cfg, {
      loop: cfg.loop,
      amount: p.vol[sampleLane(i)],
    });
    if (cfg.loop) {
      s.loopSource = source;
      source.addEventListener('ended', () => {
        if (s.loopSource === source) s.loopSource = null;
        renderSamples();
      });
    }
    capture(sampleLane(i));
  }
  renderSamples();
  drawScope();
}
function fxValue(id) {
  $(id + 'V').textContent =
    id === 'filter' ? (p.fx[id] / 1000).toFixed(1) + ' kHz' : p.fx[id] + '%';
}
function initUi() {
  for (const [id, pr] of Object.entries(PRESETS)) $('pattern').add(new Option(pr.name, id));
  const padKeys = ['q', 'w', 'e', 'r', 'a', 's', 't', 'y', 'u', 'i', 'd', 'f'];
  const padIds = [
    'kick',
    'snare',
    'hat',
    'clap',
    'bass',
    'chord',
    'tom',
    'shaker',
    'cowbell',
    'perc',
    'lead',
    'pluck',
  ];
  $('pads').innerHTML = padIds
    .map((id, i) => {
      const t = TRACKS.find((t) => t.id === id);
      return `<button class="pad" style="--tone:${t.tone}" data-pad="${id}" aria-label="Play ${t.name}"><span class="pad-title">${t.name}</span><small>${padKeys[i].toUpperCase()}</small></button>`;
    })
    .join('');
  let white = 0;
  for (let m = 48; m <= 72; m++) {
    const n = noteName(m),
      b = document.createElement('button');
    b.className = 'key' + (n.includes('#') ? ' black' : '');
    b.dataset.key = n;
    b.textContent = n;
    b.setAttribute('aria-label', `Play ${n}`);
    if (n.includes('#')) b.style.left = `${(white / 15) * 100 - 2.15}%`;
    else white++;
    $('keyboard').append(b);
  }
  for (const m of [40, 45, 50, 55, 59, 64]) {
    const row = document.createElement('div');
    row.className = 'guitar-string';
    row.innerHTML =
      `<span>${noteName(m)}</span>` +
      Array.from(
        { length: 9 },
        (_, i) =>
          `<button class="fret" data-guitar="${noteName(m + i)}" aria-label="Guitar ${noteName(m + i)} fret ${i}">${i || '○'}</button>`,
      ).join('');
    $('guitarboard').append(row);
  }
  $('fxControls').innerHTML = Object.entries(FX_LIMITS)
    .map(
      ([id, [min, max, value]]) =>
        `<div class="slider-row"><div class="slider-label"><label for="${id}" data-i18n="${id}">${id[0].toUpperCase() + id.slice(1)}</label><output id="${id}V"></output></div><input id="${id}" type="range" min="${min}" max="${max}" value="${value}"></div>`,
    )
    .join('');
  iconize();
  render();
}
initUi();
$('tracks').addEventListener(
  'click',
  safe(async (e) => {
    const b = e.target.closest('.step'),
      m = e.target.closest('[data-mute]');
    if (b) {
      const id = b.dataset.track,
        i = +b.dataset.step;
      mutate(() => (p.pattern[id][i] = !p.pattern[id][i]));
      if (p.pattern[id][i]) {
        await audio();
        engine.trigger(id, engine.ctx.currentTime, p, i);
      }
    }
    if (m) {
      mutate(() => (p.muted[m.dataset.mute] = !p.muted[m.dataset.mute]), { rebuild: true });
    }
  }),
);
$('tracks').addEventListener('change', (e) => {
  const id = e.target.dataset.volume;
  if (id) mutate(() => (p.vol[id] = +e.target.value / 100));
});
$('notes').addEventListener('change', (e) => {
  if (e.target.dataset.note !== undefined)
    mutate(() => (p[noteLane][+e.target.dataset.note] = e.target.value));
});
$$('[data-group]').forEach(
  (b) =>
    (b.onclick = () => {
      group = b.dataset.group;
      $$('[data-group]').forEach((n) => {
        n.classList.toggle('active', n === b);
        n.setAttribute('aria-pressed', String(n === b));
      });
      render();
    }),
);
$('play').onclick = safe(togglePlay);
$('stop').onclick = stop;
$('record').onclick = safe(async () => {
  await audio();
  recording = !recording;
  updateRecord();
  if (recording && !transport.playing) transport.play();
  notify(
    recording
      ? tr('Recording into the pattern. Play a sound.', 'ضبط الگو فعال شد؛ حالا بنواز.')
      : tr('Pattern recording stopped.', 'ضبط الگو متوقف شد.'),
  );
});
$('undo').onclick = () => history(true);
$('redo').onclick = () => history(false);
$('loopLength').onchange = (e) => {
  const n = +e.target.value;
  if (!LENGTHS.includes(n)) return;
  stop();
  mutate(() => (p.length = n), { rebuild: true });
};
$('pattern').onchange = (e) => {
  if (!PRESETS[e.target.value]) return;
  const id = e.target.value;
  stop();
  checkpoint();
  applyPreset(p, id);
  preset = id;
  changed();
  render();
};
$('randomize').onclick = () =>
  mutate(() => {
    for (const t of TRACKS) {
      if (
        t.id.startsWith('sample') &&
        !samples[t.id === 'sample' ? 0 : Number(t.id.slice(6)) - 1].buffer
      )
        continue;
      p.pattern[t.id] = Array.from(
        { length: 32 },
        (_, i) =>
          Math.random() <
          (t.id === 'kick'
            ? i % 4 === 0
              ? 0.9
              : 0.1
            : t.id === 'snare'
              ? i % 8 === 4
                ? 0.95
                : 0.04
              : ['hat', 'shaker'].includes(t.id)
                ? 0.45
                : 0.15),
      );
    }
  });
$('clear').onclick = () => {
  if (
    !confirm(
      tr(
        'Clear all pattern steps? You can undo this.',
        'همهٔ خانه‌ها پاک شوند؟ امکان بازگشت وجود دارد.',
      ),
    )
  )
    return;
  mutate(() => TRACKS.forEach((t) => p.pattern[t.id].fill(false)));
};
$('bpm').onchange = (e) => {
  const n = Number(e.target.value);
  mutate(() => (p.bpm = Math.min(190, Math.max(60, Number.isFinite(n) && n ? n : 118))));
  e.target.value = p.bpm;
};
$('swing').onchange = (e) =>
  mutate(() => {
    p.swing = +e.target.value;
    $('swingV').textContent = p.swing + '%';
  });
$('swing').oninput = (e) => ($('swingV').textContent = e.target.value + '%');
for (const id of Object.keys(FX_LIMITS)) {
  $(id).addEventListener('pointerdown', () => checkpoint());
  $(id).addEventListener('keydown', (e) => {
    if (e.key.startsWith('Arrow')) checkpoint();
  });
  $(id).oninput = () => {
    p.fx[id] = +$(id).value;
    engine?.setFx(p.fx);
    fxValue(id);
    changed();
  };
}
$$('[data-scene]').forEach(
  (b) =>
    (b.onclick = () => {
      const values = {
        sunset: [5200, 22, 38],
        club: [10500, 9, 12],
        space: [3200, 34, 58],
        dry: [14000, 0, 0],
      }[b.dataset.scene];
      checkpoint();
      ['filter', 'delay', 'space'].forEach((id, i) => (p.fx[id] = values[i]));
      engine?.setFx(p.fx);
      changed();
      render();
      $$('[data-scene]').forEach((n) => n.classList.toggle('active', n === b));
    }),
);
$('pads').onclick = safe((e) => {
  const b = e.target.closest('[data-pad]');
  if (b) return hit(b.dataset.pad, b);
});
$('keyboard').onclick = safe((e) => {
  const b = e.target.closest('[data-key]');
  if (b) return hit('lead', b, b.dataset.key);
});
$('guitarboard').onclick = safe((e) => {
  const b = e.target.closest('[data-guitar]');
  if (b) return hit('guitar', b, b.dataset.guitar);
});
$$('[data-inst]').forEach(
  (b) =>
    (b.onclick = () => {
      const guitar = b.dataset.inst === 'guitar';
      $('keyboard').parentElement.hidden = guitar;
      $('guitarboard').hidden = !guitar;
      $$('[data-inst]').forEach((n) => {
        n.classList.toggle('active', n === b);
        n.setAttribute('aria-pressed', String(n === b));
      });
    }),
);
$('help').onclick = () => $('helpDialog').showModal();
document.querySelector('.dialog-close').onclick = () => $('helpDialog').close();
$('language').onclick = () => {
  setLanguage(language === 'en' ? 'fa' : 'en');
  $('language').textContent = language === 'fa' ? 'English' : 'فارسی';
  render();
  if (dirty) changed();
  try {
    localStorage.setItem('beatbloom-language', language);
  } catch {}
};
const pianoCodes = [
  'KeyZ',
  'KeyS',
  'KeyX',
  'KeyD',
  'KeyC',
  'KeyV',
  'KeyG',
  'KeyB',
  'KeyH',
  'KeyN',
  'KeyJ',
  'KeyM',
];
const padCodes = {
  KeyQ: 'kick',
  KeyW: 'snare',
  KeyE: 'hat',
  KeyR: 'clap',
  KeyT: 'tom',
  KeyY: 'shaker',
  KeyU: 'cowbell',
  KeyI: 'perc',
  KeyA: 'bass',
  KeyS: 'chord',
  KeyD: 'lead',
  KeyF: 'pluck',
};
window.addEventListener(
  'keydown',
  safe(async (e) => {
    if (e.repeat || e.isComposing || $('helpDialog').open) return;
    const typing = e.target.closest('input,select,textarea,[contenteditable="true"]');
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
      e.preventDefault();
      await save();
      return;
    }
    if (typing) return;
    if (e.ctrlKey || e.metaKey) {
      if (e.code === 'KeyZ') {
        e.preventDefault();
        history(!e.shiftKey);
      }
      return;
    }
    if (e.altKey) return;
    if (e.code === 'Space') {
      if (e.target.closest('button,a')) return;
      e.preventDefault();
      await togglePlay();
      return;
    }
    const sample = /^Digit([1-4])$/.exec(e.code);
    if (sample) {
      e.preventDefault();
      await triggerSample(+sample[1] - 1);
      return;
    }
    const index = pianoCodes.indexOf(e.code);
    if (($('keyboardMode').checked || e.shiftKey) && index >= 0) {
      e.preventDefault();
      const note = noteName(48 + index + (e.shiftKey ? 12 : 0));
      await hit('lead', document.querySelector(`[data-key="${note}"]`), note);
      return;
    }
    const id = padCodes[e.code];
    if (id && !$('keyboardMode').checked) {
      e.preventDefault();
      await hit(id, document.querySelector(`[data-pad="${id}"]`));
    }
  }),
);
$('projectName').onchange = (e) =>
  mutate(() => (p.name = e.target.value.trim().slice(0, 80) || 'Untitled session'));
async function save() {
  storage.saveProject(p);
  dirty = false;
  $('saveStatus').textContent = tr('Saved in this browser', 'در این مرورگر ذخیره شد');
  notify(
    tr(
      'Session saved here. Download a project for a portable backup.',
      'جلسه اینجا ذخیره شد. برای نسخهٔ همراه صداها، فایل پروژه را دانلود کن.',
    ),
  );
}
$('save').onclick = safe(save);
const discard = () =>
  !dirty ||
  confirm(
    tr(
      'Replace unsaved changes? Download a project first if you want to keep them.',
      'تغییرات ذخیره‌نشده جایگزین شوند؟ برای نگه‌داشتنشان ابتدا فایل پروژه را دانلود کن.',
    ),
  );
$('load').onclick = safe(() => {
  const saved = storage.loadProject();
  if (!saved) {
    notify(tr('No saved session in this browser yet.', 'هنوز جلسه‌ای در این مرورگر ذخیره نشده.'));
    return;
  }
  if (!discard()) return;
  checkpoint();
  stop();
  p = saved;
  preset = 'custom';
  dirty = false;
  engine?.setFx(p.fx);
  render();
  $('saveStatus').textContent = tr('Saved session loaded', 'جلسهٔ ذخیره‌شده بازیابی شد');
});
function download(name, data, type) {
  const blob = new Blob([data], { type }),
    url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
const filename = (ext) =>
  (p.name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').slice(0, 70) || 'beatbloom') + ext;
const blobData = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
$('downloadProject').onclick = safe(async () => {
  if (loadingSamples || busy) {
    notify(tr('Please wait for audio to finish loading.', 'صبر کن تا بارگذاری صدا تمام شود.'));
    return;
  }
  const project = structuredClone(p);
  project.samples = await Promise.all(
    samples.map(async (s) =>
      s.blob ? { name: s.name, type: s.blob.type, data: await blobData(s.blob) } : null,
    ),
  );
  download(filename('.beatbloom'), JSON.stringify(project), 'application/json');
  notify(tr('Project downloaded, including your samples.', 'پروژه همراه با سمپل‌ها دانلود شد.'));
});
$('importProject').onclick = () => $('projectUpload').click();
async function decode(blob, name) {
  if (!(blob instanceof Blob) || !blob.size || blob.size > MAX_AUDIO)
    throw new Error('Audio must be 1 byte to 20 MB');
  const decoder = new OfflineAudioContext(1, 1, 44100);
  const buffer = await decoder.decodeAudioData(await blob.arrayBuffer());
  if (
    !Number.isFinite(buffer.duration) ||
    buffer.duration > MAX_DURATION ||
    buffer.numberOfChannels > 2
  )
    throw new Error('Audio must be at most 30 seconds and stereo');
  return { buffer, blob, name: String(name || 'Sample').slice(0, 120), loopSource: null };
}
$('projectUpload').onchange = safe(async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file || busy) return;
  if (file.size > MAX_PROJECT) throw new Error('Project exceeds size limit');
  const raw = JSON.parse(await file.text()),
    next = parseProject(raw);
  let decoded;
  if (raw.samples !== undefined) {
    if (!Array.isArray(raw.samples) || raw.samples.length !== 4) throw new Error('Invalid samples');
    decoded = [];
    for (const s of raw.samples) {
      if (s === null) {
        decoded.push({ buffer: null, blob: null, name: '', loopSource: null });
        continue;
      }
      if (
        !s ||
        typeof s.data !== 'string' ||
        s.data.length > Math.ceil(MAX_AUDIO / 3) * 4 ||
        !/^[A-Za-z0-9+/]*={0,2}$/.test(s.data)
      )
        throw new Error('Invalid sample data');
      const binary = atob(s.data),
        bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      decoded.push(
        await decode(
          new Blob([bytes], { type: typeof s.type === 'string' ? s.type.slice(0, 80) : '' }),
          s.name,
        ),
      );
    }
  }
  if (!discard()) return;
  busy = true;
  try {
    if (decoded) await storage.replaceSamples(decoded);
    stop();
    undo = [];
    redo = [];
    if (decoded) decoded.forEach((s, i) => Object.assign(samples[i], s));
    p = next;
    preset = 'custom';
    engine?.setFx(p.fx);
    changed();
    render();
    notify(
      decoded
        ? tr('Project and samples opened.', 'پروژه و سمپل‌ها باز شدند.')
        : tr(
            'Legacy project opened. Sample audio uses this browser’s slots.',
            'پروژهٔ قدیمی باز شد. صداها از اسلات‌های همین مرورگر استفاده می‌شوند.',
          ),
    );
  } finally {
    busy = false;
  }
});
$('export').onclick = safe(async () => {
  if (loadingSamples || busy) return;
  $('export').disabled = true;
  try {
    notify(tr('Rendering your loop…', 'در حال ساخت لوپ…'));
    const snapshot = structuredClone(p),
      data = await renderWav(
        snapshot,
        samples.map((s) => ({ ...s })),
        { tail: $('exportTail').checked },
      );
    download(filename('.wav'), data, 'audio/wav');
    notify(
      tr(
        'WAV ready. Same instruments, samples and effects.',
        'WAV آماده شد؛ با همان سازها، سمپل‌ها و افکت‌ها.',
      ),
    );
  } finally {
    $('export').disabled = false;
  }
});
$('sampleSlots').onclick = safe(async (e) => {
  for (const key of ['select', 'sample', 'loop', 'overlap', 'delete']) {
    const b = e.target.closest(`[data-${key}]`);
    if (!b) continue;
    const i = +b.dataset[key];
    if (key === 'select') {
      p.activeSample = i;
      renderSamples();
    }
    if (key === 'sample') await triggerSample(i);
    if (key === 'loop' || key === 'overlap') {
      mutate(() => (p.sampleSettings[i][key] = !p.sampleSettings[i][key]));
      engine?.stopSlot(i);
      samples[i].loopSource = null;
      renderSamples();
    }
    if (
      key === 'delete' &&
      confirm(
        tr(
          'Delete this sample from this browser? This cannot be undone.',
          'این سمپل از مرورگر پاک شود؟ این کار قابل بازگشت نیست.',
        ),
      )
    ) {
      await storage.deleteSample(i);
      engine?.stopSlot(i);
      Object.assign(samples[i], { buffer: null, blob: null, name: '', loopSource: null });
      changed();
      renderSamples();
    }
  }
});
$('importAudio').onclick = () => $('sampleUpload').click();
async function assignSample(i, blob, name) {
  const next = await decode(blob, name);
  await storage.writeSample(i, next.blob, next.name);
  engine?.stopSlot(i);
  Object.assign(samples[i], next);
  changed();
  renderSamples();
  notify(tr('Sound ready in slot ', 'صدا آماده شد در اسلات ') + (i + 1));
}
$('sampleUpload').onchange = safe(async (e) => {
  const file = e.target.files[0],
    i = p.activeSample;
  e.target.value = '';
  if (!file || busy) return;
  busy = true;
  try {
    await assignSample(i, file, file.name);
  } finally {
    busy = false;
  }
});
$('sampleStop').onclick = () => {
  samples.forEach((s, i) => {
    engine?.stopSlot(i);
    s.loopSource = null;
  });
  renderSamples();
};
let recorder,
  stream,
  micPending = false,
  micTimer,
  micClock;
function releaseMic() {
  clearTimeout(micTimer);
  clearInterval(micClock);
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  micPending = false;
  $('micRecord').classList.remove('mic-live');
  $('micRecord').innerHTML =
    '<i data-lucide="mic"></i><span>' + tr('Record microphone', 'ضبط میکروفن') + '</span>';
  $('micStatus').textContent = tr(
    'Up to 20 MB / 30 seconds per slot',
    'هر اسلات: تا ۲۰ مگابایت / ۳۰ ثانیه',
  );
  iconize();
}
$('micRecord').onclick = safe(async () => {
  if (recorder?.state === 'recording') {
    recorder.stop();
    return;
  }
  if (micPending || busy) return;
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    notify(
      tr(
        'Microphone needs HTTPS or localhost and a supported browser.',
        'برای میکروفن از HTTPS یا localhost و مرورگر سازگار استفاده کن.',
      ),
    );
    return;
  }
  micPending = true;
  busy = true;
  const index = p.activeSample;
  let chunks = [],
    bytes = 0;
  try {
    await audio();
    stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
    if (document.hidden) throw new Error('Recording cancelled while hidden');
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size) {
        bytes += e.data.size;
        chunks.push(e.data);
        if (bytes > MAX_AUDIO && recorder.state === 'recording') recorder.stop();
      }
    };
    recorder.onerror = () => {
      releaseMic();
      busy = false;
      notify(tr('Microphone recording failed.', 'ضبط میکروفن انجام نشد.'));
    };
    recorder.onstop = safe(async () => {
      const blob = new Blob(chunks, { type: recorder.mimeType });
      releaseMic();
      busy = true;
      try {
        await assignSample(
          index,
          blob,
          'Voice ' + new Date().toLocaleTimeString(language === 'fa' ? 'fa-IR' : 'en-US'),
        );
      } finally {
        busy = false;
      }
    });
    recorder.start(200);
    micPending = false;
    $('micRecord').classList.add('mic-live');
    $('micRecord').textContent = tr('Stop recording', 'پایان ضبط');
    let sec = 0;
    $('micStatus').textContent = tr('Recording slot ', 'ضبط اسلات ') + (index + 1) + ' · 0s';
    micClock = setInterval(() => {
      $('micStatus').textContent =
        tr('Recording slot ', 'ضبط اسلات ') + (index + 1) + ` · ${++sec}s / 30s`;
    }, 1000);
    micTimer = setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, 29500);
  } catch (error) {
    releaseMic();
    busy = false;
    throw error;
  }
});
$('eraseData').onclick = safe(async () => {
  if (
    !confirm(
      tr(
        'Erase the saved session and all four samples from this browser? Download a backup first. This cannot be undone.',
        'جلسهٔ ذخیره‌شده و چهار سمپل از این مرورگر پاک شوند؟ ابتدا نسخهٔ پشتیبان بگیر. این کار قابل بازگشت نیست.',
      ),
    )
  )
    return;
  stop();
  await storage.eraseLocalData();
  samples.forEach((s) =>
    Object.assign(s, { buffer: null, blob: null, name: '', loopSource: null }),
  );
  dirty = true;
  renderSamples();
  $('saveStatus').textContent = tr(
    'Saved data erased · current pattern stays in memory',
    'ذخیره‌ها پاک شدند؛ الگو هنوز در حافظه است',
  );
  notify(
    tr(
      'Saved project and audio erased from this browser.',
      'پروژهٔ ذخیره‌شده و صداها از این مرورگر پاک شدند.',
    ),
  );
});
window.addEventListener('beforeunload', (e) => {
  if (dirty || busy || micPending) {
    e.preventDefault();
    e.returnValue = '';
  }
});
window.addEventListener('pagehide', () => {
  if (recorder?.state === 'recording') {
    recorder.onstop = null;
    recorder.stop();
  }
  releaseMic();
  transport?.pause(true);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (transport?.playing) stop();
    samples.forEach((s, i) => {
      engine?.stopSlot(i);
      s.loopSource = null;
    });
    if (recorder?.state === 'recording') recorder.stop();
  }
});
let scopeFrame;
function drawScope() {
  cancelAnimationFrame(scopeFrame);
  const canvas = $('scope'),
    c = canvas.getContext('2d'),
    reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const draw = () => {
    c.clearRect(0, 0, canvas.width, canvas.height);
    const a = new Uint8Array(64);
    if (engine) engine.analyser.getByteFrequencyData(a);
    const active = transport?.playing || engine?.voices.size > 0;
    for (let i = 0; i < 48; i++) {
      const h = active
        ? Math.max(4, (a[i] / 255) * 150)
        : 8 + Math.sin(i * 0.45) ** 2 * 35 + Math.sin(i * 1.7) ** 2 * 22;
      const x = i * 12.5;
      c.fillStyle = i > 35 ? '#c8a16d' : '#ff914d';
      c.globalAlpha = active ? 0.65 : 0.22;
      c.beginPath();
      c.roundRect(x, 100 - h / 2, 6, h, 3);
      c.fill();
    }
    if (active && !reduced && !document.hidden) scopeFrame = requestAnimationFrame(draw);
  };
  draw();
}
drawScope();
// Decode stored audio without asking for microphone access or rewriting IndexedDB.
(async () => {
  try {
    const stored = await storage.readSamples();
    for (let i = 0; i < 4; i++)
      if (stored[i]) {
        try {
          Object.assign(samples[i], await decode(stored[i].blob, stored[i].name));
        } catch {
          notify(
            tr(
              'A saved sample could not be loaded. Import it again.',
              'یک سمپل ذخیره‌شده بارگذاری نشد؛ دوباره واردش کن.',
            ),
          );
        }
      }
  } catch {
    notify(
      tr(
        'Browser storage is unavailable. Download project files to keep your work.',
        'ذخیرهٔ مرورگر در دسترس نیست؛ برای نگه‌داشتن کار، فایل پروژه را دانلود کن.',
      ),
    );
  } finally {
    loadingSamples = false;
    renderSamples();
  }
})();
try {
  const preferred = localStorage.getItem('beatbloom-language');
  if (preferred === 'fa') {
    $('language').click();
  }
} catch {}
