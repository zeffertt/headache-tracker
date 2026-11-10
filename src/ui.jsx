const PATHS = {
  bed: 'M3 18V6M3 13h18v5M21 13a3 3 0 0 0-3-3h-8v3M6.5 9.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  alarm: 'M12 9v4l3 2M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM5 3 2 6M19 3l3 3',
  clock: 'M12 7v5l-3 3M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  brief: 'M3 8h18v12H3zM8 8V5h8v3M3 13h18',
  screen: 'M3 4h18v12H3zM8 20h8M12 16v4',
  zap: 'M13 2 4 14h7l-1 8 9-12h-7l1-8z',
  plate: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  glass: 'M7 3h10l-1 7a4 4 0 0 1-8 0L7 3zM12 14v7M8 21h8',
  cup: 'M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8zM17 10h2a2 2 0 0 1 0 4h-2M8 2v3M12 2v3',
  wind: 'M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7',
  sound: 'M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12',
  travel: 'M3 17h18M5 17l2-6h10l2 6M7 11V8h10v3M7 20a1 1 0 1 0 0-.01M17 20a1 1 0 1 0 0-.01',
  gym: 'M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12',
  leaf: 'M5 19c0-9 5-14 15-14 0 10-5 15-14 15M5 19l8-8',
  food: 'M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 2-3 5-3 8h3zM17 11v10',
  neck: 'M9 3v6c0 3-5 4-5 9M15 3v6c0 3 5 4 5 9M9 9h6',
  thermo: 'M12 3a2 2 0 0 0-2 2v9a4 4 0 1 0 4 0V5a2 2 0 0 0-2-2z',
  half: 'M12 3a9 9 0 1 0 0 18zM12 3a9 9 0 0 1 0 18',
  circle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  pulse: 'M2 12h5l2-6 4 12 2-6h7',
  press: 'M4 8h16M4 16h16M9 4l3 4 3-4M9 20l3-4 3 4',
  wave: 'M2 9c3-4 5-4 8 0s5 4 8 0M2 16c3-4 5-4 8 0s5 4 8 0',
  spin: 'M20 12a8 8 0 1 1-3-6.2M20 4v4h-4',
  cloud: 'M7 18a4 4 0 0 1 0-8 6 6 0 0 1 11 1 3.5 3.5 0 0 1 0 7z',
  hand: 'M8 12V5a1.5 1.5 0 0 1 3 0v6V4a1.5 1.5 0 0 1 3 0v7V6a1.5 1.5 0 0 1 3 0v9a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 3-1l2 2',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  speech: 'M4 5h16v11H9l-5 4z',
  snow: 'M12 2v20M4 7l16 10M20 7 4 17',
  glasses: 'M2 13a4 4 0 1 0 8 0 4 4 0 0 0-8 0zM14 13a4 4 0 1 0 8 0 4 4 0 0 0-8 0zM10 13h4M2 13l2-7M22 13l-2-7',
  cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  check: 'M5 12l5 5 9-10',
  plus: 'M12 5v14M5 12h14',
  x: 'M6 6l12 12M18 6 6 18',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  up: 'M6 15l6-6 6 6',
  down: 'M6 9l6 6 6-6',
  home: 'M3 11 12 4l9 7v9h-6v-6H9v6H3z',
  bars: 'M5 20v-7M12 20V5M19 20v-11',
  pill: 'M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 7l7 7',
  sliders: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M14 4v4M8 10v4M16 16v4',
  watch: 'M8 7h8v10H8zM9 7l1-4h4l1 4M9 17l1 4h4l1-4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  arrowdown: 'M12 4v16M6 14l6 6 6-6',
  arrowup: 'M12 20V4M6 10l6-6 6 6',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
};

export function Icon({ name, size = 18, stroke = 1.9 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={stroke} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex: 0 0 auto">
      <path d={PATHS[name] || PATHS.circle} />
    </svg>
  );
}
export const ICON_NAMES = Object.keys(PATHS);

export function Chip({ on, onClick, icon, children, cls = '' }) {
  return (
    <button type="button" class={`chip ${on ? 'on' : ''} ${cls}`} aria-pressed={on ? 'true' : 'false'} onClick={onClick}>
      {icon && <Icon name={icon} size={16} />}{children}
    </button>
  );
}

// Chips for a list of {id,label,icon,group?}. Groups get a small heading each.
export function ChipList({ items, selected = [], onToggle }) {
  const visible = items.filter((i) => !i.hidden || selected.includes(i.id));
  const groups = [];
  for (const it of visible) {
    const g = it.group || '';
    let entry = groups.find((x) => x.name === g);
    if (!entry) groups.push((entry = { name: g, items: [] }));
    entry.items.push(it);
  }
  return (
    <div class="col g16">
      {groups.map((g) => (
        <div class="col g8" key={g.name}>
          {g.name && <span class="label">{g.name}</span>}
          <div class="row wrap g8">
            {g.items.map((it) => (
              <Chip key={it.id} on={selected.includes(it.id)} icon={it.icon} onClick={() => onToggle(it.id)}>{it.label}</Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Section({ title, hint, children, action }) {
  return (
    <section class="col g10">
      <div class="row between g8">
        <h2>{title}</h2>
        {action}
      </div>
      {hint && <p class="small muted">{hint}</p>}
      {children}
    </section>
  );
}

export function TopBar({ title, onBack, right }) {
  return (
    <div class="topbar">
      {onBack && <button type="button" class="iconbtn plain" aria-label="Back" onClick={onBack}><Icon name="left" size={22} /></button>}
      <h1 class="grow" style="font-size: 24px">{title}</h1>
      {right}
    </div>
  );
}

// Three-way yes / partly / no style picker stored as a string or null.
export function Pick({ value, options, onChange, cls = '' }) {
  return (
    <div class="seg">
      {options.map(([v, label]) => (
        <Chip key={String(v)} on={value === v} cls={`center ${cls}`} onClick={() => onChange(value === v ? null : v)}>{label}</Chip>
      ))}
    </div>
  );
}

export function NumField({ value, onChange, placeholder, step = 'any', min = 0, label }) {
  return (
    <input class="field num" type="number" inputMode="decimal" aria-label={label} min={min} step={step} placeholder={placeholder}
      value={value ?? ''} onInput={(ev) => { const v = ev.currentTarget.value; onChange(v === '' ? null : Number(v)); }} />
  );
}
