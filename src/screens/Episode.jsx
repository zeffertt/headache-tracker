import { useState } from 'preact/hooks';
import { AURA_TYPES } from '../lib/defaults.js';
import { durationStr, fromLocalInput, toLocalInput } from '../lib/dates.js';
import { isMigraineType } from '../lib/logic.js';
import { cancelMedCheck, scheduleMedCheck } from '../lib/notify.js';
import { deleteEpisode, editEpisode, logDose } from '../lib/store.js';
import { Chip, ChipList, Icon, NumField, Pick, Section, TopBar } from '../ui.jsx';
import { SeverityPick } from './Attack.jsx';
import { BodyMap } from './BodyMap.jsx';

const YES_NO = [[true, 'Yes'], [false, 'No']];
const HELPED = [['yes', 'Helped'], ['partly', 'Partly'], ['no', 'No']];

const toggleIn = (arr, id) => { const i = arr.indexOf(id); i < 0 ? arr.push(id) : arr.splice(i, 1); };

function DoseCard({ ep, dose, edit }) {
  const delay = new Date(dose.time) - new Date(ep.start);
  const setDose = (fn) => edit((e) => { const d = e.meds.find((x) => x.id === dose.id); if (d) fn(d); });
  return (
    <div class="card">
      <div class="row between g8">
        <span class="bold row g8"><Icon name="pill" />{dose.name} {dose.dose}</span>
        <button type="button" class="iconbtn plain" aria-label={`Remove ${dose.name}`} onClick={() => { edit((e) => { e.meds = e.meds.filter((x) => x.id !== dose.id); }); cancelMedCheck(dose.id); }}><Icon name="trash" /></button>
      </div>
      <div class="col g6">
        <label class="label" for={`t-${dose.id}`}>Taken at</label>
        <input id={`t-${dose.id}`} class="field" type="datetime-local" value={toLocalInput(dose.time)}
          onChange={(ev) => { if (ev.currentTarget.value) setDose((d) => { d.time = fromLocalInput(ev.currentTarget.value); }); }} />
        <span class="small muted">{delay >= 0 ? `${durationStr(delay)} after it started` : 'Before the recorded start'}</span>
      </div>
      <div class="col g6"><span class="label">Pain-free at 2 hours?</span><Pick value={dose.painFree2h} options={YES_NO} onChange={(v) => setDose((d) => { d.painFree2h = v; })} /></div>
      <div class="col g6"><span class="label">Came back within 24 hours?</span><Pick value={dose.returned24h} options={YES_NO} onChange={(v) => setDose((d) => { d.returned24h = v; })} /></div>
      <div class="col g6">
        <label class="label" for={`s-${dose.id}`}>Side effects</label>
        <input id={`s-${dose.id}`} class="field" type="text" placeholder="None" value={dose.sideEffects || ''} onInput={(ev) => setDose((d) => { d.sideEffects = ev.currentTarget.value; })} />
      </div>
    </div>
  );
}

// Full details for one headache. Every section is optional.
export function Episode({ state, id, go, back }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ep = state.episodes.find((e) => e.id === id);
  if (!ep) return <div class="scroll"><TopBar title="Headache" onBack={back} /><p>This headache was deleted.</p></div>;
  const edit = (fn) => editEpisode(id, fn);
  const acute = state.meds.filter((m) => m.kind === 'acute' && m.active);
  const reliefOf = (rid) => ep.relief.find((r) => r.id === rid);
  const auraOf = (type) => ep.aura.find((a) => a.type === type);

  return (
    <div class="scroll">
      <TopBar title="Headache details" onBack={back} />
      {ep.late && <span class="small muted">Added later: first logged more than 48 hours after it happened.</span>}

      <div class="card">
        <div class="col g6">
          <label class="label" for="ep-start">Started</label>
          <input id="ep-start" class="field" type="datetime-local" value={toLocalInput(ep.start)} onChange={(ev) => { if (ev.currentTarget.value) edit((e) => { e.start = fromLocalInput(ev.currentTarget.value); }); }} />
        </div>
        <div class="col g6">
          <label class="label" for="ep-end">Ended</label>
          <input id="ep-end" class="field" type="datetime-local" min={toLocalInput(ep.start)} value={ep.end ? toLocalInput(ep.end) : ''}
            onChange={(ev) => { const v = ev.currentTarget.value; edit((e) => { e.end = v && fromLocalInput(v) > e.start ? fromLocalInput(v) : null; }); }} />
          <span class="small muted">{ep.end ? `Lasted ${durationStr(new Date(ep.end) - new Date(ep.start))}` : 'Still going. Leave blank until it ends.'}</span>
        </div>
      </div>

      <Section title="How bad">
        <SeverityPick value={ep.severity} onChange={(v) => edit((e) => { e.severity = v; })} />
        <div class="row between g12">
          <label class="small muted" for="pain10">Pain score, 0 to 10 (optional)</label>
          <NumField label="Pain score 0 to 10" value={ep.pain10} step="1" placeholder="-" onChange={(v) => edit((e) => { e.pain10 = v == null ? null : Math.max(0, Math.min(10, Math.round(v))); })} />
        </div>
      </Section>

      <Section title="What it feels like">
        <ChipList items={state.lists.character} selected={ep.character} onToggle={(cid) => edit((e) => toggleIn(e.character, cid))} />
      </Section>

      <Section title="Where" hint="Mark pain, tingling or numbness, and weakness on the head or body.">
        <BodyMap body={ep.body} onChange={(b) => edit((e) => { e.body = b; })} />
      </Section>

      <Section title="Aura" hint="Changes to vision, feeling, speech or strength, usually before the pain.">
        <div class="row wrap g8">
          {AURA_TYPES.map((a) => (
            <Chip key={a.id} icon={a.icon} on={!!auraOf(a.id)} onClick={() => edit((e) => { const i = e.aura.findIndex((x) => x.type === a.id); i < 0 ? e.aura.push({ type: a.id, start: e.start, durationMin: null }) : e.aura.splice(i, 1); })}>{a.label}</Chip>
          ))}
        </div>
        {ep.aura.map((a) => {
          const def = AURA_TYPES.find((x) => x.id === a.type);
          const setAura = (fn) => edit((e) => { const x = e.aura.find((y) => y.type === a.type); if (x) fn(x); });
          return (
            <div class="card" key={a.type}>
              <span class="bold">{def?.label}</span>
              <div class="col g6">
                <label class="label" for={`a-${a.type}`}>Started</label>
                <input id={`a-${a.type}`} class="field" type="datetime-local" value={toLocalInput(a.start)} onChange={(ev) => { if (ev.currentTarget.value) setAura((x) => { x.start = fromLocalInput(ev.currentTarget.value); }); }} />
              </div>
              <div class="row between g8"><span class="small muted">Lasted</span><div class="row g8"><NumField label={`${def?.label} duration in minutes`} value={a.durationMin} step="5" placeholder="min" onChange={(v) => setAura((x) => { x.durationMin = v; })} /><span class="small muted">minutes</span></div></div>
            </div>
          );
        })}
      </Section>

      <Section title="Symptoms" action={<button type="button" class="link" onClick={() => go({ name: 'lists', list: 'symptoms' })}>Edit list</button>}>
        <ChipList items={state.lists.symptoms} selected={ep.symptoms} onToggle={(sid) => edit((e) => toggleIn(e.symptoms, sid))} />
      </Section>

      <Section title="Warning signs before" hint="Things you noticed in the hours before it started.">
        <ChipList items={state.lists.prodrome} selected={ep.prodrome} onToggle={(sid) => edit((e) => toggleIn(e.prodrome, sid))} />
      </Section>

      <Section title="Medication">
        {ep.meds.map((d) => <DoseCard key={d.id} ep={ep} dose={d} edit={edit} />)}
        <div class="row wrap g8">
          {acute.map((m) => (
            <Chip key={m.id} icon="plus" onClick={() => { const time = ep.end ? ep.start : new Date().toISOString(); const doseId = logDose(id, m, time); scheduleMedCheck(id, { id: doseId, name: m.name, time }); }}>{m.name} {m.dose}</Chip>
          ))}
          <button type="button" class="link" onClick={() => go({ name: 'meds' })}>Manage meds</button>
        </div>
      </Section>

      <Section title="What else you tried" action={<button type="button" class="link" onClick={() => go({ name: 'lists', list: 'relief' })}>Edit list</button>}>
        <ChipList items={state.lists.relief} selected={ep.relief.map((r) => r.id)} onToggle={(rid) => edit((e) => { const i = e.relief.findIndex((r) => r.id === rid); i < 0 ? e.relief.push({ id: rid, helped: null }) : e.relief.splice(i, 1); })} />
        {ep.relief.map((r) => {
          const def = state.lists.relief.find((x) => x.id === r.id);
          return (
            <div class="col g6" key={r.id}>
              <span class="label">{def?.label || r.id}: did it help?</span>
              <Pick value={r.helped} options={HELPED} onChange={(v) => edit((e) => { const x = e.relief.find((y) => y.id === r.id); if (x) x.helped = v; })} />
            </div>
          );
        })}
      </Section>

      <Section title="Impact">
        <ChipList items={state.lists.impact} selected={ep.impact} onToggle={(iid) => edit((e) => toggleIn(e.impact, iid))} />
      </Section>

      <Section title="Afterwards" hint="How you felt once the pain had gone.">
        <ChipList items={state.lists.postdrome} selected={ep.postdrome} onToggle={(sid) => edit((e) => toggleIn(e.postdrome, sid))} />
      </Section>

      <div class="col g8">
        <label class="label" for="ep-note">Notes</label>
        <textarea id="ep-note" class="field" rows="4" placeholder="Anything specific about this one" value={ep.note || ''} onInput={(ev) => edit((e) => { e.note = ev.currentTarget.value; })} />
      </div>

      {isMigraineType(ep) && <span class="small muted">Counted as a migraine-type day, based on what you logged. A label for the diary, not a diagnosis.</span>}

      {confirmDelete ? (
        <div class="grid2">
          <button type="button" class="btn" onClick={() => setConfirmDelete(false)}>Keep it</button>
          <button type="button" class="btn danger" onClick={() => { ep.meds.forEach((d) => cancelMedCheck(d.id)); deleteEpisode(id); back(); }}>Delete</button>
        </div>
      ) : (
        <button type="button" class="btn danger" onClick={() => setConfirmDelete(true)}><Icon name="trash" />Delete this headache</button>
      )}
    </div>
  );
}
