import { dayStatus, dayValue } from '../lib/logic.js';
import { editDay, toggleDayItem } from '../lib/store.js';
import { Chip, ChipList, Icon, NumField, Pick, Section } from '../ui.jsx';

function AutoNote({ day, field, unit, fmt = (v) => v }) {
  const auto = day?.auto?.[field];
  if (auto == null) return null;
  const overridden = day[field] != null && day[field] !== '';
  return <span class="small muted row g6"><Icon name="watch" size={14} />{fmt(auto)}{unit} from Health Connect{overridden ? ' (your entry is used)' : ''}</span>;
}

// Everything logged against a day rather than a headache. Every field is optional.
export function DayForm({ k, state, isToday, go }) {
  const day = state.days[k] || {};
  const status = dayStatus(k, state);
  const hasHeadache = !['clear', 'none'].includes(status);
  const preventives = state.meds.filter((m) => m.kind === 'preventive' && m.active);
  const set = (field) => (v) => editDay(k, (d) => { if (v == null) delete d[field]; else d[field] = v; });

  return (
    <>
      <div class="card">
        <div class="row between g8">
          <h3>{isToday ? 'Last night' : 'Sleep'}</h3>
          <div class="row g8">
            <NumField label="Hours slept" value={day.sleepHours} onChange={set('sleepHours')} step="0.5" placeholder={day.auto?.sleepHours ?? 'hrs'} />
            <span class="small muted">hours</span>
          </div>
        </div>
        <AutoNote day={day} field="sleepHours" unit="h" />
        <Pick cls="sage" value={day.sleepQuality ?? null} onChange={set('sleepQuality')} options={[['poor', 'Poor'], ['ok', 'OK'], ['good', 'Good']]} />
      </div>

      <details class="card">
        <summary class="row between"><h3>Exercise, water, caffeine</h3><span class="small muted">Optional</span></summary>
        <div class="col g12" style="margin-top: 12px">
          <div class="row between g8"><span class="bold">Exercise</span><div class="row g8"><NumField label="Minutes of exercise" value={day.exerciseMin} onChange={set('exerciseMin')} step="5" placeholder={day.auto?.exerciseMin ?? 'min'} /><span class="small muted" style="width: 44px">min</span></div></div>
          <AutoNote day={day} field="exerciseMin" unit=" min" />
          <div class="row between g8"><span class="bold">Water</span><div class="row g8"><NumField label="Litres of water" value={day.waterL} onChange={set('waterL')} step="0.25" placeholder={day.auto?.waterL ?? 'litres'} /><span class="small muted" style="width: 44px">litres</span></div></div>
          <AutoNote day={day} field="waterL" unit=" litres" />
          <div class="row between g8"><span class="bold">Caffeine</span><div class="row g8"><NumField label="Caffeine drinks" value={day.caffeine} onChange={set('caffeine')} step="1" placeholder="0" /><span class="small muted" style="width: 44px">drinks</span></div></div>
          {day.auto?.steps != null && <span class="small muted row g6"><Icon name="watch" size={14} />{day.auto.steps.toLocaleString('en-GB')} steps{day.auto.restingHr ? `, resting heart rate ${day.auto.restingHr}` : ''}{day.auto.kcal ? `, ${day.auto.kcal} kcal eaten` : ''}</span>}
        </div>
      </details>

      {preventives.length > 0 && (
        <div class="card">
          <h3>Preventive meds</h3>
          <div class="row wrap g8">
            {preventives.map((m) => (
              <Chip key={m.id} cls="sage" icon="pill" on={(day.prevTaken || []).includes(m.id)} onClick={() => toggleDayItem(k, 'prevTaken', m.id)}>{m.name} {m.dose}</Chip>
            ))}
          </div>
        </div>
      )}

      <Section title={isToday ? 'What happened today' : 'What happened'} action={<button type="button" class="link" onClick={() => go({ name: 'lists', list: 'triggers' })}>Edit list</button>}>
        <ChipList items={state.lists.triggers} selected={day.triggers} onToggle={(id) => toggleDayItem(k, 'triggers', id)} />
      </Section>

      {!hasHeadache && (
        <button type="button" class={`btn sage ${day.clear ? 'on' : ''}`} aria-pressed={day.clear ? 'true' : 'false'} onClick={() => editDay(k, (d) => { d.clear = !d.clear; })}>
          <Icon name="check" stroke={2.2} />{day.clear ? `Logged: no headache${isToday ? ' today' : ''}` : `No headache${isToday ? ' today' : ''}`}
        </button>
      )}

      <div class="col g8">
        <label class="label" for="daynote">Day note</label>
        <textarea id="daynote" class="field" rows="3" placeholder="Anything worth remembering about this day" value={day.note || ''} onInput={(ev) => set('note')(ev.currentTarget.value || null)} />
      </div>
      {day.late && <span class="small muted">Added later: first logged more than 48 hours after the day.</span>}
    </>
  );
}
