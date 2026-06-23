// ── SEARCH SCREEN ─────────────────────────────────────────────────────────────
var { useState, useEffect, useMemo, useRef } = React;

function SearchScreen({ searchMode }) {
  const { goBack, searchQ, setSearchQ, openDetail, liveApps, liveGames, t, recentSearches, updateSearchHistory, clearSearchHistory, launchApp } = useApp();
  const inputRef = useRef(null);

  const isGamesMode = searchMode === 'games';

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 150); }, []);

  const q = searchQ.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return [];
    const all = isGamesMode
      ? [...(liveGames || []), ...(liveApps || [])]
      : [...(liveApps || []), ...(liveGames || [])];
    return all.filter(a => {
      const name = (a.name || '').toLowerCase();
      const cat  = (a.category || a.homeCategory || a.gameCategory || '').toLowerCase();
      const tags = Array.isArray(a.tags) ? a.tags : [];
      
      return name.includes(q) || 
             cat.includes(q) || 
             tags.some(t_tag => String(t_tag).toLowerCase().includes(q));
    });
  }, [q, liveApps, liveGames, isGamesMode]);

  const topResults = results.slice(0, 4);
  const moreResults = results.slice(4);

  // Determine which list to show first in empty state
  const primaryList = isGamesMode ? liveGames : liveApps;
  const secondaryList = isGamesMode ? liveApps : liveGames;
  const primaryLabel = isGamesMode ? t('all_games') : t('all_apps');
  const secondaryLabel = isGamesMode ? t('all_apps') : t('all_games');

  return (
    <div className="slide-up flex flex-col h-full bg-bg">

      {/* ── Search Header ── */}
      <div className="pt-safe px-4 py-3 border-b border-border bg-surface flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-2.5">
            <span className="text-muted text-base flex-shrink-0">🔍</span>
            <input
              ref={inputRef}
              type="search"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder={isGamesMode ? (t('search_games') || 'Search games...') : t('search_anything')}
              autoComplete="off"
              className="flex-1 bg-transparent text-white text-sm placeholder-muted outline-none"
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

        {/* Empty state - show recent searches + primary list first */}
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

            {primaryList.length > 0 && (
              <div className="mb-6">
                <p className="text-muted text-xs font-bold uppercase tracking-widest mb-4">{primaryLabel} ({primaryList.length})</p>
                <div className="flex flex-col gap-2">
                  {primaryList.map(app => (
                    <ListAppRow key={app.id} app={app} onPress={(a) => {
                      updateSearchHistory(a.name);
                      if (a.gameCategory) {
                        launchApp(a);
                      } else {
                        openDetail(a);
                      }
                    }} />
                  ))}
                </div>
              </div>
            )}

            {secondaryList.length > 0 && (
              <div className="mb-6">
                <p className="text-muted text-xs font-bold uppercase tracking-widest mb-4">{secondaryLabel} ({secondaryList.length})</p>
                <div className="flex flex-col gap-2">
                  {secondaryList.map(app => (
                    <ListAppRow key={app.id} app={app} onPress={(a) => {
                      updateSearchHistory(a.name);
                      if (a.gameCategory) {
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
            <span className="text-5xl">😕</span>
            <p className="text-muted text-sm">{t('no_results')} "{searchQ}"</p>
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
                  if (a.gameCategory) {
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
            <p className="text-muted text-xs font-bold uppercase tracking-widest mb-3">{t('more_apps')}</p>
            <div className="flex flex-col gap-2">
              {moreResults.map(app => (
                <ListAppRow key={app.id} app={app} onPress={(a) => {
                  updateSearchHistory(searchQ);
                  if (a.gameCategory) {
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
