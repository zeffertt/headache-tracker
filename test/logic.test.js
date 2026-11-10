import { describe, expect, it } from 'vitest';
import { freshState } from '../src/lib/defaults.js';
import { addDays, dateKey, episodeDates } from '../src/lib/dates.js';
import { dayStatus, dayValue, headacheDays, isLate, isMigraineType, monthSummary, overuse } from '../src/lib/logic.js';
import { analyse, fisher } from '../src/lib/stats.js';

const at = (k, hm) => new Date(`${k}T${hm}:00`).toISOString();

describe('migraine-type rule', () => {
  it('needs two pain features plus an associated symptom', () => {
    expect(isMigraineType({ severity: 'severe', character: ['onesided'], symptoms: ['nausea'] })).toBe(true);
    expect(isMigraineType({ severity: 'severe', character: ['onesided'], symptoms: [] })).toBe(false);
    expect(isMigraineType({ severity: 'mild', character: ['onesided'], symptoms: ['nausea'] })).toBe(false);
  });
  it('accepts light plus sound sensitivity, but not light alone', () => {
    const base = { severity: 'moderate', character: ['pulsating'] };
    expect(isMigraineType({ ...base, symptoms: ['photophobia', 'phonophobia'] })).toBe(true);
    expect(isMigraineType({ ...base, symptoms: ['photophobia'] })).toBe(false);
  });
  it('counts any aura', () => {
    expect(isMigraineType({ aura: [{ type: 'motor' }] })).toBe(true);
  });
});

describe('days', () => {
  it('spreads an episode over midnight across both days', () => {
    expect(episodeDates({ start: at('2026-11-08', '22:00'), end: at('2026-11-09', '03:00') })).toEqual(['2026-11-08', '2026-11-09']);
  });
  it('takes the worst severity of the day and leaves unlogged days as none', () => {
    const s = freshState();
    s.episodes = [
      { start: at('2026-11-05', '09:00'), end: at('2026-11-05', '10:00'), severity: 'mild' },
      { start: at('2026-11-05', '15:00'), end: at('2026-11-05', '18:00'), severity: 'severe' },
    ];
    s.days['2026-11-06'] = { clear: true };
    const hd = headacheDays(s.episodes);
    expect(dayStatus('2026-11-05', s, hd)).toBe('severe');
    expect(dayStatus('2026-11-06', s, hd)).toBe('clear');
    expect(dayStatus('2026-11-07', s, hd)).toBe('none');
  });
  it('a headache overrides a "clear" tick', () => {
    const s = freshState();
    s.days['2026-11-05'] = { clear: true };
    s.episodes = [{ start: at('2026-11-05', '09:00'), end: at('2026-11-05', '10:00') }];
    expect(dayStatus('2026-11-05', s)).toBe('unrated');
  });
  it('flags entries written more than 48h after the day', () => {
    expect(isLate('2026-11-01', at('2026-11-03', '23:00'))).toBe(false);
    expect(isLate('2026-11-01', at('2026-11-04', '00:30'))).toBe(true);
  });
  it('manual values beat auto values', () => {
    expect(dayValue({ sleepHours: 5, auto: { sleepHours: 7 } }, 'sleepHours')).toEqual({ value: 5, source: 'manual' });
    expect(dayValue({ auto: { sleepHours: 7 } }, 'sleepHours')).toEqual({ value: 7, source: 'auto' });
    expect(dayValue({}, 'sleepHours').value).toBe(null);
  });
  it('summarises a month', () => {
    const s = freshState();
    s.days['2026-11-01'] = { clear: true };
    s.episodes = [{ start: at('2026-11-02', '09:00'), end: at('2026-11-02', '12:00'), severity: 'severe', character: ['onesided'], symptoms: ['nausea'], meds: [{ medId: 'ibuprofen', time: at('2026-11-02', '09:30') }] }];
    const m = monthSummary(s, 2026, 10, new Date('2026-11-04T12:00:00'));
    expect(m).toEqual({ headache: 1, migraine: 1, notLogged: 1, clear: 1, medDays: 1 });
  });
});

describe('medication overuse', () => {
  it('counts days not doses, per class, against 10 and 15', () => {
    const s = freshState();
    const meds = [];
    for (let d = 1; d <= 8; d++) meds.push({ medId: 'sumatriptan', time: at(`2026-11-0${d}`, '08:00') });
    meds.push({ medId: 'sumatriptan', time: at('2026-11-01', '14:00') });
    meds.push({ medId: 'paracetamol', time: at('2026-11-01', '15:00') });
    s.episodes = [{ start: at('2026-11-01', '07:00'), meds }];
    const o = overuse(s, '2026-11');
    expect(o.worst.cls).toBe('triptan');
    expect(o.worst.days).toBe(8);
    expect(o.level).toBe('near');
    expect(o.rows.find((r) => r.cls === 'simple').days).toBe(1);
    expect(o.totalDays).toBe(8);
    expect(overuse(s, '2026-10').totalDays).toBe(0);
  });
});

describe('stats', () => {
  it('fisher matches known values', () => {
    expect(fisher(3, 1, 1, 3)).toBeCloseTo(0.4857, 3);
    expect(fisher(10, 0, 0, 10)).toBeLessThan(0.0001);
  });
  it('stays locked under 90 logged days', () => {
    const s = freshState();
    s.days['2026-11-01'] = { clear: true };
    const r = analyse(s, new Date('2026-11-02T12:00:00'));
    expect(r.loggedDays).toBe(1);
    expect(r.ready).toBe(false);
  });
  it('finds a trigger, a protector, and ignores unlogged days', () => {
    const s = freshState();
    let k = '2026-01-01';
    for (let i = 0; i < 120; i++, k = addDays(k, 1)) {
      if (i % 10 === 9) continue; // unlogged gap
      const alcohol = i % 6 === 0;
      const exercise = i % 3 === 1;
      s.days[k] = { clear: true, triggers: [alcohol && 'alcohol', exercise && 'exercise'].filter(Boolean) };
    }
    // headache the day after every alcohol day; a few stray ones on non-exercise days
    k = '2026-01-01';
    for (let i = 0; i < 120; i++, k = addDays(k, 1)) {
      if (i % 6 === 1 || (i % 15 === 3)) s.episodes.push({ start: at(k, '09:00'), end: at(k, '12:00'), severity: 'moderate' });
    }
    const r = analyse(s, new Date('2026-06-01T12:00:00'));
    expect(r.ready).toBe(true);
    expect(r.triggers.map((t) => t.id)).toContain('alcohol');
    expect(r.insufficient.map((t) => t.id)).toContain('cheese');
    const alc = r.triggers.find((t) => t.id === 'alcohol');
    expect(alc.withRate).toBeGreaterThan(alc.withoutRate);
  });
  it('dateKey is local', () => {
    expect(dateKey(new Date(2026, 10, 9, 23, 59))).toBe('2026-11-09');
  });
});
