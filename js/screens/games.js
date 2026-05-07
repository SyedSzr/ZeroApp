// ── GAMES SCREEN — PlayScroll Immersive Feed (Pixel Perfect Figma) ────────────
var { useState, useRef } = React;

function GamesScreen() {
  const { greeting, openDetail, go, toggleSaveApp, isSaved, liveGames, liveCats, launchApp, user, t } = useApp();
  const [viewMode, setViewMode] = useState('feed');
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeOverlay, setActiveOverlay] = useState(null); // 'comments' | 'leaderboard'
  const sectionRefs = useRef({});
  const feedRef = useRef(null);
  const scrollLock = useRef(false);

  React.useEffect(() => {
    const el = feedRef.current;
    if (!el || viewMode !== 'feed') return;

    const handleWheel = (e) => {
      e.preventDefault();
      if (scrollLock.current) return;
      scrollLock.current = true;
      const dir = e.deltaY > 0 ? 1 : -1;
      el.scrollBy({ top: dir * el.clientHeight, behavior: 'smooth' });
      setTimeout(() => { scrollLock.current = false; }, 500);
    };

    let startY = 0;
    const handleTouchStart = (e) => { startY = e.touches[0].clientY; };
    const handleTouchMove = (e) => { e.preventDefault(); };
    const handleTouchEnd = (e) => {
      if (scrollLock.current) return;
      const delta = startY - e.changedTouches[0].clientY;
      if (Math.abs(delta) > 30) {
        scrollLock.current = true;
        const dir = delta > 0 ? 1 : -1;
        el.scrollBy({ top: dir * el.clientHeight, behavior: 'smooth' });
        setTimeout(() => { scrollLock.current = false; }, 500);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [viewMode]);

  const allGames = [...liveGames].sort((a, b) => {
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return dateB - dateA;
  });

  if (viewMode === 'discover') {
    return <GamesDiscoveryView
      onBack={() => setViewMode('feed')}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      sectionRefs={sectionRefs}
      openDetail={openDetail}
      go={go}
      liveCats={liveCats}
    />;
  }

  return (
    <div className="relative h-full w-full bg-black overflow-hidden font-sans">

      {/* ── TOP NAV (Header & Discover) ── */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-30 pointer-events-none" />

      <div className="absolute top-0 left-0 right-0 pt-safe px-5 pt-5 pb-1 z-40 pointer-events-none">
        <div className="flex items-start justify-between">
          <div className="flex-1 pointer-events-auto">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">⚡</span>
              <span className="text-[#fff] font-black text-xl tracking-tight font-sans">ZeroApp</span>
            </div>
            <p className="text-[#fff] text-2xl font-bold leading-tight">{greeting} 👋</p>
            <p className="text-[#fff]/60 text-sm mt-0.5">{t('games_header')}</p>

            {/* Discover Button - On the Left */}
            <button onClick={() => setViewMode('discover')}
              className="mt-4 flex items-center gap-1.5 bg-[#6b4eff] rounded-full py-1.5 px-3.5 shadow-[0_0_20px_rgba(107,78,255,0.4)] pointer-events-auto active:scale-95 transition-transform">
              <span className="text-[#fff] text-[13px]">🔍</span>
              <span className="text-[#fff] text-[13px] font-bold">{t('discover')}</span>
            </button>
          </div>

          <div className="flex flex-col items-center gap-2 mt-1 pointer-events-auto">
            <button className="tap w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md border border-[#fff]/10 flex items-center justify-center">
              <span className="text-xl">🔔</span>
            </button>
            {!user && (
              <button onClick={() => go('auth')} className="tap bg-[#6b4eff] text-[#fff] text-[13px] font-bold px-3.5 py-1.5 rounded-full shadow-[0_0_20px_rgba(107,78,255,0.4)] whitespace-nowrap">
                {t('sign_in')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Feed Container (Strict 1-by-1 JS Scroll) ── */}
      <div ref={feedRef} className="h-full w-full overflow-hidden no-sb">
        {allGames.map((game, idx) => (
          <div key={game.id} className="h-full w-full relative flex flex-col justify-end flex-shrink-0">

            {/* Background Visual */}
            <div className="absolute inset-0 z-0">
              {game.featured_image ? (
                <img src={game.featured_image} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <div className={`absolute inset-0 bg-[#0d0d12]`} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-10 blur-3xl">
                    <span style={{ fontSize: '350px' }}>{game.emoji}</span>
                  </div>
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            {/* Pagination Dots (from screenshot) */}
            <div className="absolute bottom-52 left-5 flex gap-1 z-20 opacity-50">
              <div className="w-2 h-1 bg-[#fff] rounded-full"></div>
              <div className="w-1 h-1 bg-[#fff]/50 rounded-full"></div>
              <div className="w-1 h-1 bg-[#fff]/50 rounded-full"></div>
            </div>

            {/* ── Right Side Action Stack (All Icons) ── */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20 pointer-events-auto">
              <div className="relative mb-2">
                <div className="w-12 h-12 rounded-full border-[1.5px] border-[#fff] flex items-center justify-center bg-card overflow-hidden">
                  <AppIcon app={game} size="md" />
                </div>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#FF2D55] border-2 border-black flex items-center justify-center text-[#fff] text-[10px] font-bold">+</div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="#FF2D55" stroke="#FF2D55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md hover:scale-110 transition-transform cursor-pointer"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                <span className="text-[#fff] text-[12px] font-bold drop-shadow-md">1206</span>
              </div>

              <div className="flex flex-col items-center gap-1" onClick={() => setActiveOverlay('comments')}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md hover:scale-110 transition-transform cursor-pointer"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                <span className="text-[#fff] text-[12px] font-bold drop-shadow-md">45</span>
              </div>

              <div className="flex flex-col items-center gap-1" onClick={() => toggleSaveApp(game)}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill={isSaved(game.id) ? "#fff" : "none"} stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md hover:scale-110 transition-transform cursor-pointer"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                <span className="text-[#fff] text-[12px] font-bold drop-shadow-md">{t('save')}</span>
              </div>

              <div className="flex flex-col items-center gap-1" onClick={() => setActiveOverlay('leaderboard')}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md hover:scale-110 transition-transform cursor-pointer"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg>
              </div>

              <div className="flex flex-col items-center gap-1 mt-1">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md hover:scale-110 transition-transform cursor-pointer"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </div>
            </div>

            {/* ── Bottom Info Section ── */}
            <div className="px-5 pb-24 pt-20 bg-gradient-to-t from-black via-black/80 to-transparent z-10 flex items-end justify-between pointer-events-none">
              <div className="flex-1 pr-16 pointer-events-auto">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#fff] font-bold text-[15px] drop-shadow-md">PixelStudios</span>
                  <span className="bg-[#fff]/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-[#fff] text-[10px] font-bold tracking-wide">{t('developer')}</span>
                </div>
                <h2 className="text-[#fff] text-[26px] font-black leading-tight mb-2 drop-shadow-lg">{game.name}</h2>
                <p className="text-[#fff]/80 text-[13px] font-medium leading-snug mb-3 line-clamp-2 drop-shadow-md">
                  {game.desc || "High speed racing in a neon city.\nDodge traffic and hit the checkpoints!"}
                </p>

                {/* Tags */}
                <div className="flex gap-2 mb-5">
                  {['#Racing', '#Action', '#Cyberpunk'].map(tag => (
                    <span key={tag} className="bg-black/40 border border-[#fff]/10 backdrop-blur-sm px-2.5 py-1 rounded-md text-[#fff]/90 text-[11px] font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Play Button */}
                <button onClick={() => { launchApp(game); }}
                  className="w-[85%] py-3.5 rounded-xl bg-gradient-to-r from-[#5a3eff] to-[#7b5cff] text-[#fff] font-bold text-[16px] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(90,62,255,0.4)] active:scale-[0.97] transition-transform">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  {t('play_now')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Overlays ── */}
      {activeOverlay === 'comments' && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-auto">
          <div className="absolute inset-0 bg-black/50" onClick={() => setActiveOverlay(null)}></div>
          <div className="bg-[#111] w-full h-[65%] rounded-t-3xl relative flex flex-col slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="w-12 h-1 bg-[#fff]/20 rounded-full mx-auto mt-3 mb-2"></div>
            <h3 className="text-[#fff] font-bold text-center py-2 border-b border-[#fff]/10">{t('comments_count')}</h3>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs text-[#fff] font-bold">JD</div>
                <div className="flex-1">
                  <div className="text-[#fff]/60 text-xs font-semibold">John Doe</div>
                  <div className="text-[#fff] text-sm mt-0.5">This game is incredibly addictive! I can't stop playing it.</div>
                  <div className="text-[#fff]/40 text-[10px] mt-1">2h ago</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-xs text-[#fff] font-bold">AS</div>
                <div className="flex-1">
                  <div className="text-[#fff]/60 text-xs font-semibold">Alice Smith</div>
                  <div className="text-[#fff] text-sm mt-0.5">The graphics are insane. Love the new update!</div>
                  <div className="text-[#fff]/40 text-[10px] mt-1">5h ago</div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[#fff]/10 flex gap-2">
              <input type="text" placeholder={t('add_comment')} className="flex-1 bg-[#fff]/10 border-none rounded-full px-4 py-2 text-sm text-[#fff] focus:outline-none" />
              <button className="bg-[#6b4eff] text-[#fff] p-2 rounded-full w-10 h-10 flex items-center justify-center">➤</button>
            </div>
          </div>
        </div>
      )}

      {activeOverlay === 'leaderboard' && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-auto">
          <div className="absolute inset-0 bg-black/50" onClick={() => setActiveOverlay(null)}></div>
          <div className="bg-[#111] w-full h-[75%] rounded-t-3xl relative flex flex-col slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="w-12 h-1 bg-[#fff]/20 rounded-full mx-auto mt-3 mb-2"></div>
            <h3 className="text-[#fff] font-bold text-center py-2 border-b border-[#fff]/10">{t('leaderboard')}</h3>
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="flex justify-center items-end gap-4 mb-8">
                {/* 2nd Place */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-400 border-4 border-[#111] z-10 flex items-center justify-center text-[#fff] font-bold">S</div>
                  <div className="bg-gradient-to-t from-gray-500 to-gray-300 w-16 h-20 rounded-t-xl mt-[-10px] flex items-center justify-center text-xl font-black text-[#fff]/50">2</div>
                </div>
                {/* 1st Place */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-yellow-400 border-4 border-[#111] z-10 flex items-center justify-center text-black text-xl font-black">👑</div>
                  <div className="bg-gradient-to-t from-yellow-600 to-yellow-400 w-20 h-28 rounded-t-xl mt-[-15px] flex items-center justify-center text-3xl font-black text-[#fff]/50">1</div>
                </div>
                {/* 3rd Place */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-amber-700 border-4 border-[#111] z-10 flex items-center justify-center text-[#fff] font-bold">B</div>
                  <div className="bg-gradient-to-t from-amber-800 to-amber-600 w-16 h-16 rounded-t-xl mt-[-10px] flex items-center justify-center text-xl font-black text-[#fff]/50">3</div>
                </div>
              </div>
              <div className="space-y-3">
                {[4, 5, 6, 7, 8].map(rank => (
                  <div key={rank} className="flex items-center gap-4 bg-[#fff]/5 p-3 rounded-2xl">
                    <span className="text-[#fff]/40 font-bold w-4 text-center">{rank}</span>
                    <div className="w-8 h-8 rounded-full bg-[#fff]/20 flex items-center justify-center text-xs font-bold text-[#fff]">U</div>
                    <span className="text-[#fff] font-medium flex-1">User {rank}29</span>
                    <span className="text-[#fff] font-bold">{10000 - rank * 450} {t('pts')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DISCOVERY VIEW (The previous grid layout) ──────────────────────────────────
function GamesDiscoveryView({ onBack, activeCategory, setActiveCategory, sectionRefs, openDetail, go, liveCats }) {
  const { liveGames, t } = useApp();
  const gameCategories = liveCats.filter(c => c.type === 'game');
  function handleCategoryPress(catId) {
    if (activeCategory === catId) { setActiveCategory(null); return; }
    setActiveCategory(catId);
    setTimeout(() => {
      const el = sectionRefs.current[catId];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  const categoriesToShow = activeCategory
    ? gameCategories.filter(c => c.id === activeCategory)
    : gameCategories;

  return (
    <div className="slide-up flex flex-col h-full" style={{ background: '#000' }}>
      <div className="flex-1 overflow-y-auto no-sb pb-24">
        <div className="pt-safe px-5 pt-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="text-[#fff]/40 text-2xl">←</button>
              <h1 className="text-[#fff] text-2xl font-black tracking-tight">{t('discover')}</h1>
            </div>
            <button className="w-10 h-10 rounded-full bg-[#fff]/5 border border-[#fff]/10 flex items-center justify-center text-xl">🏆</button>
          </div>
          <div className="relative mb-6" onClick={() => go('search')}>
            <div className="flex items-center gap-3 bg-[#1A1A1A] border border-[#fff]/5 rounded-2xl py-4 px-5">
              <span className="text-[#fff]/40">🔍</span>
              <span className="text-[#fff]/40 text-sm font-medium">{t('search_games')}</span>
            </div>
          </div>
        </div>

        <div className="px-5 mb-8">
          <h2 className="text-[#fff] text-lg font-bold mb-5 tracking-tight">{t('categories')}</h2>
          <div className="flex gap-6 overflow-x-auto no-sb">
            {gameCategories.map(cat => (
              <button key={cat.id} onClick={() => handleCategoryPress(cat.id)}
                className="tap flex-shrink-0 flex flex-col items-center gap-3">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${activeCategory === cat.id ? 'bg-accent shadow-[0_0_20px_rgba(155,132,255,0.4)]' : 'bg-[#fff]/5'}`}>
                  <span className="text-2xl">{cat.emoji}</span>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${activeCategory === cat.id ? 'text-[#fff]' : 'text-[#fff]/40'}`}>{t('cat_' + cat.id)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-5">
          {categoriesToShow.map(cat => {
            const catGames = liveGames.filter(g => g.gameCategory === cat.id);
            if (catGames.length === 0) return null;
            return (
              <div key={cat.id} ref={el => sectionRefs.current[cat.id] = el} className="mb-12">
                <h3 className="text-[#fff] font-black text-xs uppercase mb-5 tracking-[0.2em] opacity-40">{t('cat_' + cat.id)}</h3>
                <div className="grid grid-cols-3 gap-5">
                  {catGames.slice(0, 6).map(game => (
                    <button key={game.id} onClick={() => openDetail(game)} className="tap group flex flex-col items-center w-full">
                      <div className="aspect-square w-full flex items-center justify-center mb-3 transition-transform active:scale-95 duration-200">
                        <AppLogo app={game} size="md" />
                      </div>
                      <div className="w-full text-center px-0.5">
                        <div className="text-[#fff] text-[11px] font-bold truncate leading-tight">{game.name}</div>
                        <div className="flex items-center justify-center gap-1 mt-1 text-[10px] text-amber-400 font-bold">
                          <span>★</span> {game.rating || "4.8"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
