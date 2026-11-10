import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { syncHealth } from './lib/health.js';
import { openEpisode } from './lib/logic.js';
import { initNotifications, requestNotifications, scheduleEvening } from './lib/notify.js';
import { isNative } from './lib/platform.js';
import { flush, getState, load, onSaved, startEpisode, update, useStore } from './lib/store.js';
import { syncWeather } from './lib/weather.js';
import { Attack } from './screens/Attack.jsx';
import { Calendar, DayScreen } from './screens/Calendar.jsx';
import { Episode } from './screens/Episode.jsx';
import { Insights } from './screens/Insights.jsx';
import { Meds } from './screens/Meds.jsx';
import { Lists, Settings } from './screens/Settings.jsx';
import { Today } from './screens/Today.jsx';
import { Icon } from './ui.jsx';

const TABS = [['today', 'Today', 'home'], ['calendar', 'Calendar', 'cal'], ['insights', 'Insights', 'bars'], ['meds', 'Meds', 'pill'], ['settings', 'Settings', 'sliders']];
const TAB_NAMES = TABS.map((t) => t[0]);
const START_URL = 'headachetracker://start';

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme; else root.dataset.theme = theme;
}

export function App() {
  const { state, loaded } = useStore();
  const [stack, setStack] = useState([{ name: 'today' }]);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef();
  const route = stack[stack.length - 1];

  // Tabs replace the stack; everything else pushes onto it.
  const go = useCallback((r) => setStack((st) => (TAB_NAMES.includes(r.name) ? [r] : [...st, r])), []);
  const back = useCallback(() => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)), []);
  const toast = useCallback((msg) => { setToastMsg(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToastMsg(''), 3500); }, []);
  const setTheme = (t) => update((s) => { s.settings.theme = t; });

  const refresh = useCallback(() => {
    syncWeather().catch((e) => console.warn('weather', e?.message));
    syncHealth().catch((e) => console.warn('health', e?.message));
    scheduleEvening().catch(() => {});
  }, []);

  useEffect(() => {
    let cleanup = [];
    (async () => {
      await load();
      const quickStart = () => { const open = openEpisode(getState()); setStack([{ name: 'today' }, { name: 'attack', id: open ? open.id : startEpisode() }]); };
      // Each startup step is guarded, so one failing plugin can't stop the rest.
      await initNotifications(go).catch((e) => console.warn('notifications', e));
      const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
      document.addEventListener('visibilitychange', onHide);
      cleanup.push(() => document.removeEventListener('visibilitychange', onHide));
      // Ask for notification permission once, on first launch.
      if (isNative && !getState().settings.askedNotif) {
        const granted = await requestNotifications().catch(() => false);
        update((s) => { s.settings.askedNotif = true; if (!granted) s.settings.reminderOn = false; });
      }
      cleanup.push(onSaved(() => { scheduleEvening().catch(() => {}); }));
      if (isNative) {
        const { App: CapApp } = await import('@capacitor/app');
        const launch = await CapApp.getLaunchUrl();
        if (launch?.url?.startsWith(START_URL)) quickStart();
        const subs = await Promise.all([
          CapApp.addListener('appUrlOpen', (ev) => { if (ev.url?.startsWith(START_URL)) quickStart(); }),
          CapApp.addListener('backButton', () => setStack((st) => { if (st.length > 1) return st.slice(0, -1); if (st[0].name !== 'today') return [{ name: 'today' }]; CapApp.minimizeApp(); return st; })),
          CapApp.addListener('resume', refresh),
        ]);
        cleanup.push(() => subs.forEach((s) => s.remove()));
      } else if (location.hash === '#start') quickStart();
      refresh();
    })();
    return () => cleanup.forEach((fn) => fn());
  }, []);

  useEffect(() => { if (loaded) applyTheme(state.settings.theme); }, [loaded, state.settings.theme]);

  if (!loaded) return <div class="app" />;

  const props = { state, go, back, setTheme, toast };
  let screen;
  switch (route.name) {
    case 'attack': return <Attack {...props} id={route.id} />;
    case 'episode': screen = <Episode {...props} id={route.id} key={route.id} />; break;
    case 'day': screen = <DayScreen {...props} k={route.k} key={route.k} />; break;
    case 'lists': screen = <Lists {...props} list={route.list} key={route.list} />; break;
    case 'calendar': screen = <Calendar {...props} sel={route.sel} key={route.sel || 'cal'} />; break;
    case 'insights': screen = <Insights {...props} />; break;
    case 'meds': screen = <Meds {...props} />; break;
    case 'settings': screen = <Settings {...props} />; break;
    default: screen = <Today {...props} />;
  }
  const tab = TAB_NAMES.includes(route.name) ? route.name : stack[0].name;

  return (
    <div class="app">
      {screen}
      {toastMsg && <div class="toast" role="status">{toastMsg}</div>}
      <nav class="nav" aria-label="Main">
        {TABS.map(([name, label, icon]) => (
          <button type="button" key={name} aria-current={tab === name ? 'page' : undefined} onClick={() => go({ name })}><Icon name={icon} size={22} />{label}</button>
        ))}
      </nav>
    </div>
  );
}
