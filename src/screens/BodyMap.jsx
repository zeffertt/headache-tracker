import { useState } from 'preact/hooks';
import { BODY, HEAD, MARKS, describeBody, mapKey, sideName, zonesFor } from '../lib/bodyzones.js';
import { Chip } from '../ui.jsx';

const Shape = ({ shape, ...rest }) => (shape.t === 'rect'
  ? <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx} {...rest} />
  : <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...rest} />);

const VIEWS = [['head', 'Head'], ['upper', 'Upper body'], ['full', 'Full body']];

// Tap a zone to mark it with the selected type. Tap again to clear it.
export function BodyMap({ body = {}, onChange }) {
  const [view, setView] = useState('head');
  const [facing, setFacing] = useState('front');
  const [mark, setMark] = useState('pain');
  const key = mapKey(view, facing);
  const marks = body[key] || {};
  const zones = zonesFor(view, facing);
  const isHead = view === 'head';
  const viewBox = isHead ? HEAD.viewBox : view === 'upper' ? BODY.viewBoxUpper : BODY.viewBoxFull;

  const tap = (zid) => {
    const next = { ...body, [key]: { ...marks } };
    if (next[key][zid] === mark) delete next[key][zid]; else next[key][zid] = mark;
    if (!Object.keys(next[key]).length) delete next[key];
    onChange(next);
  };

  const zoneEl = (z) => (
    <Shape key={z.id} shape={z.shape} class={`zone ${marks[z.id] || ''}`} role="button" tabIndex={0}
      aria-label={`${sideName(z.side, facing)} ${z.label}${marks[z.id] ? `, marked ${marks[z.id]}` : ''}`}
      aria-pressed={marks[z.id] ? 'true' : 'false'}
      onClick={() => tap(z.id)} onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); tap(z.id); } }} />
  );
  const summary = describeBody(body);

  return (
    <div class="card">
      <div class="seg">{VIEWS.map(([v, l]) => <Chip key={v} cls="center" on={view === v} onClick={() => setView(v)}>{l}</Chip>)}</div>
      <div class="seg">
        <Chip cls="center" on={facing === 'front'} onClick={() => setFacing('front')}>Front</Chip>
        <Chip cls="center" on={facing === 'back'} onClick={() => setFacing('back')}>Back</Chip>
      </div>
      <div class="row wrap g8">
        {MARKS.map((m) => (
          <Chip key={m.id} on={mark === m.id} onClick={() => setMark(m.id)}>
            <span class="swatch" style={`background: var(--${m.id === 'pain' ? 'clay' : m.id === 'tingle' ? 'blue' : 'amber'})`} />{m.label}
          </Chip>
        ))}
      </div>

      <div class="row between small muted" style="padding: 0 8px"><span>Your {sideName('a', facing)}</span><span>Your {sideName('b', facing)}</span></div>
      <svg viewBox={viewBox} style={`width: 100%; max-height: ${view === 'full' ? 520 : 340}px`} role="group" aria-label={`${view} map, ${facing}`}>
        {isHead ? (
          <>
            {HEAD.neck.map(zoneEl)}
            <clipPath id="headclip"><Shape shape={HEAD.clip} /></clipPath>
            <g clip-path="url(#headclip)">{zones.filter((z) => !z.id.startsWith('neck')).map(zoneEl)}</g>
            <Shape shape={HEAD.clip} fill="none" stroke="var(--muted)" stroke-width="2" pointer-events="none" />
          </>
        ) : zones.map(zoneEl)}
      </svg>
      <p class="small muted">Pick a type, then tap where you feel it. Tap again to clear.</p>
      {summary && <p class="small" aria-live="polite">{summary}</p>}
    </div>
  );
}
