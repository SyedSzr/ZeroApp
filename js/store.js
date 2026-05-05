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

  // ── Navigation state (Native Stack) ──
  const [history, setHistory]     = useState([{ key: 'root-apps', id: 'apps', params: {} }]);
  const [mainTab, setMainTab]     = useState('apps'); // 'apps' | 'games'

  const screen = history[history.length - 1].id;

  // ── Domain state ──
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

      if (a.data && a.data.length > 0) { 
        const approved = a.data.filter(app => app.status === 'approved');
        setLiveApps(approved); 
        window.liveApps = approved; 
      }
      if (g.data && g.data.length > 0) { 
        const approved = g.data.filter(game => game.status === 'approved');
        setLiveGames(approved); 
        window.liveGames = approved; 
      }
      if (c.data && c.data.length > 0) { setLiveCats(c.data); window.liveCats = c.data; }
      
      if (s.data && s.data.length > 0) {
        const sMap = {};
        s.data.forEach(item => sMap[item.key] = item.value);
        setSettings(sMap);
        window.appSettings = sMap;
      }
    };
    fetchAll();

    const channel = supabase.channel('catalog_changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── URL Helpers ──
  const getUrlForFrame = useCallback((frame) => {
    if (!frame) return '#apps';
    let url = '#' + frame.id;
    const params = frame.params || {};
    const query = [];
    if (params.detailApp) query.push(`id=${params.detailApp.id || params.detailApp}`);
    else if (params.viewerApp) query.push(`id=${params.viewerApp.id || params.viewerApp}`);
    else if (params.exploreCategory) query.push(`id=${params.exploreCategory}`);
    else if (frame.id === 'search' && searchQ) query.push(`q=${encodeURIComponent(searchQ)}`);
    
    return query.length > 0 ? `${url}?${query.join('&')}` : url;
  }, [searchQ]);

  // ── Navigate ──
  const go = useCallback((s, extra = {}) => {
    const isRootTab = ['apps', 'games', 'explore', 'profile'].includes(s);
    const key = s + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const frame = { key, id: s, params: extra };
    
    setHistory(h => {
      // If switching to a main tab, reset the stack to keep performance high
      // and prevent multiple bottom-navs from overlapping.
      if (isRootTab) {
        const next = [frame];
        // If we are already on this screen, just replace state; otherwise push.
        if (h[h.length - 1].id === s) {
          window.history.replaceState({ stackIndex: 0 }, '', getUrlForFrame(frame));
        } else {
          window.history.pushState({ stackIndex: 0 }, '', getUrlForFrame(frame));
        }
        return next;
      }
      
      const next = [...h, frame];
      window.history.pushState({ stackIndex: next.length - 1 }, '', getUrlForFrame(frame));
      return next;
    });
  }, [getUrlForFrame]);

  const goBack = useCallback((fromPopState = false) => {
    setHistory(h => {
      if (h.length <= 1) {
        // If we're at the root and user hits back, we can't pop React history
        // But if it's from browser back, we should at least check if we can sync
        return h;
      }
      if (!fromPopState) window.history.back();
      const next = [...h];
      next.pop();
      return next;
    });
  }, []);

  // ── Browser History Sync ──
  useEffect(() => {
    const handlePop = (e) => {
      const hash = window.location.hash;
      const [idPart] = (hash.slice(1) || 'apps').split('?');
      
      setHistory(h => {
        // If the browser went back and the current hash matches the PREVIOUS screen in our stack, pop it.
        if (h.length > 1 && h[h.length - 2].id === idPart) {
          const next = [...h];
          next.pop();
          return next;
        }
        // Otherwise, if the browser is at a completely different root, re-hydrate.
        if (['apps', 'games', 'explore', 'profile'].includes(idPart)) {
           // Resolve extra params if needed... for now just reset to that root
           return [{ key: 'pop-'+Date.now(), id: idPart, params: {} }];
        }
        return h;
      });
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // ── Initial Hydration ──
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash === '#apps') return;

    const [idPart, queryPart] = hash.slice(1).split('?');
    const params = {};
    if (queryPart) {
      queryPart.split('&').forEach(p => {
        const [k, v] = p.split('=');
        params[k] = decodeURIComponent(v);
      });
    }

    // Prepare the hydration frame
    let frameId = idPart;
    let extra = {};
    if (frameId === 'detail' && params.id) extra = { detailApp: params.id };
    else if (frameId === 'explore' && params.id) extra = { exploreCategory: params.id };
    else if (frameId === 'viewer' && params.id) extra = { viewerApp: params.id };
    else if (frameId === 'search' && params.q) {
       extra = {};
       setSearchQ(params.q);
    }

    // Boot with Home + the Deep Link screen so "back" works
    setHistory([
      { key: 'root-apps', id: 'apps', params: {} },
      { key: 'deep-link-' + Date.now(), id: frameId, params: extra }
    ]);
    
    // Replace current state so browser knows we are at index 1
    window.history.replaceState({ stackIndex: 1 }, '', hash);
  }, []);

  const goHome = useCallback(() => {
    setHistory([{ key: 'root-apps', id: 'apps', params: {} }]);
    setMainTab('apps');
    setSearchQ('');
  }, []);

  // ── Open app detail ──
  const openDetail = useCallback((app) => {
    go('detail', { detailApp: app });
  }, []);

  // ── Launch app into viewer ──
  const launchApp = useCallback((app) => {
    go('viewer', { viewerApp: app });
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
    supabase,
    screen, history, go, goBack, goHome,
    mainTab, setMainTab,
    exploreCategory: null, mode: null, detailApp: null, viewerApp: null,
    detailApp: null, setDetailApp: () => {}, openDetail,
    viewerApp: null, setViewerApp: () => {}, launchApp,
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
