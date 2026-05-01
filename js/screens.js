// ─── SCREENS ─────────────────────────────────────────────────────────────────

// ── HomeScreen ────────────────────────────────────────────────────────────────
function HomeScreen() {
  const { openMode, openApp, openSearch, recents } = useApp();

  return React.createElement('div', { className: 'screen-enter flex flex-col h-full' },
    // Scrollable body
    React.createElement('div', { className: 'flex-1 overflow-y-auto no-scrollbar px-5 pb-4' },
      // Header
      React.createElement('div', { className: 'header-safe pt-6 pb-4' },
        React.createElement('p', { className: 'text-muted text-sm font-medium' }, getGreeting() + ' 👋'),
        React.createElement('h1', { className: 'text-white text-2xl font-bold mt-0.5' }, 'What will you do\ntoday?'),
      ),
      // Search bar (tap to open search screen)
      React.createElement('div', { className: 'mb-6', onClick: openSearch },
        React.createElement('div', { className: 'flex items-center gap-3 bg-card border border-border rounded-2xl py-3.5 px-4 cursor-pointer' },
          React.createElement('span', { className: 'text-muted' }, '🔍'),
          React.createElement('span', { className: 'text-muted text-sm' }, 'Search apps...'),
        )
      ),
      // Mode Cards
      React.createElement('div', { className: 'mb-6' },
        React.createElement('h2', { className: 'text-white/90 text-sm font-semibold mb-3 uppercase tracking-wider' }, 'Modes'),
        React.createElement('div', { className: 'flex gap-3' },
          Object.keys(MODE_CONFIG).map(m =>
            React.createElement(ModeCard, { key: m, modeKey: m, onOpen: openMode })
          )
        )
      ),
      // Recently Used
      recents.length > 0 && React.createElement('div', { className: 'mb-4' },
        React.createElement('h2', { className: 'text-white/90 text-sm font-semibold mb-3 uppercase tracking-wider' }, 'Recently Used'),
        React.createElement('div', { className: 'flex gap-3 overflow-x-auto no-scrollbar pb-1' },
          recents.map(app =>
            React.createElement(RecentCard, { key: app.id, app, onOpen: openApp })
          )
        )
      ),
      // All Apps quick section
      React.createElement('div', { className: 'mb-2' },
        React.createElement('h2', { className: 'text-white/90 text-sm font-semibold mb-3 uppercase tracking-wider' }, 'All Apps'),
        React.createElement('div', { className: 'grid grid-cols-4 gap-3' },
          ALL_APPS.slice(0, 8).map(app =>
            React.createElement(AppCard, { key: app.id, app, onOpen: openApp })
          )
        )
      )
    ),
    React.createElement(BottomNav, { active: 'home' })
  );
}

// ── ModeScreen ────────────────────────────────────────────────────────────────
function ModeScreen() {
  const { mode, goBack, openApp } = useApp();
  const [query, setQuery] = useState('');
  const cfg = MODE_CONFIG[mode];
  const apps = APP_DATA[mode] || [];

  const filtered = query.trim()
    ? apps.filter(a =>
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.tags.some(t => t.includes(query.toLowerCase()))
      )
    : apps;

  return React.createElement('div', { className: 'screen-enter flex flex-col h-full' },
    // Mode Header
    React.createElement('div', {
      className: `header-safe px-5 pt-6 pb-5 bg-gradient-to-br ${cfg.gradient} flex-shrink-0`
    },
      React.createElement('button', {
        onClick: goBack,
        className: 'mb-4 text-white/70 text-sm flex items-center gap-1 tap-scale'
      }, '← Back'),
      React.createElement('div', { className: 'flex items-center gap-3' },
        React.createElement('span', { className: 'text-4xl' }, cfg.emoji),
        React.createElement('div', {},
          React.createElement('h1', { className: 'text-white text-2xl font-bold' }, cfg.label),
          React.createElement('p', { className: 'text-white/60 text-sm' }, `${apps.length} apps available`)
        )
      )
    ),
    // Search
    React.createElement('div', { className: 'px-5 py-4 bg-bg flex-shrink-0' },
      React.createElement(SearchBar, { value: query, onChange: setQuery })
    ),
    // App Grid
    React.createElement('div', { className: 'flex-1 overflow-y-auto no-scrollbar px-5 pb-28' },
      filtered.length === 0
        ? React.createElement('div', { className: 'text-center py-16 text-muted' }, 'No apps found')
        : React.createElement('div', { className: 'grid grid-cols-3 gap-4' },
            filtered.map(app => React.createElement(AppCard, { key: app.id, app, onOpen: openApp }))
          )
    ),
    React.createElement(BottomNav, { active: 'explore' })
  );
}

// ── SearchScreen ──────────────────────────────────────────────────────────────
function SearchScreen() {
  const { goBack, openApp, searchQuery, setSearchQuery } = useApp();

  const filtered = searchQuery.trim().length > 0
    ? ALL_APPS.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tags.some(t => t.includes(searchQuery.toLowerCase()))
      )
    : [];

  return React.createElement('div', { className: 'screen-enter flex flex-col h-full' },
    // Header
    React.createElement('div', { className: 'header-safe px-5 pt-6 pb-4 flex-shrink-0' },
      React.createElement('button', { onClick: goBack, className: 'mb-4 text-white/70 text-sm tap-scale' }, '← Back'),
      React.createElement('h1', { className: 'text-white text-xl font-bold mb-4' }, 'Search'),
      React.createElement(SearchBar, {
        value: searchQuery,
        onChange: setSearchQuery,
        autoFocus: true,
        placeholder: 'Search by name or category...'
      })
    ),
    // Results
    React.createElement('div', { className: 'flex-1 overflow-y-auto no-scrollbar px-5 pb-28' },
      searchQuery.trim() === '' && React.createElement('div', { className: 'py-16 text-center' },
        React.createElement('div', { className: 'text-5xl mb-3' }, '🔍'),
        React.createElement('p', { className: 'text-muted text-sm' }, 'Start typing to find apps')
      ),
      filtered.length === 0 && searchQuery.trim() !== '' && React.createElement('div', { className: 'py-16 text-center' },
        React.createElement('div', { className: 'text-5xl mb-3' }, '😕'),
        React.createElement('p', { className: 'text-muted text-sm' }, `No results for "${searchQuery}"`)
      ),
      filtered.length > 0 && React.createElement('div', { className: 'flex flex-col gap-2 mt-2' },
        React.createElement('p', { className: 'text-muted text-xs mb-1' }, `${filtered.length} results`),
        filtered.map(app =>
          React.createElement('button', {
            key: app.id,
            onClick: () => openApp(app),
            className: 'tap-scale flex items-center gap-4 bg-card border border-border rounded-2xl p-4 text-left hover:border-white/20 transition-colors',
          },
            React.createElement(AppIcon, { emoji: app.icon, size: 'sm' }),
            React.createElement('div', { className: 'flex-1 min-w-0' },
              React.createElement('div', { className: 'text-white font-semibold text-sm truncate' }, app.name),
              React.createElement('div', { className: 'text-muted text-xs mt-0.5' }, app.tags.slice(0, 3).join(' · '))
            ),
            React.createElement('span', { className: 'text-muted text-xs' }, '→')
          )
        )
      )
    ),
    React.createElement(BottomNav, { active: 'explore' })
  );
}

// ── AppViewerScreen ───────────────────────────────────────────────────────────
function AppViewerScreen() {
  const { activeApp, goBack } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [key, setKey] = useState(0);
  const iframeRef = useRef(null);

  const reload = () => { setKey(k => k + 1); setLoading(true); setError(false); };
  const openExternal = () => window.open(activeApp.url, '_blank');

  if (!activeApp) return null;

  return React.createElement('div', { className: 'viewer-enter flex flex-col h-full' },
    // Top Bar
    React.createElement('div', {
      className: 'header-safe flex items-center gap-2 px-4 py-3 bg-surface border-b border-border flex-shrink-0',
      style: { zIndex: 60 }
    },
      React.createElement('button', {
        onClick: goBack,
        className: 'tap-scale w-10 h-10 rounded-xl bg-card flex items-center justify-center text-white/80 flex-shrink-0'
      }, '←'),
      React.createElement('div', { className: 'flex-1 min-w-0 mx-2' },
        React.createElement('div', { className: 'flex items-center gap-2' },
          React.createElement('span', { className: 'text-lg' }, activeApp.icon),
          React.createElement('span', { className: 'text-white font-semibold text-sm truncate' }, activeApp.name)
        ),
        React.createElement('p', { className: 'text-muted text-xs truncate mt-0.5' }, activeApp.url)
      ),
      React.createElement('button', {
        onClick: reload,
        className: 'tap-scale w-10 h-10 rounded-xl bg-card flex items-center justify-center text-white/80 flex-shrink-0'
      }, '↻'),
      React.createElement('button', {
        onClick: openExternal,
        className: 'tap-scale w-10 h-10 rounded-xl bg-card flex items-center justify-center text-white/80 flex-shrink-0'
      }, '↗')
    ),
    // iFrame container
    React.createElement('div', { className: 'flex-1 relative bg-black overflow-hidden' },
      loading && !error && React.createElement('div', {
        className: 'absolute inset-0 flex flex-col items-center justify-center bg-bg z-10 gap-4'
      },
        React.createElement('div', { className: 'spinner' }),
        React.createElement('div', { className: 'text-4xl' }, activeApp.icon),
        React.createElement('p', { className: 'text-white/70 text-sm font-medium' }, `Loading ${activeApp.name}...`),
        React.createElement('p', { className: 'text-muted text-xs' }, 'Some apps may block embedding')
      ),
      error && React.createElement('div', {
        className: 'absolute inset-0 flex flex-col items-center justify-center bg-bg z-10 gap-4 px-8 text-center'
      },
        React.createElement('div', { className: 'text-5xl' }, '⚠️'),
        React.createElement('h2', { className: 'text-white font-bold text-lg' }, 'Cannot Load App'),
        React.createElement('p', { className: 'text-muted text-sm' }, `${activeApp.name} doesn't allow embedding. Open it in your browser instead.`),
        React.createElement('button', {
          onClick: openExternal,
          className: 'tap-scale mt-2 bg-accent text-white font-semibold px-6 py-3 rounded-2xl text-sm'
        }, 'Open in Browser ↗')
      ),
      React.createElement('iframe', {
        key,
        ref: iframeRef,
        src: activeApp.url,
        title: activeApp.name,
        className: 'w-full h-full border-0',
        onLoad: () => setLoading(false),
        onError: () => { setError(true); setLoading(false); },
        sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox',
        allow: 'autoplay; fullscreen',
        style: { opacity: loading || error ? 0 : 1, transition: 'opacity 0.3s' }
      })
    )
  );
}
