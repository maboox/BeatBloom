import { openDB } from 'idb';
import { parseProject } from './model.js';
export const PROJECT_KEY = 'beatbloom-project';
let database;
const db = () =>
  (database ??= openDB('beatbloom-samples', 1, {
    upgrade(db) {
      db.createObjectStore('slots');
    },
    blocked() {
      database = undefined;
    },
  }));
export async function writeSample(i, blob, name) {
  return (await db()).put('slots', { blob, name }, i);
}
export async function readSamples() {
  const d = await db();
  return Promise.all([0, 1, 2, 3].map((i) => d.get('slots', i)));
}
export async function deleteSample(i) {
  return (await db()).delete('slots', i);
}
export async function replaceSamples(samples) {
  const d = await db(),
    tx = d.transaction('slots', 'readwrite');
  for (let i = 0; i < 4; i++) {
    const s = samples[i];
    if (s.blob) tx.store.put({ blob: s.blob, name: s.name }, i);
    else tx.store.delete(i);
  }
  await tx.done;
}
export function saveProject(p) {
  localStorage.setItem(PROJECT_KEY, JSON.stringify(p));
}
export function loadProject() {
  const s = localStorage.getItem(PROJECT_KEY);
  return s ? parseProject(JSON.parse(s)) : null;
}
export async function eraseLocalData() {
  await (await db()).clear('slots');
  localStorage.removeItem(PROJECT_KEY);
  localStorage.removeItem('beatbloom-sampler-settings');
}
