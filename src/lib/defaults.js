// Preset lists. Everything here is editable in the app (Settings > Edit lists).
// `early: true` marks items that research suggests can be early symptoms of an attack rather than causes.

const c = (id, label, icon, extra = {}) => ({ id, label, icon, ...extra });

export const DEFAULT_LISTS = {
  triggers: [
    c('poorsleep', 'Poor sleep', 'bed', { group: 'Sleep' }),
    c('latenight', 'Late night', 'moon', { group: 'Sleep' }),
    c('overslept', 'Overslept', 'sun', { group: 'Sleep' }),
    c('longday', 'Long work day', 'brief', { group: 'Work' }),
    c('earlystart', 'Early start', 'alarm', { group: 'Work' }),
    c('latefinish', 'Late finish', 'clock', { group: 'Work' }),
    c('screen', 'Long screen time', 'screen', { group: 'Work' }),
    c('stress', 'Stressful day', 'zap', { group: 'Work' }),
    c('letdown', 'Relaxing after stress', 'leaf', { group: 'Work' }),
    c('skippedmeal', 'Skipped meal', 'plate', { group: 'Food and drink' }),
    c('lowwater', 'Low water', 'drop', { group: 'Food and drink' }),
    c('alcohol', 'Alcohol', 'glass', { group: 'Food and drink' }),
    c('morecaf', 'More caffeine', 'cup', { group: 'Food and drink' }),
    c('lesscaf', 'Less caffeine', 'cup', { group: 'Food and drink' }),
    c('cheese', 'Cheese', 'food', { group: 'Trigger foods' }),
    c('chocolate', 'Chocolate', 'food', { group: 'Trigger foods', early: true }),
    c('curedmeat', 'Cured meat', 'food', { group: 'Trigger foods' }),
    c('citrus', 'Citrus', 'food', { group: 'Trigger foods' }),
    c('msg', 'MSG', 'food', { group: 'Trigger foods' }),
    c('sweetener', 'Artificial sweetener', 'food', { group: 'Trigger foods' }),
    c('brightlight', 'Bright light', 'sun', { group: 'Environment and body', early: true }),
    c('strongsmell', 'Strong smell', 'wind', { group: 'Environment and body', early: true }),
    c('loudnoise', 'Loud noise', 'sound', { group: 'Environment and body' }),
    c('travel', 'Travel', 'travel', { group: 'Environment and body' }),
    c('exercise', 'Exercise', 'gym', { group: 'Environment and body' }),
    c('necktension', 'Neck tension', 'neck', { group: 'Environment and body', early: true }),
    c('illness', 'Feeling ill', 'thermo', { group: 'Environment and body' }),
  ],
  character: [
    c('onesided', 'One-sided', 'half'),
    c('bothsides', 'Both sides', 'circle'),
    c('pulsating', 'Throbbing / pulsating', 'pulse'),
    c('pressing', 'Pressing / tight', 'press'),
    c('stabbing', 'Stabbing', 'zap'),
    c('worsemove', 'Worse with movement', 'gym'),
  ],
  symptoms: [
    c('photophobia', 'Light sensitivity (photophobia)', 'sun', { group: 'Common' }),
    c('phonophobia', 'Sound sensitivity', 'sound', { group: 'Common' }),
    c('osmophobia', 'Smell sensitivity', 'wind', { group: 'Common' }),
    c('nausea', 'Nausea', 'wave', { group: 'Common' }),
    c('vomiting', 'Vomiting', 'wave', { group: 'Common' }),
    c('dizziness', 'Dizziness or vertigo', 'spin', { group: 'Common' }),
    c('brainfog', 'Brain fog', 'cloud', { group: 'Common' }),
    c('allodynia', 'Scalp tenderness', 'hand', { group: 'Common' }),
    c('neckpain', 'Neck pain', 'neck', { group: 'Common' }),
    c('wateryeye', 'Watery or red eye', 'eye', { group: 'Eye and nose' }),
    c('blockednose', 'Blocked or runny nose', 'drop', { group: 'Eye and nose' }),
    c('droopylid', 'Drooping eyelid', 'eye', { group: 'Eye and nose' }),
    c('restless', "Restless, can't keep still", 'pulse', { group: 'Eye and nose' }),
    c('wokeme', 'Woke me from sleep', 'moon', { group: 'Eye and nose' }),
  ],
  prodrome: [
    c('yawning', 'Yawning', 'moon'),
    c('neckstiff', 'Neck stiffness', 'neck'),
    c('cravings', 'Food cravings', 'food'),
    c('moodchange', 'Mood change', 'wave'),
    c('tired', 'Unusually tired', 'bed'),
    c('lightbother', 'Light bothering me', 'sun'),
    c('smellbother', 'Smells bothering me', 'wind'),
    c('thirsty', 'Thirsty', 'drop'),
    c('concentration', 'Hard to concentrate', 'cloud'),
  ],
  postdrome: [
    c('wipedout', 'Wiped out', 'bed'),
    c('foggy', 'Foggy', 'cloud'),
    c('sorehead', 'Sore head', 'hand'),
    c('lowmood', 'Low mood', 'wave'),
    c('hungry', 'Hungry', 'food'),
    c('feltfine', 'Felt fine', 'check'),
  ],
  relief: [
    c('darkroom', 'Dark room', 'moon'),
    c('sleep', 'Sleep', 'bed'),
    c('coldpack', 'Cold pack', 'snow'),
    c('sunglasses', 'Sunglasses', 'glasses'),
    c('heat', 'Heat pad', 'thermo'),
    c('quiet', 'Quiet', 'sound'),
    c('fluids', 'Fluids', 'drop'),
    c('caffeine', 'Caffeine', 'cup'),
  ],
  impact: [
    c('missedwork', 'Missed work', 'brief'),
    c('cutshort', 'Work cut short', 'clock'),
    c('lessdone', 'Got less done', 'screen'),
    c('cancelled', 'Cancelled plans', 'cal'),
    c('liedown', 'Had to lie down', 'bed'),
  ],
};

export const AURA_TYPES = [
  { id: 'visual', label: 'Visual', icon: 'eye' },
  { id: 'sensory', label: 'Tingling or numbness', icon: 'hand' },
  { id: 'speech', label: 'Speech trouble', icon: 'speech' },
  { id: 'motor', label: 'Weakness', icon: 'gym' },
];

// cls drives the medication-overuse counter: 'simple' limit is 15 days a month, the others 10.
export const MED_CLASSES = [
  { id: 'simple', label: 'Simple painkiller (paracetamol, ibuprofen, aspirin)', limit: 15 },
  { id: 'triptan', label: 'Triptan', limit: 10 },
  { id: 'opioid', label: 'Codeine or other opioid', limit: 10 },
  { id: 'combo', label: 'Combination painkiller', limit: 10 },
  { id: 'other', label: 'Other (not counted)', limit: null },
];

export const DEFAULT_MEDS = [
  { id: 'paracetamol', name: 'Paracetamol', dose: '1g', kind: 'acute', cls: 'simple', active: true },
  { id: 'ibuprofen', name: 'Ibuprofen', dose: '400mg', kind: 'acute', cls: 'simple', active: true },
  { id: 'sumatriptan', name: 'Sumatriptan', dose: '50mg', kind: 'acute', cls: 'triptan', active: true },
];

export const STOP_REASONS = ['Did not work', 'Side effects', 'No longer needed', 'Other'];

export const DEFAULT_SETTINGS = {
  theme: 'system', // system | light | dark
  reminderOn: true,
  reminderTime: '20:30',
  medCheckOn: true,
  weatherOn: true,
  healthOn: false,
  location: { lat: 51.4275, lon: -0.168, name: 'London' },
};

export function freshState() {
  return {
    v: 1,
    settings: structuredClone(DEFAULT_SETTINGS),
    lists: structuredClone(DEFAULT_LISTS),
    meds: structuredClone(DEFAULT_MEDS),
    days: {},
    episodes: [],
  };
}
