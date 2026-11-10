import { useState } from 'preact/hooks';
import { dateKey, timeStr } from '../lib/dates.js';
import { dosesOn, openEpisode } from '../lib/logic.js';
import { cancelMedCheck, scheduleMedCheck } from '../lib/notify.js';
import { logDose, logOtherDose, removeDose, startEpisode } from '../lib/store.js';
import { Icon } from '../ui.jsx';

// One-tap painkillers on the Today screen.
// With a headache open, a tap logs against it. Otherwise it asks what the dose was for.
export function QuickMeds({ state, go }) {
  const [pending, setPending] = useState(null);
  const today = dateKey();
  const open = openEpisode(state);
  const acute = state.meds.filter((m) => m.kind === 'acute' && m.active);
  const taken = dosesOn(state, today);

  const forHeadache = (med) => {
    const epId = open ? open.id : startEpisode();
    const time = new Date().toISOString();
    const doseId = logDose(epId, med, time);
    scheduleMedCheck(epId, { id: doseId, name: med.name, time });
    setPending(null);
  };
  const forOther = (med) => { logOtherDose(med); setPending(null); };
  const tap = (med) => {
    if (open) forHeadache(med);
    else setPending(pending?.id === med.id ? null : med);
  };

  return (
    <div class="card">
      <div class="row between g8">
        <h3>Took a painkiller</h3>
        <button type="button" class="link" onClick={() => go({ name: 'meds' })}>Manage</button>
      </div>
      <div class="row wrap g8">
        {acute.map((m) => (
          <button type="button" key={m.id} class={`chip ${pending?.id === m.id ? 'on' : ''}`} aria-expanded={pending?.id === m.id ? 'true' : 'false'} onClick={() => tap(m)}>
            <Icon name="pill" size={16} />{m.name} {m.dose}
          </button>
        ))}
      </div>
      {open && <span class="small muted">Logs against the headache in progress.</span>}

      {pending && (
        <div class="col g8" role="group" aria-label={`What was the ${pending.name} for?`}>
          <span class="small bold">What was the {pending.name} for?</span>
          <div class="grid2">
            <button type="button" class="btn small" onClick={() => forHeadache(pending)}>A headache</button>
            <button type="button" class="btn small" onClick={() => forOther(pending)}>Something else</button>
          </div>
          <span class="small muted">"Something else" still counts towards med days, as rebound headaches come from how often you take painkillers.</span>
        </div>
      )}

      {taken.length > 0 && (
        <div class="col g6">
          <span class="label">Taken today</span>
          {taken.map((d) => (
            <div class="row between g8" key={d.id}>
              <span class="small">
                <span class="bold">{timeStr(d.time)}</span> {d.name} {d.dose}
                <span class="muted"> · {d.episodeId ? 'headache' : 'something else'}</span>
              </span>
              <button type="button" class="iconbtn plain" aria-label={`Remove ${d.name} at ${timeStr(d.time)}`}
                onClick={() => { removeDose(d); if (d.episodeId) cancelMedCheck(d.id); }}><Icon name="x" size={18} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
