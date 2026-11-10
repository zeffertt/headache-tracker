import { monthSummary } from '../lib/logic.js';
import { MIN_DAYS, analyse } from '../lib/stats.js';
import { Section } from '../ui.jsx';

const pct = (r) => `${Math.round(r * 100)}%`;

function FactorRow({ f }) {
  return (
    <div class="card" style="gap: 6px">
      <span class="bold">{f.label}</span>
      <span class="small muted">Headache within 48 hours on {pct(f.withRate)} of {f.exposed} days with it, against {pct(f.withoutRate)} of {f.unexposed} days without.</span>
      {f.early && <span class="small" style="color: var(--blue)">Can be an early symptom of an attack rather than a cause.</span>}
    </div>
  );
}

export function Insights({ state }) {
  const r = analyse(state);
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleDateString('en-GB', { month: 'short' }), ...monthSummary(state, d.getFullYear(), d.getMonth()) });
  }
  const max = Math.max(1, ...months.map((m) => m.headache));

  return (
    <div class="scroll">
      <h1>Insights</h1>

      <Section title="Last 6 months">
        <div class="card">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; font-weight: 600">
            <thead><tr class="label"><th style="text-align: left; padding: 4px 0">Month</th><th style="text-align: left">Headache days</th><th>Migraine-type</th><th>Med days</th></tr></thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.label}>
                  <td style="padding: 6px 0; width: 44px">{m.label}</td>
                  <td><div class="row g8"><div class="bar grow"><div style={`width: ${(m.headache / max) * 100}%`} /></div><span style="width: 20px">{m.headache}</span></div></td>
                  <td style="text-align: center">{m.migraine}</td>
                  <td style="text-align: center">{m.medDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {!r.ready ? (
        <Section title="Triggers and protectors">
          <div class="card">
            <span class="big">{r.loggedDays} <span class="small muted">of {MIN_DAYS} days logged</span></span>
            <div class="bar"><div style={`width: ${Math.min(100, (r.loggedDays / MIN_DAYS) * 100)}%; background: var(--sage)`} /></div>
            <p class="small muted">Results appear after {MIN_DAYS} logged days. Fewer than that and patterns are mostly chance. Days count when they have a headache or a "no headache" tick.</p>
          </div>
        </Section>
      ) : (
        <>
          <Section title="Likely triggers" hint="Headaches followed these more often than your normal days.">
            {r.triggers.length ? r.triggers.map((f) => <FactorRow key={f.id} f={f} />) : <p class="small muted">Nothing stands out yet.</p>}
          </Section>
          <Section title="Likely protectors" hint="Headaches followed these less often than your normal days.">
            {r.protectors.length ? r.protectors.map((f) => <FactorRow key={f.id} f={f} />) : <p class="small muted">Nothing stands out yet.</p>}
          </Section>
          <details class="card">
            <summary class="row between"><h3>No clear link</h3><span class="small muted">{r.none.length}</span></summary>
            <p class="small muted" style="margin-top: 10px">{r.none.map((f) => f.label).join(', ') || 'None'}</p>
          </details>
          <details class="card">
            <summary class="row between"><h3>Not enough data</h3><span class="small muted">{r.insufficient.length}</span></summary>
            <p class="small muted" style="margin-top: 10px">Needs at least 5 days with and 5 without. {r.insufficient.map((f) => f.label).join(', ')}</p>
          </details>
          <p class="small muted">These are patterns in {r.loggedDays} days of your log, not proof of cause.</p>
        </>
      )}
    </div>
  );
}
