import { useEffect, useRef, useState } from 'preact/hooks';
import { dateKey } from '../lib/dates.js';
import { connectHealth, healthAvailable, syncHealth } from '../lib/health.js';
import { newId } from '../lib/logic.js';
import { requestNotifications } from '../lib/notify.js';
import { exportData, isNative, listSnapshots, readSnapshot } from '../lib/platform.js';
import { getState, replaceState, update } from '../lib/store.js';
import { syncWeather, useCurrentLocation } from '../lib/weather.js';
import { Icon, Pick, Section, TopBar } from '../ui.jsx';

const LIST_NAMES = { triggers: 'Triggers', symptoms: 'Symptoms', character: 'Pain character', prodrome: 'Warning signs', postdrome: 'Afterwards', relief: 'Relief', impact: 'Impact' };

function Toggle({ label, value, onChange, hint }) {
  return (
    <div class="col g4">
      <div class="row between g12">
        <span class="bold">{label}</span>
        <button type="button" role="switch" aria-checked={value ? 'true' : 'false'} aria-label={label} class={`chip center ${value ? 'on' : ''}`} style="min-width: 64px" onClick={() => onChange(!value)}>{value ? 'On' : 'Off'}</button>
      </div>
      {hint && <span class="small muted">{hint}</span>}
    </div>
  );
}

export function Settings({ state, go, toast }) {
  const s = state.settings;
  const set = (fn) => update((st) => fn(st.settings));
  const [healthOk, setHealthOk] = useState(null);
  const [snaps, setSnaps] = useState([]);
  const [busy, setBusy] = useState('');
  const fileRef = useRef();
  useEffect(() => { healthAvailable().then(setHealthOk); listSnapshots().then(setSnaps); }, []);

  const run = async (name, fn, okMsg) => {
    setBusy(name);
    try { const r = await fn(); if (okMsg) toast(typeof okMsg === 'function' ? okMsg(r) : okMsg); } catch (e) { toast(e?.message || 'That did not work'); }
    setBusy('');
  };

  const importFile = async (ev) => {
    const file = ev.currentTarget.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || data.v !== 1 || !Array.isArray(data.episodes) || typeof data.days !== 'object') throw new Error('Not a Headache Tracker backup');
      await replaceState(data);
      toast(`Restored ${data.episodes.length} headaches, ${Object.keys(data.days).length} days`);
    } catch (e) { toast(e.message || 'Could not read that file'); }
    ev.currentTarget.value = '';
  };

  return (
    <div class="scroll">
      <h1>Settings</h1>

      <Section title="Appearance">
        <Pick value={s.theme} options={[['system', 'Follow phone'], ['light', 'Light'], ['dark', 'Dark']]} onChange={(v) => set((x) => { x.theme = v || 'system'; })} />
        <span class="small muted">The headache screen is always dark.</span>
      </Section>

      <Section title="Reminders">
        <div class="card">
          <Toggle label="Evening reminder" value={s.reminderOn} hint="One tap for no headache. Also nudges about an open headache and preventives."
            onChange={async (v) => { if (v && isNative && !(await requestNotifications())) { toast('Notifications are blocked in Android settings'); return; } set((x) => { x.reminderOn = v; }); }} />
          <div class="row between g12"><label class="bold" for="rtime">Time</label><input id="rtime" class="field" style="width: 130px" type="time" value={s.reminderTime} onChange={(ev) => { if (ev.currentTarget.value) set((x) => { x.reminderTime = ev.currentTarget.value; }); }} /></div>
          <Toggle label="Check-in after a painkiller" value={s.medCheckOn} hint="Two hours on, asks whether it helped." onChange={(v) => set((x) => { x.medCheckOn = v; })} />
        </div>
      </Section>

      <Section title="Weather">
        <div class="card">
          <Toggle label="Log weather each day" value={s.weatherOn} hint="Pressure, temperature and humidity from Open-Meteo." onChange={(v) => set((x) => { x.weatherOn = v; })} />
          <div class="row between g12"><span class="small muted">Location: {s.location.name}</span></div>
          <div class="grid2">
            <button type="button" class="btn small" disabled={!!busy} onClick={() => run('loc', async () => { await useCurrentLocation(); await syncWeather(); }, 'Location updated')}>{busy === 'loc' ? 'Finding...' : 'Use where I am'}</button>
            <button type="button" class="btn small" disabled={!!busy} onClick={() => run('wx', syncWeather, 'Weather updated')}>{busy === 'wx' ? 'Updating...' : 'Update now'}</button>
          </div>
        </div>
      </Section>

      <Section title="Health Connect" hint="Sleep, exercise, steps, resting heart rate, water and calories from your watch and other apps. Read only. Anything you type in yourself is used instead.">
        <div class="card">
          {healthOk === false && <span class="small muted">{isNative ? 'Health Connect is not available on this phone.' : 'Only available in the Android app.'}</span>}
          {healthOk && (s.healthOn ? (
            <div class="grid2">
              <button type="button" class="btn small" disabled={!!busy} onClick={() => run('hc', () => syncHealth(30), 'Health data updated')}>{busy === 'hc' ? 'Syncing...' : 'Sync now'}</button>
              <button type="button" class="btn small" onClick={() => set((x) => { x.healthOn = false; })}>Disconnect</button>
            </div>
          ) : (
            <button type="button" class="btn small primary" disabled={!!busy} onClick={() => run('hc', connectHealth, (ok) => (ok ? 'Connected' : 'No access was granted'))}>Connect</button>
          ))}
        </div>
      </Section>

      <Section title="Lists" hint="Add, rename, hide or reorder the tap buttons.">
        <div class="col g8">
          {Object.entries(LIST_NAMES).map(([key, name]) => (
            <button type="button" key={key} class="card" style="flex-direction: row; justify-content: space-between; align-items: center; text-align: left" onClick={() => go({ name: 'lists', list: key })}>
              <span class="bold">{name}</span><span class="row g6 small muted">{state.lists[key].filter((i) => !i.hidden).length}<Icon name="right" size={16} /></span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Backup" hint="Your log lives on this phone. Android also backs it up to your Google account automatically.">
        <div class="card">
          <button type="button" class="btn small" onClick={() => run('exp', () => exportData(getState(), dateKey()))}>Export a copy</button>
          <button type="button" class="btn small" onClick={() => fileRef.current.click()}>Restore from a copy</button>
          <input ref={fileRef} type="file" accept="application/json,.json" style="display: none" onChange={importFile} />
          {snaps.length > 0 && (
            <div class="col g6">
              <label class="label" for="snap">Roll back to a snapshot</label>
              <select id="snap" class="field" value="" onChange={(ev) => { const k = ev.currentTarget.value; if (k) run('snap', async () => replaceState(await readSnapshot(k)), `Rolled back to ${k}`); }}>
                <option value="">Choose a date</option>{snaps.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <span class="small muted">Kept on this phone: the last 30 days, plus one a month.</span>
            </div>
          )}
        </div>
      </Section>

      <p class="small muted">Headache Tracker {__APP_VERSION__}. A diary to share with your doctor. It does not diagnose.</p>
    </div>
  );
}

export function Lists({ state, list, back }) {
  const items = state.lists[list];
  const groups = [...new Set(items.map((i) => i.group).filter(Boolean))];
  const [label, setLabel] = useState('');
  const [group, setGroup] = useState(groups[0] || '');
  const edit = (fn) => update((s) => fn(s.lists[list]));
  const move = (i, n) => edit((a) => { const j = i + n; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; });
  const add = () => {
    if (!label.trim()) return;
    edit((a) => { a.push({ id: 'c_' + newId(), label: label.trim(), icon: 'circle', ...(group ? { group } : {}) }); });
    setLabel('');
  };
  return (
    <div class="scroll">
      <TopBar title={LIST_NAMES[list]} onBack={back} />
      <div class="card">
        <label class="label" for="newitem">Add your own</label>
        <input id="newitem" class="field" value={label} placeholder="e.g. Night shoot" onInput={(ev) => setLabel(ev.currentTarget.value)} onKeyDown={(ev) => { if (ev.key === 'Enter') add(); }} />
        {groups.length > 0 && <select class="field" aria-label="Group" value={group} onChange={(ev) => setGroup(ev.currentTarget.value)}>{groups.map((g) => <option key={g}>{g}</option>)}</select>}
        <button type="button" class="btn small primary" onClick={add}><Icon name="plus" size={16} />Add</button>
      </div>
      <div class="col g8">
        {items.map((it, i) => (
          <div class="card" key={it.id} style={`gap: 8px; ${it.hidden ? 'opacity: 0.55' : ''}`}>
            <input class="field" aria-label="Name" value={it.label} onInput={(ev) => edit((a) => { a[i].label = ev.currentTarget.value; })} />
            <div class="row between">
              <span class="small muted">{it.group || ''}</span>
              <div class="row g6">
                <button type="button" class="iconbtn" aria-label={`Move ${it.label} up`} onClick={() => move(i, -1)}><Icon name="up" /></button>
                <button type="button" class="iconbtn" aria-label={`Move ${it.label} down`} onClick={() => move(i, 1)}><Icon name="down" /></button>
                <button type="button" class="chip center" style="min-width: 76px" aria-pressed={it.hidden ? 'true' : 'false'} onClick={() => edit((a) => { a[i].hidden = !a[i].hidden; })}>{it.hidden ? 'Show' : 'Hide'}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p class="small muted">Hiding keeps past entries intact. Nothing is deleted.</p>
    </div>
  );
}
