// ── HOME SCREEN — Redesigned ──────────────────────────────────────────────────
var { useState, useEffect, useMemo, useRef } = React;

function AppsScreen() {
  const { greeting, recents, openDetail, go, liveApps, liveCats, t, getPromoItems, getSmartRecommendations, userProfile, launchApp } = useApp();
  
  const featuredApp = getPromoItems('featured_app', 'app')?.[0] || liveApps.find(a => a.is_featured) || liveApps[0];
  const recommended = getSmartRecommendations('app');
  const trending = getPromoItems('trending', 'app') || liveApps.slice(6, 12);
  const featuredSmall = getPromoItems('featured_apps', 'app') || liveApps.filter(a => a.is_featured).slice(0, 8);
  const hotRightNow = getPromoItems('hot_right_now', 'app') || liveApps.slice(3, 9);
  const topPicks = getPromoItems('top_pick_for_you', 'app') || liveApps.slice(12, 18);
  const editorsPicks = getPromoItems('editors_picks', 'app') || liveApps.slice(1, 7);
  const popular = getPromoItems('popular_apps', 'app') || liveApps.slice(8, 14);
  const newExp = getPromoItems('new_experience', 'app') || liveApps.slice(15, 21);
  const superApps = getPromoItems('super_apps', 'app') || liveApps.slice(0, 4);
  const mightLike = getPromoItems('apps_might_like', 'app') || liveApps.slice(10, 16);
  const personalized = getSmartRecommendations('app').slice(0, 6);
  const crowdFavs = getPromoItems('crowd_favorites', 'app') || liveApps.slice(2, 8);
  const monthBest = getPromoItems('this_month_best', 'app') || liveApps.slice(4, 10);

  const SectionHeader = ({ title, onSeeAll }) => (
    <div className="px-5 flex items-center justify-between mb-4 mt-8">
      <span className="text-white font-black text-xl tracking-tight">{t(title)}</span>
      {onSeeAll && (
        <button onClick={onSeeAll} className="tap text-accent text-xs font-bold uppercase tracking-widest">
          {t('see_all')} →
        </button>
      )}
    </div>
  );

  const HorizontalScroll = ({ apps, size = 'md' }) => (
    <div className="flex gap-5 px-5 overflow-x-auto no-sb pb-2">
      {apps.map(app => {
        const isGame = !!app.gameCategory;
        return (
          <div key={app.id} onClick={() => {
            if (isGame) {
              launchApp(app);
            } else {
              openDetail(app);
            }
          }}
            className="tap flex-shrink-0 flex flex-col items-center cursor-pointer" style={{ width: size === 'lg' ? 115 : size === 'md' ? 86 : 64 }}>
            <div className="w-full aspect-square relative flex items-center justify-center transition-transform active:scale-95 duration-200">
              <AppIcon app={app} size={size} />
              {isGame && (
                <button 
                  onClick={(e) => { e.stopPropagation(); openDetail(app); }}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-black/75 border border-white/20 flex items-center justify-center text-white text-xs font-bold hover:bg-black transition-all tap z-10"
                  title="View Details"
                >
                  ›
                </button>
              )}
            </div>
            <div className="mt-2 w-full text-center px-0.5">
              <div className="text-white text-[11px] font-bold leading-tight truncate">{app.name}</div>
              <div className="text-muted text-[9px] mt-0.5 uppercase tracking-widest truncate">{app.category}</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="slide-up flex flex-col h-full bg-bg">
      <div className="flex-1 overflow-y-auto no-sb pb-32">

        {/* ── Header ── */}
        <div className="pt-safe px-5 pt-5 pb-1 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">⚡</span>
              <span className="text-white font-black text-xl tracking-tight">ZeroApp</span>
            </div>
            <p className="text-white text-2xl font-bold leading-tight">{greeting} 👋</p>
            <p className="text-muted text-sm mt-0.5">{t('home_header')}</p>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-shrink-0">
            <button 
              onClick={() => go('store')} 
              className="tap flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/25 rounded-2xl text-xs font-black shadow-lg shadow-amber-500/5 transition-all"
              title="Open ZCoin Store"
            >
              <ZCoinIcon size={16} />
              <span>{userProfile?.zcoins ?? 0}</span>
              <span className="text-[10px] bg-amber-500 text-white w-4 h-4 rounded-md flex items-center justify-center font-black ml-0.5 border border-amber-400/30">+</span>
            </button>
            <button className="tap w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-white">
              <span className="text-xl">🔔</span>
            </button>
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div className="px-5 mt-4" onClick={() => go('search')}>
          <div className="flex items-center gap-3 bg-surface border border-border rounded-2xl py-3 px-4 cursor-pointer">
            <span className="text-muted">🔍</span>
            <span className="text-muted text-sm flex-1">{t('search_apps')}</span>
            <span className="text-[10px] text-muted opacity-40">⌘K</span>
          </div>
        </div>

        {/* ── 1. Featured App (Large Image) ── */}
        {featuredApp && (
          <div className="mt-8 px-5">
            <div className="flex items-center justify-between mb-4">
               <span className="text-white font-black text-xl tracking-tight">{t('featured_app')}</span>
            </div>
            <div onClick={() => {
              if (featuredApp.gameCategory) {
                launchApp(featuredApp);
              } else {
                openDetail(featuredApp);
              }
            }}
              className="tap w-full group relative flex flex-col cursor-pointer">
              <div className="w-full aspect-[16/9] rounded-3xl overflow-hidden relative border border-border bg-surface">
                {featuredApp.gameCategory && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); openDetail(featuredApp); }}
                    className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-black/60 border border-white/20 flex items-center justify-center text-white text-lg font-bold hover:bg-black transition-all tap z-10"
                    title="View Details"
                  >
                    ›
                  </button>
                )}
                {featuredApp.featured_image ? (
                  <img src={featuredApp.featured_image} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent/20 to-purple-900/40">
                     <span className="text-6xl">{featuredApp.emoji}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                   <AppIcon app={featuredApp} size="sm" />
                   <div className="flex-1 text-left">
                      <div className="font-bold text-lg leading-tight" style={{color:'#fff'}}>{featuredApp.name}</div>
                      <div className="text-xs" style={{color:'rgba(255,255,255,0.7)'}}>{featuredApp.category} · ★ {featuredApp.rating}</div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. Recommended for you ── */}
        <SectionHeader title="recommended_for_you" onSeeAll={() => go('explore')} />
        <HorizontalScroll apps={recommended} size="lg" />

        {/* ── 3. Trending ── */}
        <SectionHeader title="trending" />
        <HorizontalScroll apps={trending} size="md" />

        {/* ── 4. Featured Apps ── */}
        <SectionHeader title="featured_apps" />
        <HorizontalScroll apps={featuredSmall} size="md" />

        {/* ── 5. Hot Right Now ── */}
        <SectionHeader title="hot_right_now" />
        <HorizontalScroll apps={hotRightNow} size="md" />

        {/* ── 6. Top Pick For You ── */}
        <SectionHeader title="top_pick_for_you" />
        <HorizontalScroll apps={topPicks} size="md" />

        {/* ── 7. Editors Picks ── */}
        <SectionHeader title="editors_picks" />
        <div className="px-5 grid grid-cols-2 gap-4">
          {editorsPicks.slice(0, 4).map(app => {
            const isGame = !!app.gameCategory;
            return (
              <div key={app.id} onClick={() => {
                if (isGame) {
                  launchApp(app);
                } else {
                  openDetail(app);
                }
              }}
                className="tap flex items-center gap-3 p-2 bg-surface rounded-2xl border border-border cursor-pointer relative">
                <AppIcon app={app} size="xs" />
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-white text-xs font-bold truncate">{app.name}</div>
                  <div className="text-muted text-[9px] truncate uppercase">{app.category}</div>
                </div>
                {isGame && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); openDetail(app); }}
                    className="w-7 h-7 rounded-xl bg-card border border-border flex items-center justify-center text-muted hover:text-white transition-all tap flex-shrink-0"
                  >
                    ›
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ── 8. Popular Apps ── */}
        <SectionHeader title="popular_apps" />
        <HorizontalScroll apps={popular} size="md" />

        {/* ── 9. New Experience ── */}
        <SectionHeader title="new_experience" />
        <HorizontalScroll apps={newExp} size="md" />

        {/* ── 10. Super Apps ── */}
        <SectionHeader title="super_apps" />
        <div className="px-5 flex flex-col gap-3">
          {superApps.map(app => {
            const isGame = !!app.gameCategory;
            return (
              <div key={app.id} onClick={() => {
                if (isGame) {
                  launchApp(app);
                } else {
                  openDetail(app);
                }
              }}
                className="tap flex items-center gap-4 p-3 bg-surface rounded-2xl border border-border cursor-pointer">
                <AppIcon app={app} size="sm" />
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-white text-base font-bold truncate">{app.name}</div>
                  <div className="text-muted text-xs truncate">{app.desc || app.category}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {isGame && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); openDetail(app); }}
                      className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-muted hover:text-white transition-all tap"
                    >
                      ›
                    </button>
                  )}
                  <div className="text-accent font-bold text-xs uppercase tracking-widest">{t('launch_app')}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 11. Apps You might Like ── */}
        <SectionHeader title="apps_might_like" />
        <HorizontalScroll apps={mightLike} size="md" />

        {/* ── 12. Personalize Recomendations ── */}
        <SectionHeader title="personalize_recommendations" />
        <div className="px-5">
           <PersonalizedCard 
             type="app" 
             data={liveApps} 
             t={t} 
             openDetail={openDetail} 
           />
        </div>

        {/* ── 13. Crowd Favorites ── */}
        <SectionHeader title="crowd_favorites" />
        <HorizontalScroll apps={crowdFavs} size="md" />

        {/* ── 14. This Month's Best ── */}
        <SectionHeader title="this_month_best" />
        <div className="px-5 pb-10">
          <div className="grid grid-cols-1 gap-4">
            {monthBest.map((app, idx) => {
              const isGame = !!app.gameCategory;
              return (
                <div key={app.id} onClick={() => {
                  if (isGame) {
                    launchApp(app);
                  } else {
                    openDetail(app);
                  }
                }}
                  className="tap flex items-center gap-4 cursor-pointer">
                  <span className="text-white/20 font-black text-2xl italic w-8 text-center">{idx + 1}</span>
                  <AppIcon app={app} size="sm" />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-white text-base font-bold truncate">{app.name}</div>
                    <div className="text-muted text-xs truncate uppercase tracking-widest">{app.category}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                       <span>★</span> {app.rating}
                    </div>
                    {isGame && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); openDetail(app); }}
                        className="w-7 h-7 rounded-xl bg-surface border border-border flex items-center justify-center text-muted hover:text-white transition-all tap"
                      >
                        ›
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
