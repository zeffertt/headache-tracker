import { addDays, dateKey } from './dates.js';
import { getState, update } from './store.js';

// Turn Open-Meteo hourly arrays into one record per local day.
// pDrop is the biggest fall in pressure within any 24h window ending that day.
export function dailyFromHourly(times, pressure, temp, humidity) {
  const days = {};
  for (let i = 0; i < times.length; i++) {
    const k = times[i].slice(0, 10);
    const d = (days[k] ||= { p: [], t: [], h: [], drop: 0 });
    if (pressure[i] != null) {
      d.p.push(pressure[i]);
      let maxPrev = -Infinity;
      for (let j = Math.max(0, i - 24); j < i; j++) if (pressure[j] != null && pressure[j] > maxPrev) maxPrev = pressure[j];
      if (maxPrev - pressure[i] > d.drop) d.drop = maxPrev - pressure[i];
    }
    if (temp[i] != null) d.t.push(temp[i]);
    if (humidity[i] != null) d.h.push(humidity[i]);
  }
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const r1 = (n) => Math.round(n * 10) / 10;
  const out = {};
  for (const [k, d] of Object.entries(days)) {
    if (!d.p.length) continue;
    out[k] = {
      pMean: Math.round(avg(d.p)), pDrop: r1(d.drop),
      pTrend: d.p[d.p.length - 1] - d.p[0] <= -2 ? 'falling' : d.p[d.p.length - 1] - d.p[0] >= 2 ? 'rising' : 'steady',
      tMax: d.t.length ? r1(Math.max(...d.t)) : null, tMin: d.t.length ? r1(Math.min(...d.t)) : null,
      hum: d.h.length ? Math.round(avg(d.h)) : null,
    };
  }
  return out;
}

// Fetch today plus any missing days (up to 92 back). Never overwrites a past day already stored.
export async function syncWeather() {
  const s = getState();
  if (!s.settings.weatherOn) return;
  const today = dateKey();
  let past = 1;
  for (let i = 1; i <= 92; i++) { const k = addDays(today, -i); if (!s.days[k]?.weather && (s.days[k] || i <= 7)) past = i; }
  const { lat, lon } = s.settings.location;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=pressure_msl,temperature_2m,relative_humidity_2m&past_days=${Math.min(92, past + 1)}&forecast_days=1&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather request failed: ' + res.status);
  const j = await res.json();
  const daily = dailyFromHourly(j.hourly.time, j.hourly.pressure_msl, j.hourly.temperature_2m, j.hourly.relative_humidity_2m);
  update((st) => {
    for (const [k, w] of Object.entries(daily)) {
      if (k > today) continue;
      if (k === today || !st.days[k]?.weather) (st.days[k] ||= {}).weather = w;
    }
  });
}

export async function useCurrentLocation() {
  const { Geolocation } = await import('@capacitor/geolocation');
  const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 15000 });
  const lat = Math.round(pos.coords.latitude * 100) / 100;
  const lon = Math.round(pos.coords.longitude * 100) / 100;
  update((s) => { s.settings.location = { lat, lon, name: `${lat}, ${lon}` }; });
}
