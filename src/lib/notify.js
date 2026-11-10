// Local notifications: the evening reminder, and a check-in two hours after a painkiller.
import { dateKey } from './dates.js';
import { dayStatus, openEpisode } from './logic.js';
import { isNative } from './platform.js';
import { editDay, getState } from './store.js';

const EVENING_ID = 1;
const ACTION_TYPE = 'EVENING';
const TWO_HOURS = 2 * 3600 * 1000;

// Imported statically on purpose: see the note in health.js.
import { LocalNotifications as LN } from '@capacitor/local-notifications';

// 31-bit id from a dose id, so a check-in can be cancelled or replaced later.
const doseNotifId = (doseId) => { let h = 7; for (const ch of doseId) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h) || 2; };

export function eveningBody(state, now = new Date()) {
  const open = openEpisode(state);
  const prev = state.meds.filter((m) => m.kind === 'preventive' && m.active);
  const parts = [];
  if (open) parts.push('A headache is still open. Has it ended?');
  else parts.push('Any headache today?');
  if (prev.length) parts.push('Preventive taken?');
  return parts.join(' ');
}

export async function initNotifications(onOpen) {
  if (!isNative) return;
  await LN.registerActionTypes({ types: [{ id: ACTION_TYPE, actions: [{ id: 'clear', title: 'No headache today' }, { id: 'open', title: 'Open' }] }] });
  await LN.addListener('localNotificationActionPerformed', (ev) => {
    if (ev.actionId === 'clear') {
      const k = dateKey();
      if (dayStatus(k, getState()) === 'none') editDay(k, (d) => { d.clear = true; });
    } else if (ev.notification?.extra?.episodeId) onOpen({ name: 'episode', id: ev.notification.extra.episodeId });
  });
}

export async function requestNotifications() {
  if (!isNative) return false;
  const p = await LN.requestPermissions();
  return p.display === 'granted';
}

// Re-plan the evening reminder. Called after every save so the wording matches the current state.
export async function scheduleEvening() {
  if (!isNative) return;
  const s = getState();
  await LN.cancel({ notifications: [{ id: EVENING_ID }] }).catch(() => {});
  if (!s.settings.reminderOn) return;
  if ((await LN.checkPermissions()).display !== 'granted') return;
  const [hour, minute] = s.settings.reminderTime.split(':').map(Number);
  await LN.schedule({ notifications: [{
    id: EVENING_ID, title: 'Headache Tracker', body: eveningBody(s),
    schedule: { on: { hour, minute }, allowWhileIdle: true },
    actionTypeId: ACTION_TYPE,
  }] });
}

export async function scheduleMedCheck(episodeId, dose) {
  const s = getState();
  if (!isNative || !s.settings.medCheckOn) return;
  const at = new Date(new Date(dose.time).getTime() + TWO_HOURS);
  if (at <= new Date()) return;
  if ((await LN.checkPermissions()).display !== 'granted') return;
  await LN.schedule({ notifications: [{
    id: doseNotifId(dose.id), title: `Did the ${dose.name} help?`, body: 'Two hours on. Tap to record how you feel.',
    schedule: { at, allowWhileIdle: true }, extra: { episodeId },
  }] });
}

export async function cancelMedCheck(doseId) {
  if (!isNative) return;
  await LN.cancel({ notifications: [{ id: doseNotifId(doseId) }] }).catch(() => {});
}
