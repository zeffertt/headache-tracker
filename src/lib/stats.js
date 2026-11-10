import { addDays, dateKey } from './dates.js';
import { dayStatus, dayValue, headacheDays, isLogged } from './logic.js';

export const MIN_DAYS = 90;
const MIN_EXPOSED = 5;

// Two-sided Fisher exact test for a 2x2 table [[a,b],[c,d]].
export function fisher(a, b, c, d) {
  const n = a + b + c + d;
  const lf = [0];
  for (let i = 1; i <= n; i++) lf[i] = lf[i - 1] + Math.log(i);
  const p = (x) => {
    const bb = a + b - x, cc = a + c - x, dd = d - a + x;
    if (x < 0 || bb < 0 || cc < 0 || dd < 0) return 0;
    return Math.exp(lf[a + b] + lf[c + d] + lf[a + c] + lf[b + d] - lf[n] - lf[x] - lf[bb] - lf[cc] - lf[dd]);
  };
  const obs = p(a);
  let total = 0;
  for (let x = 0; x <= Math.min(a + b, a + c); x++) { const px = p(x); if (px <= obs * (1 + 1e-9)) total += px; }
  return Math.min(1, total);
}

// Factors derived from numbers rather than chips. Each returns true / false / null (unknown).
const DERIVED = [
  { id: 'd_shortsleep', label: 'Under 6 hours sleep', test: (d) => { const v = dayValue(d, 'sleepHours').value; return v == null ? null : v < 6; } },
  { id: 'd_longsleep', label: 'Over 9 hours sleep', test: (d) => { const v = dayValue(d, 'sleepHours').value; return v == null ? null : v > 9; } },
  { id: 'd_poorquality', label: 'Sleep rated poor', test: (d) => (d?.sleepQuality ? d.sleepQuality === 'poor' : null) },
  { id: 'd_pressuredrop', label: 'Pressure drop of 6 hPa or more', test: (d) => (d?.weather?.pDrop == null ? null : d.weather.pDrop >= 6) },
  { id: 'd_humid', label: 'Humidity above 85%', test: (d) => (d?.weather?.hum == null ? null : d.weather.hum > 85) },
  { id: 'd_hot', label: 'Above 25°C', test: (d) => (d?.weather?.tMax == null ? null : d.weather.tMax > 25) },
  { id: 'd_exercise', label: '30+ minutes exercise', test: (d) => { const v = dayValue(d, 'exerciseMin').value; return v == null ? null : v >= 30; } },
  { id: 'd_lowwater', label: 'Under 1.5 litres water', test: (d) => { const v = dayValue(d, 'waterL').value; return v == null ? null : v < 1.5; } },
  { id: 'd_highcaf', label: '4 or more caffeine drinks', test: (d) => (d?.caffeine == null ? null : d.caffeine >= 4) },
  { id: 'd_weekend', label: 'Weekend', test: (d, k) => { const w = new Date(k + 'T12:00').getDay(); return w === 0 || w === 6; } },
];

/**
 * For each factor: how often a headache started the same or next day (0-48h window),
 * compared with days without the factor. Associations only, never proof of cause.
 */
export function analyse(state, now = new Date()) {
  const hd = headacheDays(state.episodes, now);
  const starts = new Set(state.episodes.map((e) => dateKey(new Date(e.start))));
  const today = dateKey(now);
  const logged = Object.keys({ ...state.days, ...hd }).filter((k) => k <= today && isLogged(dayStatus(k, state, hd))).sort();
  const loggedSet = new Set(logged);

  // Outcome for day k: did a headache start on k or k+1? Needs k logged; k+1 counts only if logged.
  const outcome = (k) => starts.has(k) || (loggedSet.has(addDays(k, 1)) && starts.has(addDays(k, 1)));

  const factors = [
    ...state.lists.triggers.filter((t) => !t.hidden).map((t) => ({
      id: t.id, label: t.label, early: !!t.early,
      test: (d) => (d?.triggers || []).includes(t.id),
    })),
    ...DERIVED,
  ];

  const results = factors.map((f) => {
    let a = 0, b = 0, c = 0, d = 0;
    for (const k of logged) {
      const has = f.test(state.days[k], k);
      if (has == null) continue;
      const out = outcome(k);
      if (has) out ? a++ : b++; else out ? c++ : d++;
    }
    const exposed = a + b, unexposed = c + d;
    const withRate = exposed ? a / exposed : null;
    const withoutRate = unexposed ? c / unexposed : null;
    let kind = 'insufficient';
    let p = null;
    if (exposed >= MIN_EXPOSED && unexposed >= MIN_EXPOSED) {
      p = fisher(a, b, c, d);
      const rr = withoutRate > 0 ? withRate / withoutRate : (withRate > 0 ? Infinity : 1);
      kind = p < 0.1 && rr >= 1.5 ? 'trigger' : p < 0.1 && rr <= 0.67 ? 'protector' : 'none';
    }
    return { id: f.id, label: f.label, early: !!f.early, exposed, unexposed, withRate, withoutRate, p, kind };
  });

  return {
    loggedDays: logged.length,
    ready: logged.length >= MIN_DAYS,
    triggers: results.filter((r) => r.kind === 'trigger').sort((x, y) => x.p - y.p),
    protectors: results.filter((r) => r.kind === 'protector').sort((x, y) => x.p - y.p),
    none: results.filter((r) => r.kind === 'none'),
    insufficient: results.filter((r) => r.kind === 'insufficient'),
  };
}
