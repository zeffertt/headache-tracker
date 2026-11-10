import { durationStr, timeStr } from '../lib/dates.js';
import { cancelMedCheck, scheduleMedCheck } from '../lib/notify.js';
import { editEpisode, logDose } from '../lib/store.js';
import { Icon } from '../ui.jsx';
import { useNow } from './Today.jsx';

export const SEVERITIES = [['mild', 'Mild'], ['moderate', 'Moderate'], ['severe', 'Severe']];

export function SeverityPick({ value, onChange, tall }) {
  return (
    <div class="grid3">
      {SEVERITIES.map(([id, label]) => (
        <button type="button" key={id} class={`btn ${value === id ? `sev-${id}` : ''}`} style={`${tall ? 'min-height: 60px;' : ''} ${value === id ? 'border-color: transparent;' : 'background: var(--surface);'} padding: 0 6px`}
          aria-pressed={value === id ? 'true' : 'false'} onClick={() => onChange(value === id ? null : id)}>{label}</button>
      ))}
    </div>
  );
}

// The quick-start screen. Always dark and dim. One tap has already logged the start time.
export function Attack({ state, id, go, back }) {
  const now = useNow(15000);
  const ep = state.episodes.find((e) => e.id === id);
  if (!ep) return <div class="app attack"><div class="scroll"><p>This headache was deleted.</p><button class="btn" onClick={back}>Back</button></div></div>;
  const acute = state.meds.filter((m) => m.kind === 'acute' && m.active);
  const lastDose = (medId) => [...ep.meds].reverse().find((d) => d.medId === medId);

  const tapMed = (med) => {
    const existing = lastDose(med.id);
    // A second tap within a minute undoes a mis-tap; otherwise it logs another dose.
    if (existing && Date.now() - new Date(existing.time).getTime() < 60000) {
      editEpisode(id, (e) => { e.meds = e.meds.filter((d) => d.id !== existing.id); });
      cancelMedCheck(existing.id);
      return;
    }
    const doseId = logDose(id, med);
    scheduleMedCheck(id, { id: doseId, name: med.name, time: new Date().toISOString() });
  };

  return (
    <div class="app attack">
      <div class="scroll" style="gap: 26px">
        <div class="row between">
          <button type="button" class="iconbtn plain" aria-label="Close" onClick={back}><Icon name="x" size={22} /></button>
          <span class="small muted">Screen dimmed</span>
        </div>

        <div class="col g6" style="align-items: center; padding: 10px 0">
          <span class="small muted" style="font-size: 14px">Headache started {timeStr(ep.start)}</span>
          <span class="timer">{durationStr((ep.end ? new Date(ep.end) : now) - new Date(ep.start))}</span>
          <span class="small muted" style="font-size: 14px">{ep.end ? `Ended ${timeStr(ep.end)}` : 'Logged. Everything below is optional.'}</span>
        </div>

        <div class="col g10">
          <h3 class="muted">How bad?</h3>
          <SeverityPick tall value={ep.severity} onChange={(v) => editEpisode(id, (e) => { e.severity = v; })} />
        </div>

        <div class="col g10">
          <h3 class="muted">Took something</h3>
          <div class="col g8">
            {acute.map((m) => {
              const d = lastDose(m.id);
              const count = ep.meds.filter((x) => x.medId === m.id).length;
              return (
                <button type="button" key={m.id} class="btn" aria-pressed={d ? 'true' : 'false'} onClick={() => tapMed(m)}
                  style={`justify-content: space-between; min-height: 56px; border-radius: 16px; font-weight: 700; ${d ? 'border-color: var(--blue); background: var(--blue-soft); color: var(--blue-ink);' : 'background: var(--surface);'}`}>
                  <span class="row g10"><Icon name="pill" />{m.name} {m.dose}</span>
                  <span class="small muted">{d ? `Taken ${timeStr(d.time)}${count > 1 ? ` (x${count})` : ''}` : 'Tap to log'}</span>
                </button>
              );
            })}
            <button type="button" class="btn small" style="border-style: dashed; color: var(--muted)" onClick={() => go({ name: 'meds' })}>+ Something else</button>
          </div>
        </div>
      </div>

      <div class="footer">
        <button type="button" class="btn" onClick={() => go({ name: 'episode', id })}>Add full details</button>
        {!ep.end && (
          <button type="button" class="btn primary" style="min-height: 56px; font-size: 17px" onClick={() => { editEpisode(id, (e) => { e.end = new Date().toISOString(); }); back(); }}>Headache ended</button>
        )}
      </div>
    </div>
  );
}
