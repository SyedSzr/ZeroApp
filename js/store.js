// ── STORE / CONTEXT ───────────────────────────────────────────────────────────
const { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext } = React;

const Ctx = createContext(null);
function useApp() { return useContext(Ctx); }

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'Good Night';
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening';
  return 'Good Night';
}

function ls(key, def) { try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? def; } catch { return def; } }
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

function AppProvider({ children }) {
  // ── Navigation state ──
  const [screen, setScreen]       = useState('home');
  const [history, setHistory]     = useState(['home']);

  // ── Domain state ──
  const [mode, setMode]           = useState(null);       // 'study'|'work'|'play'
  const [detailApp, setDetailApp] = useState(null);       // app obj for detail screen
  const [viewerApp, setViewerApp] = useState(null);       // app obj for viewer
  const [searchQ, setSearchQ]     = useState('');

  // ── Persistent ──
  const [recents, setRecents]     = useState(() => ls('zero_recents', []));
  const [favorites, setFavorites] = useState(() => ls('zero_favs', []));
  const [wsApps, setWsApps]       = useState(() => ls('zero_ws', []));   // workspace tabs
  const [wsActive, setWsActive]   = useState(null);

  // ── Navigate ──
  const go = useCallback((s, extra = {}) => {
    if (extra.mode !== undefined)   setMode(extra.mode);
    if (extra.detailApp !== undefined) setDetailApp(extra.detailApp);
    if (extra.viewerApp !== undefined) setViewerApp(extra.viewerApp);
    setHistory(h => [...h, s]);
    setScreen(s);
  }, []);

  const goBack = useCallback(() => {
    setHistory(h => {
      if (h.length <= 1) return h;
      const next = [...h];
      next.pop();
      const prev = next[next.length - 1];
      setScreen(prev);
      return next;
    });
  }, []);

  const goHome = useCallback(() => {
    setScreen('home');
    setHistory(['home']);
    setMode(null);
    setDetailApp(null);
    setViewerApp(null);
    setSearchQ('');
  }, []);

  // ── Open app detail ──
  const openDetail = useCallback((app) => {
    setDetailApp(app);
    setHistory(h => [...h, 'detail']);
    setScreen('detail');
  }, []);

  // ── Launch app into viewer ──
  const launchApp = useCallback((app) => {
    setViewerApp(app);
    setHistory(h => [...h, 'viewer']);
    setScreen('viewer');
    // Add to recents
    setRecents(prev => {
      const next = [{ ...app, openedAt: Date.now() }, ...prev.filter(r => r.id !== app.id)].slice(0, 20);
      lsSet('zero_recents', next);
      return next;
    });
  }, []);

  // ── Favorites ──
  const toggleFav = useCallback((app) => {
    setFavorites(prev => {
      const has = prev.find(f => f.id === app.id);
      const next = has ? prev.filter(f => f.id !== app.id) : [app, ...prev];
      lsSet('zero_favs', next);
      return next;
    });
  }, []);
  const isFav = useCallback((id) => favorites.some(f => f.id === id), [favorites]);

  // ── Workspace ──
  const addToWorkspace = useCallback((app) => {
    setWsApps(prev => {
      if (prev.find(a => a.id === app.id)) { setWsActive(app.id); return prev; }
      const next = [...prev, app];
      lsSet('zero_ws', next);
      setWsActive(app.id);
      return next;
    });
    go('workspace');
  }, [go]);

  const removeFromWorkspace = useCallback((id) => {
    setWsApps(prev => {
      const next = prev.filter(a => a.id !== id);
      lsSet('zero_ws', next);
      if (wsActive === id) setWsActive(next[0]?.id ?? null);
      return next;
    });
  }, [wsActive]);

  // ── Clear recents ──
  const clearRecents = useCallback(() => { setRecents([]); lsSet('zero_recents', []); }, []);

  const value = {
    screen, mode, detailApp, viewerApp,
    searchQ, setSearchQ,
    recents, favorites, wsApps, wsActive, setWsActive,
    go, goBack, goHome, openDetail, launchApp,
    toggleFav, isFav, addToWorkspace, removeFromWorkspace, clearRecents,
    greeting: getGreeting(),
  };

  return React.createElement(Ctx.Provider, { value }, children);
}
