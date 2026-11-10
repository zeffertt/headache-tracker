import { useState } from 'preact/hooks';
import { MED_CLASSES, STOP_REASONS } from '../lib/defaults.js';
import { dateKey, parseKey } from '../lib/dates.js';
import { newId, overuse } from '../lib/logic.js';
import { update } from '../lib/store.js';
import { Icon, Section } from '../ui.jsx';

const fmtDate = (k) => (k ? parseKey(k).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

function MedForm({ med, onDone }) {
  const [m, setM] = useState({ ...med });
  const set = (f) => (ev) => setM({ ...m, [f]: ev.currentTarget.value });
  const prev = m.kind === 'preventive';
  const save = () => {
    if (!m.name.trim()) return;
    update((s) => {
      const clean = { ...m, name: m.name.trim(), active: prev ? !m.endDate : m.active !== false };
      const i = s.meds.findIndex((x) => x.id === m.id);
      i < 0 ? s.meds.push(clean) : (s.meds[i] = clean);
    });
    onDone();
  };
  return (
    <div class="card">
      <div class="col g6"><label class="label" for="m-name">Name</label><input id="m-name" class="field" value={m.name} onInput={set('name')} placeholder={prev ? 'e.g. Propranolol' : 'e.g. Naproxen'} /></div>
      <div class="col g6"><label class="label" for="m-dose">Dose</label><input id="m-dose" class="field" value={m.dose} onInput={set('dose')} placeholder="e.g. 80mg twice a day" /></div>
      {!prev && (
        <div class="col g6"><label class="label" for="m-cls">Type</label>
          <select id="m-cls" class="field" value={m.cls} onChange={set('cls')}>{MED_CLASSES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
        </div>
      )}
      {prev && (
        <>
          <div class="col g6"><label class="label" for="m-start">Started</label><input id="m-start" class="field" type="date" value={m.startDate || ''} onInput={set('startDate')} /></div>
          <div class="col g6"><label class="label" for="m-end">Stopped (leave blank if still taking)</label><input id="m-end" class="field" type="date" value={m.endDate || ''} onInput={set('endDate')} /></div>
          {m.endDate && (
            <div class="col g6"><label class="label" for="m-why">Why stopped</label>
              <select id="m-why" class="field" value={m.stopReason || ''} onChange={set('stopReason')}><option value="">Choose</option>{STOP_REASONS.map((r) => <option key={r}>{r}</option>)}</select>
            </div>
          )}
        </>
      )}
      <div class="grid2">
        <button type="button" class="btn small" onClick={onDone}>Cancel</button>
        <button type="button" class="btn small primary" onClick={save}>Save</button>
      </div>
      {!prev && med.name && (
        <button type="button" class="link" onClick={() => { update((s) => { const x = s.meds.find((y) => y.id === m.id); if (x) x.active = !x.active; }); onDone(); }}>{med.active ? 'Hide from quick buttons' : 'Show in quick buttons'}</button>
      )}
    </div>
  );
}

export function Meds({ state }) {
  const [editing, setEditing] = useState(null);
  const ou = overuse(state);
  const acute = state.meds.filter((m) => m.kind === 'acute');
  const prev = state.meds.filter((m) => m.kind === 'preventive').sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
  const blank = (kind) => ({ id: newId(), name: '', dose: '', kind, cls: 'simple', active: true, startDate: kind === 'preventive' ? dateKey() : undefined });
  const row = (m, sub) => (editing?.id === m.id ? <MedForm key={m.id} med={editing} onDone={() => setEditing(null)} /> : (
    <button type="button" key={m.id} class="card" style={`text-align: left; flex-direction: row; align-items: center; justify-content: space-between; ${m.active ? '' : 'opacity: 0.6'}`} onClick={() => setEditing(m)}>
      <span class="col"><span class="bold">{m.name} {m.dose}</span><span class="small muted">{sub}</span></span><Icon name="edit" />
    </button>
  ));

  return (
    <div class="scroll">
      <h1>Meds</h1>

      <Section title="This month" hint="Days with a painkiller. Regular use above these levels can cause rebound headaches.">
        <div class="card">
          {ou.rows.map((r) => (
            <div class="col g6" key={r.cls}>
              <div class="row between g8"><span class="small">{r.label.split(' (')[0]}</span><span class="bold">{r.days} <span class="small muted">of {r.limit}</span></span></div>
              <div class="bar"><div style={`width: ${Math.min(100, r.ratio * 100)}%; ${r.ratio >= 1 ? 'background: var(--clay)' : ''}`} /></div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Painkillers" hint="These appear as one-tap buttons when a headache starts.">
        {acute.map((m) => row(m, `${MED_CLASSES.find((c) => c.id === m.cls)?.label.split(' (')[0] || ''}${m.active ? '' : ' · hidden'}`))}
        {editing && editing.kind === 'acute' && !acute.some((m) => m.id === editing.id) && <MedForm med={editing} onDone={() => setEditing(null)} />}
        <button type="button" class="btn small" onClick={() => setEditing(blank('acute'))}><Icon name="plus" size={16} />Add painkiller</button>
      </Section>

      <Section title="Preventives" hint="Daily medication to reduce attacks. Keep stopped ones here: doctors ask what you have tried, for how long, and why you stopped.">
        {prev.map((m) => row(m, `${fmtDate(m.startDate) || 'Start date not set'} - ${m.endDate ? `${fmtDate(m.endDate)}${m.stopReason ? ` · ${m.stopReason}` : ''}` : 'still taking'}`))}
        {editing && editing.kind === 'preventive' && !prev.some((m) => m.id === editing.id) && <MedForm med={editing} onDone={() => setEditing(null)} />}
        <button type="button" class="btn small" onClick={() => setEditing(blank('preventive'))}><Icon name="plus" size={16} />Add preventive</button>
      </Section>
    </div>
  );
}
