import { useState } from 'preact/hooks';
import { dateKey, durationStr, longDate, monthTitle, parseKey, timeStr } from '../lib/dates.js';
import { dayStatus, dayValue, headacheDays, isLate, isMigraineType, monthSummary, newId } from '../lib/logic.js';
import { update } from '../lib/store.js';
import { Icon, TopBar } from '../ui.jsx';
import { DayForm } from './DayForm.jsx';
import { ThemeButton } from './Today.jsx';

const LABEL = { mild: 'Mild', moderate: 'Moderate', severe: 'Severe', unrated: 'Headache', clear: 'Clear', none: 'Not logged' };
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function addEpisodeOn(k) {
  const id = newId();
  const start = new Date(`${k}T09:00:00`);
  const now = new Date().toISOString();
  update((s) => {
    s.episodes.push({ id, start: start.toISOString(), end: new Date(start.getTime() + 3600000).toISOString(), severity: null, character: [], symptoms: [], prodrome: [], postdrome: [], aura: [], body: {}, meds: [], relief: [], impact: [], note: '', createdAt: now, editedAt: now, late: isLate(k, now) || undefined });
  });
  return id;
}

export function EpisodeRow({ ep, state, go }) {
  return (
    <button type="button" class="card" style="text-align: left; background: var(--bg)" onClick={() => go({ name: 'episode', id: ep.id })}>
      <div class="row between g8">
        <span class="bold">{timeStr(ep.start)} - {ep.end ? `${timeStr(ep.end)} (${durationStr(new Date(ep.end) - new Date(ep.start))})` : 'ongoing'}</span>
        <span class={`badge sev-${ep.severity || 'unrated'}`}>{LABEL[ep.severity || 'unrated']}</span>
      </div>
      {ep.meds.length > 0 && <span class="small muted row g6"><Icon name="pill" size={14} />{ep.meds.map((d) => `${d.name} ${timeStr(d.time)}`).join(', ')}</span>}
      {isMigraineType(ep) && <span class="small muted">Migraine-type features</span>}
      {ep.note && <span class="small">{ep.note}</span>}
    </button>
  );
}

function DayDetail({ k, state, go }) {
  const hd = headacheDays(state.episodes);
  const status = dayStatus(k, state, hd);
  const day = state.days[k] || {};
  const eps = hd[k]?.episodes || [];
  const trig = (day.triggers || []).map((id) => state.lists.triggers.find((t) => t.id === id)?.label || id);
  const sleep = dayValue(day, 'sleepHours').value;
  return (
    <div class="card" style="border-radius: 20px; padding: 16px; gap: 14px">
      <div class="row between g8">
        <h3 style="font-size: 17px">{longDate(k)}</h3>
        <span class={`badge sev-${status}`}>{LABEL[status]}</span>
      </div>
      {eps.map((ep) => <EpisodeRow key={ep.id} ep={ep} state={state} go={go} />)}
      {trig.length > 0 && (
        <div class="col g8"><span class="label">Triggers</span><div class="row wrap g6">{trig.map((t) => <span class="tag" key={t}>{t}</span>)}</div></div>
      )}
      {(sleep != null || day.weather) && (
        <span class="small muted">{[sleep != null && `${sleep}h sleep`, day.weather && `${day.weather.pMean} hPa`, day.weather?.pDrop >= 6 && `pressure fell ${day.weather.pDrop}`].filter(Boolean).join(' · ')}</span>
      )}
      {day.note && <div class="col g6"><span class="label">Note</span><p style="font-size: 15px; font-weight: 600">{day.note}</p></div>}
      {status === 'none' && <p class="small muted">Nothing logged. Entries added more than 48 hours after the day are marked "added later".</p>}
      <div class="grid2">
        <button type="button" class="btn small" onClick={() => go({ name: 'day', k })}>{status === 'none' ? 'Log this day' : 'Edit day'}</button>
        <button type="button" class="btn small" onClick={() => go({ name: 'episode', id: addEpisodeOn(k) })}><Icon name="plus" size={16} />Headache</button>
      </div>
    </div>
  );
}

export function Calendar({ state, go, setTheme, sel: initialSel }) {
  const today = dateKey();
  const [sel, setSel] = useState(initialSel || today);
  const selDate = parseKey(sel);
  const [ym, setYm] = useState({ y: selDate.getFullYear(), m: selDate.getMonth() });
  const hd = headacheDays(state.episodes);
  const sum = monthSummary(state, ym.y, ym.m);

  const first = new Date(ym.y, ym.m, 1);
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const count = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= count; d++) cells.push(dateKey(new Date(ym.y, ym.m, d)));
  const shift = (n) => setYm(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const isCurrentMonth = ym.y === new Date().getFullYear() && ym.m === new Date().getMonth();

  return (
    <div class="scroll" style="gap: 18px">
      <div class="row between">
        <div class="row g4">
          <button type="button" class="iconbtn plain" aria-label="Previous month" onClick={() => shift(-1)}><Icon name="left" size={20} stroke={2} /></button>
          <h1 style="font-size: 22px; letter-spacing: -0.3px">{monthTitle(ym.y, ym.m)}</h1>
          <button type="button" class="iconbtn plain" aria-label="Next month" disabled={isCurrentMonth} style={isCurrentMonth ? 'opacity: 0.3' : ''} onClick={() => shift(1)}><Icon name="right" size={20} stroke={2} /></button>
        </div>
        <ThemeButton state={state} setTheme={setTheme} />
      </div>

      <div class="grid2">
        {[[sum.headache, 'Headache days'], [sum.migraine, 'Migraine-type days'], [sum.medDays, 'Med days'], [sum.notLogged, 'Not logged']].map(([n, l]) => (
          <div class="card" key={l} style="border-radius: 16px; padding: 10px 12px; gap: 2px; flex-direction: row; align-items: baseline; gap: 8px">
            <span class="big">{n}</span><span class="small muted" style="font-size: 12px; font-weight: 700">{l}</span>
          </div>
        ))}
      </div>

      <div class="col g6">
        <div class="week" style="gap: 2px">{DOW.map((d, i) => <span key={i} class="small muted" style="text-align: center; font-size: 12px; font-weight: 700">{d}</span>)}</div>
        <div class="week" style="row-gap: 4px; column-gap: 2px">
          {cells.map((k, i) => {
            if (!k) return <span key={`e${i}`} />;
            const future = k > today;
            const s = future ? null : dayStatus(k, state, hd);
            const cls = future ? '' : k === today && s === 'none' ? 'sev-today' : `sev-${s}`;
            const day = state.days[k];
            const med = hd[k]?.episodes.some((e) => e.meds.some((d) => dateKey(new Date(d.time)) === k));
            return (
              <button type="button" key={k} class="daybtn" disabled={future} aria-pressed={sel === k ? 'true' : 'false'}
                aria-label={`${longDate(k)}${future ? '' : `, ${LABEL[s]}`}`} onClick={() => setSel(k)}>
                <span class={`circle ${cls} ${sel === k ? 'sel' : ''}`} style={`width: 38px; height: 38px; font-size: 14px; ${future ? 'color: var(--muted); opacity: 0.6' : ''}`}>{parseKey(k).getDate()}</span>
                <span class="dots">
                  {med && <span class="dot6" style="background: var(--blue)" />}
                  {day?.triggers?.length > 0 && <span class="dot6" style="background: var(--sage)" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div class="row wrap small muted" style="gap: 10px 14px; font-size: 12px; font-weight: 700">
        {[['sev-mild', 'Mild'], ['sev-moderate', 'Moderate'], ['sev-severe', 'Severe'], ['sev-clear', 'Clear'], ['sev-none', 'Not logged']].map(([c, l]) => (
          <span class="row g4" key={l}><span class={c} style="width: 12px; height: 12px; border-radius: 999px; display: inline-block" />{l}</span>
        ))}
        <span class="row g4"><span class="dot6" style="background: var(--blue)" />Med</span>
        <span class="row g4"><span class="dot6" style="background: var(--sage)" />Triggers</span>
      </div>

      <DayDetail k={sel} state={state} go={go} />
    </div>
  );
}

// Edit any past day. Reached from the calendar.
export function DayScreen({ state, k, go, back }) {
  const eps = headacheDays(state.episodes)[k]?.episodes || [];
  return (
    <div class="scroll">
      <TopBar title={parseKey(k).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} onBack={back} />
      {eps.map((ep) => <EpisodeRow key={ep.id} ep={ep} state={state} go={go} />)}
      <button type="button" class="btn small" onClick={() => go({ name: 'episode', id: addEpisodeOn(k) })}><Icon name="plus" size={16} />Add a headache on this day</button>
      <DayForm k={k} state={state} isToday={k === dateKey()} go={go} />
    </div>
  );
}
