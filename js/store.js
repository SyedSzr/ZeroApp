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

// ── SUPABASE CLIENT ───────────────────────────────────────────────────────────
const SB_URL = 'https://sjotifqahfcylcooaqxm.supabase.co';
const SB_KEY = 'sb_publishable_3h4-HTzlMANQA-T2FMaavQ_uso2rIGj';
const supabase = (typeof window.supabase !== 'undefined') ? window.supabase.createClient(SB_URL, SB_KEY) : null;

function AppProvider({ children }) {
  // ── Catalog State (Live from Supabase) ──
  const [liveApps, setLiveApps]   = useState(typeof APPS !== 'undefined' ? APPS : []);
  const [liveGames, setLiveGames] = useState(typeof GAMES !== 'undefined' ? GAMES : []);
  const [liveCats, setLiveCats]   = useState(typeof HOME_CATEGORIES !== 'undefined' ? [...HOME_CATEGORIES.map(c=>({...c,type:'app'})), ...GAME_CATEGORIES.map(c=>({...c,type:'game'}))] : []);
  const [settings, setSettings]   = useState({ app_name: 'ZeroApp' });

  // ── Navigation state ──
  const [screen, setScreen]       = useState('apps');
  const [history, setHistory]     = useState(['apps']);
  const [mainTab, setMainTab]     = useState('apps'); // 'apps' | 'games'

  // ── Domain state ──
  const [mode, setMode]                   = useState(null);  // 'study'|'work'|'play'
  const [exploreCategory, setExploreCat] = useState(null);  // homeCategory id | null = All
  const [detailApp, setDetailApp]         = useState(null);
  const [viewerApp, setViewerApp]         = useState(null);
  const [searchQ, setSearchQ]             = useState('');

  // ── Persistent ──
  const [recents, setRecents]     = useState(() => ls('zero_recents', []));
  const [favorites, setFavorites] = useState(() => ls('zero_favs', []));
  const [savedApps, setSavedApps] = useState(() => ls('zero_saved_apps', []));
  const [folders, setFolders]     = useState(() => ls('zero_folders', []));

  // ── Real-time Catalog Logic ──
  useEffect(() => {
    if (!supabase) return;

    const fetchAll = async () => {
      const [a, g, c, s] = await Promise.all([
        supabase.from('apps').select('*'),
        supabase.from('games').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('settings').select('*')
      ]);

      if (a.data) setLiveApps(a.data);
      if (g.data) setLiveGames(g.data);
      if (c.data) setLiveCats(c.data);
      
      if (s.data) {
        const sMap = {};
        s.data.forEach(item => sMap[item.key] = item.value);
        setSettings(sMap);
      }
    };
    fetchAll();

    const channel = supabase.channel('catalog_changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Navigate ──
  const go = useCallback((s, extra = {}) => {
    if (extra.mode             !== undefined) setMode(extra.mode);
    if (extra.exploreCategory  !== undefined) setExploreCat(extra.exploreCategory);
    if (extra.detailApp        !== undefined) setDetailApp(extra.detailApp);
    if (extra.viewerApp        !== undefined) setViewerApp(extra.viewerApp);
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
    setScreen('apps');
    setHistory(['apps']);
    setMainTab('apps');
    setMode(null);
    setExploreCat(null);
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

  // ── Saved Apps ──
  const toggleSaveApp = useCallback((app) => {
    setSavedApps(prev => {
      const has = prev.find(s => s.id === app.id);
      if (has) {
        // If un-saving, also remove from any folders
        setFolders(oldFolders => {
          const nextFolders = oldFolders.map(f => ({...f, appIds: f.appIds.filter(id => id !== app.id)}));
          lsSet('zero_folders', nextFolders);
          return nextFolders;
        });
      }
      const next = has ? prev.filter(s => s.id !== app.id) : [app, ...prev];
      lsSet('zero_saved_apps', next);
      return next;
    });
  }, []);
  const isSaved = useCallback((id) => savedApps.some(s => s.id === id), [savedApps]);

  // ── Folders ──
  const createFolder = useCallback((name, appIds = []) => {
    setFolders(prev => {
      // Ensure apps can only exist in one folder at a time:
      // Remove these appIds from all existing folders first.
      const cleaned = prev.map(f => ({
        ...f,
        appIds: f.appIds.filter(id => !appIds.includes(id))
      }));
      const next = [{ id: 'f_' + Date.now(), name, appIds }, ...cleaned];
      lsSet('zero_folders', next);
      return next;
    });
  }, []);

  const moveAppToFolder = useCallback((appId, targetFolderId) => {
    setFolders(prev => {
      // Remove from all folders first
      let next = prev.map(f => ({ ...f, appIds: f.appIds.filter(id => id !== appId) }));
      // Add to target folder
      next = next.map(f => {
        if (f.id === targetFolderId && !f.appIds.includes(appId)) {
          return { ...f, appIds: [...f.appIds, appId] };
        }
        return f;
      });
      lsSet('zero_folders', next);
      return next;
    });
  }, []);

  const removeAppFromFolder = useCallback((appId, folderId) => {
    setFolders(prev => {
      const next = prev.map(f => {
        if (f.id === folderId) return { ...f, appIds: f.appIds.filter(id => id !== appId) };
        return f;
      });
      lsSet('zero_folders', next);
      return next;
    });
  }, []);

  const deleteFolder = useCallback((folderId) => {
    setFolders(prev => {
      const next = prev.filter(f => f.id !== folderId);
      lsSet('zero_folders', next);
      return next;
    });
  }, []);

  // ── Clear recents ──
  const clearRecents = useCallback(() => { setRecents([]); lsSet('zero_recents', []); }, []);

  const value = {
    screen, history, go, goBack, goHome,
    mainTab, setMainTab,
    mode, setMode,
    exploreCategory, setExploreCat,
    detailApp, setDetailApp, openDetail,
    viewerApp, setViewerApp, launchApp,
    searchQ, setSearchQ,
    recents, clearRecents,
    favorites, toggleFav, isFav,
    savedApps, folders, toggleSaveApp, isSaved, 
    createFolder, moveAppToFolder, removeAppFromFolder, deleteFolder,
    liveApps, liveGames, liveCats, settings,
    greeting: settings.greeting_override || getGreeting(),
  };

  return React.createElement(Ctx.Provider, { value }, children);
}
