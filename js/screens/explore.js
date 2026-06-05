var { useState, useEffect, useMemo, useRef } = React;

function ExploreScreen({ exploreCategory }) {
  const { openDetail, go, liveGames, liveCats, t } = useApp();
  const gameCategories = liveCats.filter(c => c.type === 'game');

  // We'll use cat.id for state, 'all' for the special All tab
  const [activeTabId, setActiveTabId] = useState(exploreCategory || 'all');

  // Re-sync if context changes (e.g. navigating back then forward)
  useEffect(() => {
    setActiveTabId(exploreCategory || 'all');
  }, [exploreCategory]);

  // Derive active category object
  const activeCat = activeTabId === 'all'
    ? null
    : gameCategories.find(c => c.id === activeTabId);

  // Filter games by selected tab
  const listGames = activeCat
    ? liveGames.filter(g => g.gameCategory === activeCat.id)
    : liveGames;

  // Card gradient backgrounds
  const heroBgs = [
    'linear-gradient(135deg,#1a1a3e 0%,#2d1b69 40%,#11071f 100%)',
    'linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)',
    'linear-gradient(135deg,#1f4037 0%,#244c3c 50%,#0f2027 100%)',
    'linear-gradient(135deg,#3a1c71 0%,#d76d77 50%,#ffaf7b 100%)',
    'linear-gradient(135deg,#141e30 0%,#243b55 100%)',
    'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)',
  ];

  const headerLabel = activeCat
    ? `${activeCat.emoji} ${t('cat_' + activeCat.id)}`
    : `🧭 ${t('explore')}`;

  // ── Featured Content ──
  const heroBanners = listGames.filter(g => g.is_featured).slice(0, 5);
  
  const suggestedGames = listGames.slice(0, 8);
  const recommended   = listGames.slice(5, 13);

  return (
    <div className="slide-right flex flex-col h-full bg-bg">

      {/* ── Header ── */}
      <div className="pt-safe flex-shrink-0 bg-bg border-b border-border">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <button onClick={() => go('apps')} className="tap w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-white text-lg">←</button>
          <span className="text-white font-extrabold text-base tracking-tight">{headerLabel}</span>
          <button onClick={() => go('search')} className="tap w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-muted text-lg">🔍</button>
        </div>

        {/* ── Tab Strip: All + categories ── */}
        <div className="flex overflow-x-auto no-sb px-2 pt-1 pb-1">
          <button onClick={() => setActiveTabId('all')}
            className={`tap flex-shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTabId === 'all' ? 'text-white border-accent' : 'text-muted border-transparent'
            }`}>
            {t('all')}
          </button>

          {/* Category tabs */}
          {gameCategories.map(cat => (
            <button key={cat.id} onClick={() => setActiveTabId(cat.id)}
              className={`tap flex-shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTabId === cat.id ? 'text-white border-accent' : 'text-muted border-transparent'
              }`}>
              {cat.emoji} {t('cat_' + cat.id)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto no-sb pb-24 bg-bg">

        {listGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted">
            <span className="text-5xl">📭</span>
            <p className="text-sm">{t('no_games')}</p>
          </div>
        ) : (
          <>
            {/* ══ HERO CAROUSEL ══ */}
            {heroBanners.length > 0 && (
              <div className="mt-4 mb-6">
                <div className="flex gap-4 px-4 overflow-x-auto no-sb snap-x snap-mandatory">
                  {heroBanners.map((game, idx) => (
                    <button key={game.id} onClick={() => openDetail(game)}
                      className="tap flex-shrink-0 snap-start flex flex-col w-[280px] group">
                      
                      {/* Top Graphic */}
                      <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden relative border border-border bg-surface">
                        {game.featured_image ? (
                          <img src={game.featured_image} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center opacity-30" style={{ background: heroBgs[idx % heroBgs.length] }}>
                             <span className="text-4xl">{game.emoji}</span>
                          </div>
                        )}
                        
                        {/* Featured Badge Overlay */}
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black text-white uppercase tracking-wider">
                          {t('featured')}
                        </div>
                      </div>

                      {/* Bottom Details */}
                      <div className="flex items-center gap-3 mt-3 px-1">
                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-border shadow-lg flex-shrink-0">
                          <AppIcon app={game} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="text-white text-sm font-bold truncate tracking-tight">{game.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-muted text-[11px] font-medium">{t('cat_' + game.gameCategory) || game.category}</span>
                            <span className="text-muted opacity-40">·</span>
                            <span className="text-amber-400 text-[11px] font-bold">★ {game.rating}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ══ SUGGESTED FOR YOU ══ */}
            {suggestedGames.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between px-4 mb-4">
                  <div>
                    <span className="text-muted text-xs font-bold uppercase tracking-widest">{t('suggested')} · </span>
                    <span className="text-white font-black text-xl tracking-tight">{t('for_you')}</span>
                  </div>
                  <button className="tap text-muted text-xl">⋮</button>
                </div>
                <div className="flex gap-6 px-4 overflow-x-auto no-sb">
                  {suggestedGames.map((game, idx) => (
                    <button key={game.id} onClick={() => openDetail(game)}
                      className="tap flex-shrink-0 flex flex-col items-center" style={{width:115}}>
                      <div className="w-full aspect-square flex items-center justify-center transition-transform active:scale-95 duration-200">
                        <AppIcon app={game} size="lg" />
                      </div>
                      <div className="mt-3 w-full text-center px-0.5">
                        <div className="text-white text-xs font-bold leading-tight truncate">{game.name}</div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="text-amber-400 text-[10px] font-bold">★ {game.rating}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ══ RECOMMENDED FOR YOU ══ */}
            {recommended.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between px-4 mb-4">
                  <span className="text-white font-black text-xl tracking-tight">{t('recommended')}</span>
                  <button className="tap w-8 h-8 rounded-full flex items-center justify-center bg-surface border border-border hover:border-accent transition-colors">
                    <span className="text-white text-sm">→</span>
                  </button>
                </div>
                <div className="flex gap-5 px-4 overflow-x-auto no-sb">
                  {recommended.map(game => (
                    <button key={game.id} onClick={() => openDetail(game)}
                      className="tap flex-shrink-0 flex flex-col items-center" style={{width:86}}>
                      <div className="w-full aspect-square flex items-center justify-center transition-transform active:scale-95 duration-200">
                        <AppIcon app={game} size="md" />
                      </div>
                      <div className="mt-2.5 w-full text-center px-0.5">
                        <div className="text-white text-[11px] font-bold leading-tight truncate">{game.name}</div>
                        <div className="text-muted text-[9px] mt-0.5 uppercase tracking-widest truncate">{t('cat_' + game.gameCategory) || game.category}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ══ ALL GAMES LIST ══ */}
            <div className="mb-2">
              <div className="px-4 mb-4">
                <span className="text-white font-black text-xl tracking-tight">
                  {activeCat ? `${t('all')} ${t('cat_' + activeCat.id)} ${t('games')}` : t('all_games')}
                  <span className="text-muted text-sm font-normal ml-2">({listGames.length})</span>
                </span>
              </div>
              <div className="flex flex-col">
                {listGames.map(game => (
                  <button key={game.id} onClick={() => openDetail(game)}
                    className="tap flex items-center gap-5 px-4 py-4 active:bg-surface transition-colors border-b border-border">
                    <div className="w-20 h-20 flex items-center justify-center flex-shrink-0">
                      <AppIcon app={game} size="md" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-white text-base font-bold tracking-tight">{game.name}</div>
                      <div className="text-muted text-[11px] font-medium mt-1 truncate">
                        {(game.tags || []).slice(0,3).map((t_tag,i) => (
                          <span key={t_tag}>{i > 0 && <span className="mx-1">·</span>}<span className="capitalize">{t_tag}</span></span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-amber-400 text-xs font-bold">★ {game.rating}</span>
                        <span className="text-muted opacity-40">·</span>
                        <span className="text-muted text-xs font-medium uppercase tracking-tighter">{t('cat_' + game.gameCategory) || game.category}</span>
                      </div>
                    </div>
                    <div className="text-muted text-xl opacity-30 pr-1">›</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
