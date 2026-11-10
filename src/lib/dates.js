const pad = (n) => String(n).padStart(2, '0');

export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dateKey(d); };
export const monthKey = (k) => k.slice(0, 7);
export const timeStr = (iso) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

export function durationStr(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(m / 60);
  return `${h}h ${pad(m % 60)}m`;
}

export function longDate(k) {
  return parseKey(k).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function monthTitle(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

// Value for <input type="datetime-local"> in local time, and back.
export const toLocalInput = (iso) => { const d = new Date(iso); return `${dateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
export const fromLocalInput = (v) => new Date(v).toISOString();

// Every local date an episode touches. Open episodes run to `now`.
export function episodeDates(ep, now = new Date()) {
  const out = [];
  let k = dateKey(new Date(ep.start));
  const last = dateKey(ep.end ? new Date(ep.end) : now);
  let guard = 0;
  while (k <= last && guard++ < 60) { out.push(k); k = addDays(k, 1); }
  return out;
}
