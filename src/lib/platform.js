// Everything that touches the phone sits behind this file, so it can be swapped or stubbed in a browser.
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';

export const isNative = Capacitor.isNativePlatform();

const FILE = 'data.json';
const SNAP_DIR = 'snapshots';
const LS_KEY = 'headache-tracker';

export async function readData() {
  try {
    if (!isNative) return JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    const r = await Filesystem.readFile({ path: FILE, directory: Directory.Data, encoding: Encoding.UTF8 });
    return JSON.parse(r.data);
  } catch { return null; }
}

export async function writeData(state) {
  const data = JSON.stringify(state);
  if (!isNative) { try { localStorage.setItem(LS_KEY, data); } catch { /* storage unavailable */ } return; }
  // Write to a temp file then rename, so a crash mid-write can't corrupt the log.
  await Filesystem.writeFile({ path: FILE + '.tmp', directory: Directory.Data, encoding: Encoding.UTF8, data });
  await Filesystem.rename({ from: FILE + '.tmp', to: FILE, directory: Directory.Data });
}

// Which snapshot files to keep: the newest 30 daily ones, plus the first of every month forever.
export function snapshotsToDelete(names) {
  const sorted = [...names].sort();
  const keep = new Set(sorted.slice(-30));
  const seenMonth = new Set();
  for (const n of sorted) { const m = n.slice(0, 7); if (!seenMonth.has(m)) { seenMonth.add(m); keep.add(n); } }
  return sorted.filter((n) => !keep.has(n));
}

export async function snapshot(state, dayKey) {
  if (!isNative) return;
  try {
    await Filesystem.mkdir({ path: SNAP_DIR, directory: Directory.Data, recursive: true }).catch(() => {});
    const { files } = await Filesystem.readdir({ path: SNAP_DIR, directory: Directory.Data });
    const names = files.map((f) => f.name).filter((n) => n.endsWith('.json'));
    if (!names.includes(`${dayKey}.json`)) {
      await Filesystem.writeFile({ path: `${SNAP_DIR}/${dayKey}.json`, directory: Directory.Data, encoding: Encoding.UTF8, data: JSON.stringify(state) });
      names.push(`${dayKey}.json`);
    }
    for (const n of snapshotsToDelete(names)) await Filesystem.deleteFile({ path: `${SNAP_DIR}/${n}`, directory: Directory.Data }).catch(() => {});
  } catch (e) { console.warn('snapshot failed', e); }
}

export async function listSnapshots() {
  if (!isNative) return [];
  try {
    const { files } = await Filesystem.readdir({ path: SNAP_DIR, directory: Directory.Data });
    return files.map((f) => f.name.replace('.json', '')).sort().reverse();
  } catch { return []; }
}

export async function readSnapshot(dayKey) {
  const r = await Filesystem.readFile({ path: `${SNAP_DIR}/${dayKey}.json`, directory: Directory.Data, encoding: Encoding.UTF8 });
  return JSON.parse(r.data);
}

// Hand a full copy of the log to the Android share sheet (Drive, email, Files...).
export async function exportData(state, dayKey) {
  const name = `headache-tracker-${dayKey}.json`;
  const data = JSON.stringify(state, null, 1);
  if (!isNative) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.download = name; a.click();
    return;
  }
  const { Share } = await import('@capacitor/share');
  const r = await Filesystem.writeFile({ path: name, directory: Directory.Cache, encoding: Encoding.UTF8, data });
  await Share.share({ title: 'Headache Tracker backup', files: [r.uri] });
}
