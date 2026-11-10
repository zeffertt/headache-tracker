// Tap zones for the body maps. Shapes are drawn as seen from the FRONT:
// the person's right side is on the viewer's left. Back views flip the side labels.

const r = (x, y, w, h, rx = 8) => ({ t: 'rect', x, y, w, h, rx });
const e = (cx, cy, rx, ry) => ({ t: 'ellipse', cx, cy, rx, ry });

// Left-of-image / right-of-image pair, mirrored around x = 100.
const pair = (id, label, shape) => {
  const mirror = shape.t === 'rect' ? { ...shape, x: 200 - shape.x - shape.w } : { ...shape, cx: 200 - shape.cx };
  return [{ id: `${id}_a`, label, side: 'a', shape }, { id: `${id}_b`, label, side: 'b', shape: mirror }];
};

// Head: rectangles clipped to a head outline, plus the neck.
export const HEAD = {
  viewBox: '0 0 200 230',
  clip: e(100, 95, 72, 88),
  front: [
    ...pair('forehead', 'forehead', r(28, 5, 72, 55, 0)),
    ...pair('temple', 'temple', r(28, 60, 30, 48, 0)),
    ...pair('eye', 'eye', r(58, 60, 42, 48, 0)),
    ...pair('cheek', 'cheek', r(28, 108, 72, 38, 0)),
    ...pair('jaw', 'jaw', r(28, 146, 72, 40, 0)),
  ],
  back: [
    ...pair('crown', 'crown', r(28, 5, 72, 60, 0)),
    ...pair('backhead', 'back of head', r(28, 65, 72, 62, 0)),
    ...pair('skullbase', 'base of skull', r(28, 127, 72, 59, 0)),
  ],
  neck: pair('neck', 'neck', r(72, 180, 28, 46, 6)),
};

// Whole figure. The upper-body view is the same figure cropped at the waist.
export const BODY = {
  viewBoxFull: '0 0 200 430',
  viewBoxUpper: '10 0 180 232',
  zones: [
    ...pair('face', 'face', r(78, 6, 22, 46, 10)),
    ...pair('neck', 'neck', r(86, 54, 14, 18, 3)),
    ...pair('shoulder', 'shoulder', r(52, 74, 48, 22, 10)),
    ...pair('chest', 'chest', r(64, 98, 36, 44, 4)),
    ...pair('abdomen', 'abdomen', r(66, 144, 34, 44, 4)),
    ...pair('upperarm', 'upper arm', r(36, 98, 24, 56, 10)),
    ...pair('forearm', 'forearm', r(28, 156, 24, 52, 10)),
    ...pair('hand', 'hand', r(22, 210, 24, 26, 10)),
    ...pair('hip', 'hip', r(64, 190, 36, 30, 6)),
    ...pair('thigh', 'thigh', r(64, 222, 34, 78, 12)),
    ...pair('lowerleg', 'lower leg', r(68, 302, 28, 84, 12)),
    ...pair('foot', 'foot', r(60, 388, 36, 24, 10)),
  ],
};

export const MARKS = [
  { id: 'pain', label: 'Pain' },
  { id: 'tingle', label: 'Tingling or numbness' },
  { id: 'weak', label: 'Weakness' },
];

// 'a' is the left of the image. From the front that is the person's right; from the back, their left.
export const sideName = (side, facing) => ((side === 'a') === (facing === 'front') ? 'right' : 'left');

export function zonesFor(view, facing) {
  if (view === 'head') return [...(facing === 'front' ? HEAD.front : HEAD.back), ...HEAD.neck];
  return BODY.zones;
}

// Storage key: head maps and body maps are kept apart; upper and full share one map.
export const mapKey = (view, facing) => `${view === 'head' ? 'head' : 'body'}-${facing}`;

// "Pain: right temple, right eye. Weakness: left hand."
export function describeBody(body = {}) {
  const by = {};
  for (const [key, marks] of Object.entries(body)) {
    const [area, facing] = key.split('-');
    const zones = zonesFor(area === 'head' ? 'head' : 'full', facing);
    for (const [zid, mark] of Object.entries(marks)) {
      const z = zones.find((q) => q.id === zid);
      if (!z) continue;
      const where = `${sideName(z.side, facing)} ${z.label}${facing === 'back' && area === 'body' ? ' (back)' : ''}`;
      (by[mark] ||= new Set()).add(where);
    }
  }
  return MARKS.filter((m) => by[m.id]).map((m) => `${m.label}: ${[...by[m.id]].join(', ')}.`).join(' ');
}
