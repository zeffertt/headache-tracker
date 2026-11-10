import { useEffect, useState } from 'preact/hooks';
import { DEFAULT_LISTS, DEFAULT_SETTINGS, freshState } from './defaults.js';
import { dateKey } from './dates.js';
import { isLate, newId, openEpisode } from './logic.js';
import { readData, snapshot, writeData } from './platform.js';

let state = freshState();
let loaded = false;
const subs = new Set();
const afterSave = new Set();
let saveTimer = null;

// Fill in anything a newer version of the app added, without touching what the user has.
export function migrate(raw) {
  const s = raw && raw.v ? raw : freshState();
  s.settings = { ...DEFAULT_SETTINGS, ...s.settings };
  s.lists ||= {};
  for (const key of Object.keys(DEFAULT_LISTS)) s.lists[key] ||= structuredClone(DEFAULT_LISTS[key]);
  s.meds ||= [];
  s.days ||= {};
  s.episodes ||= [];
  return s;
}

export async function load() {
  state = migrate(await readData());
  loaded = true;
  await snapshot(state, dateKey());
  notify();
}

function notify() { for (const fn of subs) fn(); }

export const getState = () => state;
export const onSaved = (fn) => { afterSave.add(fn); return () => afterSave.delete(fn); };

async function save() {
  saveTimer = null;
  try { await writeData(state); } catch (e) { console.error('save failed', e); }
  for (const f of afterSave) f(state);
}

export function update(fn) {
  fn(state);
  notify();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 250);
}

// Write straight away if a save is pending. Called when the app goes to the background.
export function flush() {
  if (saveTimer) { clearTimeout(saveTimer); return save(); }
}

export async function replaceState(next) {
  state = migrate(next);
  await writeData(state);
  notify();
}

export function useStore() {
  const [, tick] = useState(0);
  useEffect(() => { const fn = () => tick((n) => n + 1); subs.add(fn); return () => subs.delete(fn); }, []);
  return { state, loaded };
}

// ---- actions ----

const stamp = (rec, dayK) => {
  const now = new Date().toISOString();
  if (!rec.createdAt) { rec.createdAt = now; if (isLate(dayK, now)) rec.late = true; }
  rec.editedAt = now;
};

export function editDay(k, fn) {
  update((s) => { const d = (s.days[k] ||= {}); fn(d); stamp(d, k); });
}

export function toggleDayItem(k, field, id) {
  editDay(k, (d) => { const a = (d[field] ||= []); const i = a.indexOf(id); i < 0 ? a.push(id) : a.splice(i, 1); });
}

export function startEpisode(startIso = new Date().toISOString()) {
  const open = openEpisode(state);
  if (open) return open.id;
  const id = newId();
  update((s) => {
    const ep = { id, start: startIso, end: null, severity: null, character: [], symptoms: [], prodrome: [], postdrome: [], aura: [], body: {}, meds: [], relief: [], impact: [], note: '' };
    stamp(ep, dateKey(new Date(startIso)));
    s.episodes.push(ep);
  });
  return id;
}

export function editEpisode(id, fn) {
  update((s) => { const ep = s.episodes.find((e) => e.id === id); if (ep) { fn(ep); ep.editedAt = new Date().toISOString(); } });
}

export function deleteEpisode(id) {
  update((s) => { s.episodes = s.episodes.filter((e) => e.id !== id); });
}

export function logDose(epId, med, timeIso = new Date().toISOString()) {
  const doseId = newId();
  editEpisode(epId, (ep) => {
    ep.meds.push({ id: doseId, medId: med.id, name: med.name, dose: med.dose, cls: med.cls, time: timeIso, painFree2h: null, returned24h: null, helped: null, sideEffects: '' });
  });
  return doseId;
}

// A painkiller taken for something other than a headache. Counts towards overuse only.
export function logOtherDose(med, timeIso = new Date().toISOString()) {
  const k = dateKey(new Date(timeIso));
  editDay(k, (d) => {
    (d.otherMeds ||= []).push({ id: newId(), medId: med.id, name: med.name, dose: med.dose, cls: med.cls, time: timeIso });
  });
}

export function removeDose(dose) {
  if (dose.episodeId) editEpisode(dose.episodeId, (e) => { e.meds = e.meds.filter((x) => x.id !== dose.id); });
  else editDay(dateKey(new Date(dose.time)), (d) => { d.otherMeds = (d.otherMeds || []).filter((x) => x.id !== dose.id); });
}
