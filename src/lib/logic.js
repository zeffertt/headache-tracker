import { MED_CLASSES } from './defaults.js';
import { addDays, dateKey, episodeDates, monthKey, parseKey } from './dates.js';

const SEV_RANK = { mild: 1, moderate: 2, severe: 3 };
const LATE_MS = 48 * 3600 * 1000;

// Migraine-type features, following the ICHD-3 pattern. A label for the diary, not a diagnosis.
export function isMigraineType(ep) {
  if ((ep.aura || []).length) return true;
  const ch = new Set(ep.character || []);
  const sy = new Set(ep.symptoms || []);
  let pain = 0;
  if (ch.has('onesided')) pain++;
  if (ch.has('pulsating')) pain++;
  if (ch.has('worsemove')) pain++;
  if (ep.severity === 'moderate' || ep.severity === 'severe') pain++;
  const assoc = sy.has('nausea') || sy.has('vomiting') || (sy.has('photophobia') && sy.has('phonophobia'));
  return pain >= 2 && assoc;
}

// Map of dateKey -> { episodes, severity, migraine } for every day touched by an episode.
export function headacheDays(episodes, now = new Date()) {
  const map = {};
  for (const ep of episodes) {
    for (const k of episodeDates(ep, now)) {
      const d = (map[k] ||= { episodes: [], severity: null, migraine: false });
      d.episodes.push(ep);
      if (ep.severity && (SEV_RANK[ep.severity] || 0) > (SEV_RANK[d.severity] || 0)) d.severity = ep.severity;
      if (isMigraineType(ep)) d.migraine = true;
    }
  }
  return map;
}

// 'mild' | 'moderate' | 'severe' | 'unrated' | 'clear' | 'none'
export function dayStatus(k, state, hd) {
  const h = (hd || headacheDays(state.episodes))[k];
  if (h) return h.severity || 'unrated';
  return state.days[k]?.clear ? 'clear' : 'none';
}

export const isLogged = (status) => status !== 'none';

// An entry is late when it is first written more than 48h after the end of the day it describes.
export function isLate(dayK, createdAtIso) {
  const endOfDay = parseKey(addDays(dayK, 1)).getTime();
  return new Date(createdAtIso).getTime() - endOfDay > LATE_MS;
}

// Days in a month on which acute medication was taken, by class, against the overuse thresholds.
export function overuse(state, month = monthKey(dateKey())) {
  const medById = Object.fromEntries(state.meds.map((m) => [m.id, m]));
  const byClass = {};
  const allDays = new Set();
  for (const ep of state.episodes) {
    for (const dose of ep.meds || []) {
      const k = dateKey(new Date(dose.time));
      if (monthKey(k) !== month) continue;
      const cls = medById[dose.medId]?.cls || dose.cls || 'other';
      (byClass[cls] ||= new Set()).add(k);
      allDays.add(k);
    }
  }
  const rows = MED_CLASSES.filter((c) => c.limit).map((c) => {
    const days = byClass[c.id]?.size || 0;
    return { cls: c.id, label: c.label, days, limit: c.limit, ratio: days / c.limit };
  });
  const worst = rows.reduce((a, b) => (b.ratio > a.ratio ? b : a), rows[0]);
  const level = worst.ratio >= 1 ? 'over' : worst.ratio >= 0.8 ? 'near' : 'ok';
  return { rows, worst, level, totalDays: allDays.size };
}

export function monthSummary(state, year, month, now = new Date()) {
  const hd = headacheDays(state.episodes, now);
  const today = dateKey(now);
  let headache = 0, migraine = 0, notLogged = 0, clear = 0;
  const last = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= last; d++) {
    const k = dateKey(new Date(year, month, d));
    if (k > today) break;
    const s = dayStatus(k, state, hd);
    if (s === 'none') { if (k !== today) notLogged++; }
    else if (s === 'clear') clear++;
    else { headache++; if (hd[k].migraine) migraine++; }
  }
  const mk = `${year}-${String(month + 1).padStart(2, '0')}`;
  return { headache, migraine, notLogged, clear, medDays: overuse(state, mk).totalDays };
}

// Manual entry always wins over auto-filled data.
export function dayValue(day, field) {
  if (!day) return { value: null, source: null };
  if (day[field] != null && day[field] !== '') return { value: day[field], source: 'manual' };
  if (day.auto?.[field] != null) return { value: day.auto[field], source: 'auto' };
  return { value: null, source: null };
}

export const openEpisode = (state) => state.episodes.find((e) => !e.end) || null;

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
