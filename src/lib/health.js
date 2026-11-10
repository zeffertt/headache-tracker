// Reads sleep, exercise, steps, resting heart rate, water and calories from Health Connect.
// Read-only. Results land in day.auto, which manual entries always override.
import { addDays, dateKey, parseKey } from './dates.js';
import { isNative } from './platform.js';
import { getState, update } from './store.js';

const READ = ['sleep', 'steps', 'restingHeartRate', 'dietaryWater', 'dietaryEnergyConsumed', 'workouts'];
const SLEEPING = new Set(['asleep', 'rem', 'deep', 'light']);

const plugin = async () => (await import('@capgo/capacitor-health')).Health;

export async function healthAvailable() {
  if (!isNative) return false;
  try { return (await (await plugin()).isAvailable()).available; } catch { return false; }
}

export async function connectHealth() {
  const Health = await plugin();
  const status = await Health.requestAuthorization({ read: READ });
  const ok = status.readAuthorized.length > 0;
  update((s) => { s.settings.healthOn = ok; });
  if (ok) await syncHealth();
  return ok;
}

// Minutes asleep in one sleep session. Uses stages when the watch provides them.
export function sleepMinutes(sample) {
  if (sample.stages?.length) {
    const m = sample.stages.filter((st) => SLEEPING.has(st.stage)).reduce((a, st) => a + st.durationMinutes, 0);
    if (m > 0) return m;
  }
  if (sample.sleepState && !SLEEPING.has(sample.sleepState)) return 0;
  return sample.value || 0;
}

export async function syncHealth(daysBack = 14) {
  const s = getState();
  if (!isNative || !s.settings.healthOn) return;
  const Health = await plugin();
  const today = dateKey();
  const startK = addDays(today, -daysBack);
  const startDate = parseKey(startK).toISOString();
  const endDate = new Date().toISOString();
  const auto = {};
  const put = (k, field, v) => { if (k >= startK && k <= today && v != null && !Number.isNaN(v)) (auto[k] ||= {})[field] = v; };
  const tryRead = async (fn) => { try { await fn(); } catch (e) { console.warn('health read skipped', e?.message || e); } };

  await tryRead(async () => {
    const { samples } = await Health.readSamples({ dataType: 'sleep', startDate: parseKey(addDays(startK, -1)).toISOString(), endDate, limit: 1000 });
    const mins = {};
    for (const smp of samples) { const k = dateKey(new Date(smp.endDate)); mins[k] = (mins[k] || 0) + sleepMinutes(smp); }
    for (const [k, m] of Object.entries(mins)) if (m > 0) put(k, 'sleepHours', Math.round((m / 60) * 10) / 10);
  });

  const aggregate = (dataType, field, aggregation, fmt) => tryRead(async () => {
    const { samples } = await Health.queryAggregated({ dataType, startDate, endDate, bucket: 'day', aggregation });
    for (const smp of samples) if (smp.value > 0) put(dateKey(new Date(smp.startDate)), field, fmt(smp.value));
  });
  await aggregate('steps', 'steps', 'sum', Math.round);
  await aggregate('restingHeartRate', 'restingHr', 'average', Math.round);
  await aggregate('dietaryWater', 'waterL', 'sum', (v) => Math.round(v * 10) / 10);
  await aggregate('dietaryEnergyConsumed', 'kcal', 'sum', Math.round);

  await tryRead(async () => {
    const { workouts } = await Health.queryWorkouts({ startDate, endDate, limit: 500 });
    const mins = {};
    for (const w of workouts) { const k = dateKey(new Date(w.startDate)); mins[k] = (mins[k] || 0) + w.duration / 60; }
    for (const [k, m] of Object.entries(mins)) put(k, 'exerciseMin', Math.round(m));
  });

  if (Object.keys(auto).length) {
    update((st) => { for (const [k, a] of Object.entries(auto)) { const d = (st.days[k] ||= {}); d.auto = { ...d.auto, ...a }; } });
  }
}
