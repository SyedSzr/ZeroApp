// ── SEARCH SCREEN ─────────────────────────────────────────────────────────────
var { useState, useEffect, useMemo, useRef } = React;

function SearchScreen({ searchMode }) {
  const { goBack, searchQ, setSearchQ, openDetail, liveGames, liveApps, t, recentSearches, updateSearchHistory, clearSearchHistory, launchApp, theme } = useApp();
  const inputRef = useRef(null);
  const isDark = theme !== 'light';

  // In the current games-only version of ZeroApp, search always defaults to games
  const isAppsMode = searchMode === 'apps';
  const targetCatalog = isAppsMode ? (liveApps || []) : (liveGames || []);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 150); }, []);

  const q = searchQ.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return [];
    return targetCatalog.filter(a => {
      const name = (a.name || '').toLowerCase();
      const cat  = (a.category || a.homeCategory || a.gameCategory || '').toLowerCase();
      const tags = Array.isArray(a.tags) ? a.tags : [];
      const dev  = (a.developer || '').toLowerCase();
      
      return name.includes(q) || 
             cat.includes(q) || 
             dev.includes(q) ||
             tags.some(t_tag => String(t_tag).toLowerCase().includes(q));
    });
  }, [q, targetCatalog]);

  const topResults = results.slice(0, 4);
  const moreResults = results.slice(4);

  const catalogLabel = isAppsMode ? (t('all_apps') || 'All Apps') : (t('all_games') || 'All Games');
  const searchPlaceholder = isAppsMode ? (t('search_apps') || 'Search apps...') : (t('search_games') || 'Search games...');

  return (
    <div className={`slide-up flex flex-col h-full ${isDark ? 'bg-[#050b19]' : 'bg-bg'}`}>

      {/* ── Search Header ── */}
      <div className={`pt-safe px-4 py-3 border-b border-border flex-shrink-0 ${
        isDark 
          ? 'bg-[radial-gradient(circle_at_88%_0%,rgba(104,66,255,0.18),transparent_40%),linear-gradient(180deg,#050817_0%,#071024_100%)]' 
          : 'bg-surface'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`flex-1 flex items-center gap-2 border rounded-2xl px-4 py-2.5 ${
            isDark ? 'bg-[#171c2d] border-[#2a3043]' : 'bg-card border-border'
          }`}>
            <span className="text-muted text-base flex-shrink-0">🔍</span>
            <input
              ref={inputRef}
              type="search"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder={searchPlaceholder}
              autoComplete="off"
              className={`flex-1 bg-transparent text-sm placeholder-muted outline-none ${isDark ? 'text-white' : 'text-gray-900'}`}
            />
            {searchQ && (
              <button onClick={() => setSearchQ('')} className="tap text-muted text-lg flex-shrink-0">×</button>
            )}
          </div>
          <button onClick={goBack} className="tap text-accent text-sm font-semibold flex-shrink-0">{t('cancel')}</button>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="flex-1 overflow-y-auto no-sb pb-28">

        {/* Empty state - show recent searches + all games */}
        {!q && (
          <div className="px-5 pt-6">
            {recentSearches.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-muted text-xs font-bold uppercase tracking-widest">{t('recent')}</p>
                  <button onClick={clearSearchHistory} className="text-accent text-[10px] font-bold uppercase">{t('clear_all')}</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(term => (
                    <button 
                      key={term} 
                      onClick={() => setSearchQ(term)}
                      className="tap bg-surface border border-border px-4 py-2 rounded-xl text-white text-xs font-medium"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {targetCatalog.length > 0 && (
              <div className="mb-6">
                <p className="text-muted text-xs font-bold uppercase tracking-widest mb-4">{catalogLabel} ({targetCatalog.length})</p>
                <div className="flex flex-col gap-2">
                  {targetCatalog.map(app => (
                    <ListAppRow key={app.id} app={app} onPress={(a) => {
                      updateSearchHistory(a.name);
                      if (a.gameCategory || !isAppsMode) {
                        launchApp(a);
                      } else {
                        openDetail(a);
                      }
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No results */}
        {q && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-5xl">🎮</span>
            <p className="text-muted text-sm">{t('no_results') || 'No games found for'} "{searchQ}"</p>
          </div>
        )}

        {/* Top Results */}
        {topResults.length > 0 && (
          <div className="px-4 pt-5">
            <p className="text-muted text-xs font-bold uppercase tracking-widest mb-3">{t('top_results')}</p>
            <div className="flex flex-col gap-2">
              {topResults.map(app => (
                <ListAppRow key={app.id} app={app} onPress={(a) => {
                  updateSearchHistory(searchQ);
                  if (a.gameCategory || !isAppsMode) {
                    launchApp(a);
                  } else {
                    openDetail(a);
                  }
                }}
                  rightSlot={<span className="text-muted text-sm">›</span>} />
              ))}
            </div>
          </div>
        )}

        {/* More Results */}
        {moreResults.length > 0 && (
          <div className="px-4 pt-5">
            <p className="text-muted text-xs font-bold uppercase tracking-widest mb-3">{t('more_games') || t('more_apps') || 'More Games'}</p>
            <div className="flex flex-col gap-2">
              {moreResults.map(app => (
                <ListAppRow key={app.id} app={app} onPress={(a) => {
                  updateSearchHistory(searchQ);
                  if (a.gameCategory || !isAppsMode) {
                    launchApp(a);
                  } else {
                    openDetail(a);
                  }
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
