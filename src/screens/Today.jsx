import { useEffect, useState } from 'preact/hooks';
import { addDays, dateKey, durationStr, longDate, parseKey, timeStr } from '../lib/dates.js';
import { dayStatus, headacheDays, openEpisode, overuse } from '../lib/logic.js';
import { startEpisode } from '../lib/store.js';
import { Icon } from '../ui.jsx';
import { DayForm } from './DayForm.jsx';
import { QuickMeds } from './QuickMeds.jsx';

export function useNow(ms = 30000) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

export function ThemeButton({ state, setTheme }) {
  const dark = document.documentElement.dataset.theme === 'dark' || (document.documentElement.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  return (
    <button type="button" class="iconbtn" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setTheme(dark ? 'light' : 'dark')}>
      <Icon name={dark ? 'sun' : 'moon'} size={20} />
    </button>
  );
}

function WeekStrip({ state, today, go }) {
  const hd = headacheDays(state.episodes);
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(addDays(today, -i));
  return (
    <div class="week">
      {days.map((k) => {
        const s = dayStatus(k, state, hd);
        const cls = k === today && s === 'none' ? 'sev-today' : `sev-${s}`;
        const d = parseKey(k);
        return (
          <button type="button" class="daybtn" key={k} aria-label={`${longDate(k)}, ${s === 'none' ? 'not logged' : s}`} onClick={() => go({ name: 'calendar', sel: k })}>
            <span class="small muted" style="font-size: 12px">{d.toLocaleDateString('en-GB', { weekday: 'narrow' })}</span>
            <span class={`circle ${cls}`}>{d.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Today({ state, go, setTheme }) {
  const now = useNow();
  const today = dateKey(now);
  const open = openEpisode(state);
  const ou = overuse(state);
  const w = state.days[today]?.weather;
  const trendIcon = { falling: 'arrowdown', rising: 'arrowup' }[w?.pTrend];

  return (
    <div class="scroll">
      <div class="row between" style="align-items: flex-start">
        <div class="col">
          <span class="small muted">{longDate(today)}</span>
          <h1>Today</h1>
        </div>
        <ThemeButton state={state} setTheme={setTheme} />
      </div>

      <WeekStrip state={state} today={today} go={go} />

      <div class="grid2">
        <button type="button" class="card" style="text-align: left; gap: 8px" onClick={() => go({ name: 'meds' })}>
          <span class="label">Med days this month</span>
          <span class="big">{ou.worst.days} <span class="small muted">of {ou.worst.limit}</span></span>
          <div class="bar"><div style={`width: ${Math.min(100, ou.worst.ratio * 100)}%; ${ou.level === 'over' ? 'background: var(--clay)' : ''}`} /></div>
        </button>
        <div class="card" style="gap: 8px">
          <span class="label">Pressure</span>
          {w ? (
            <>
              <span class="big">{w.pMean} <span class="small muted">hPa</span></span>
              <span class="small row g4" style="color: var(--blue)">{trendIcon && <Icon name={trendIcon} size={14} stroke={2} />}{w.pTrend[0].toUpperCase() + w.pTrend.slice(1)}</span>
            </>
          ) : <span class="small muted">{state.settings.weatherOn ? 'No data yet' : 'Weather is off'}</span>}
        </div>
      </div>

      {ou.level !== 'ok' && (
        <div class="warn" role="status">
          {ou.level === 'over' ? 'You have reached' : 'You are close to'} {ou.worst.limit} days this month with a {ou.worst.label.split(' (')[0].toLowerCase()}. Regular use at this level can cause rebound headaches. Worth raising with your GP.
        </div>
      )}

      {open ? (
        <button type="button" class="start" onClick={() => go({ name: 'attack', id: open.id })}>
          <span class="dot"><Icon name="clock" size={22} stroke={2} /></span>
          <span class="col">
            <span style="font-size: 19px; font-weight: 800">Headache in progress</span>
            <span class="small" style="opacity: 0.9">Since {timeStr(open.start)}, {durationStr(now - new Date(open.start))}. Tap to update.</span>
          </span>
        </button>
      ) : (
        <button type="button" class="start" onClick={() => go({ name: 'attack', id: startEpisode() })}>
          <span class="dot"><Icon name="plus" size={22} stroke={2} /></span>
          <span class="col">
            <span style="font-size: 19px; font-weight: 800">Headache started</span>
            <span class="small" style="opacity: 0.9">One tap. Add details later.</span>
          </span>
        </button>
      )}

      <QuickMeds state={state} go={go} />

      <DayForm k={today} state={state} isToday go={go} />
    </div>
  );
}
