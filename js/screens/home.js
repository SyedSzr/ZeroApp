// ── HOME SCREEN — Redesigned ──────────────────────────────────────────────────
const { useState, useEffect, useMemo, useRef } = React;

function AppsScreen() {
  const { greeting, recents, openDetail, go, liveApps, liveCats, settings, user } = useApp();
  const [activeCategory, setActiveCategory] = useState(null);
  const sectionRefs = useRef({});

  const homeCategories = liveCats.filter(c => c.type === 'app');

  // When a category pill is tapped, scroll to its section
  function handleCategoryPress(catId) {
    if (activeCategory === catId) {
      setActiveCategory(null); // deselect = show all
      return;
    }
    setActiveCategory(catId);
    // Scroll to the matching section
    setTimeout(() => {
      const el = sectionRefs.current[catId];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  // Which categories to render (all, or just selected)
  const categoriesToShow = activeCategory
    ? homeCategories.filter(c => c.id === activeCategory)
    : homeCategories;

  return (
    <div className="slide-up flex flex-col h-full">
      <div className="flex-1 overflow-y-auto no-sb pb-24" id="home-scroll">

        {/* ── Header ── */}
        <div className="pt-safe px-5 pt-5 pb-1 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">⚡</span>
              <span className="text-white font-black text-xl tracking-tight">ZeroApp</span>
            </div>
            <p className="text-white text-2xl font-bold leading-tight">{greeting}, Ali 👋</p>
            <p className="text-muted text-sm mt-0.5">What would you like to do today?</p>
          </div>
          <div className="flex flex-col items-center gap-2 mt-1">
            <button className="tap w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
              <span className="text-xl">🔔</span>
            </button>
            {!user && (
              <button onClick={() => go('auth')} className="tap bg-accent text-white text-[13px] font-bold px-3.5 py-1.5 rounded-full shadow-[0_0_20px_rgba(124,106,247,0.4)] whitespace-nowrap">
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div className="px-5 mt-4" onClick={() => go('search')}>
          <div className="flex items-center gap-3 bg-card border border-border rounded-2xl py-3.5 px-4 cursor-pointer">
            <span className="text-muted text-base">🔍</span>
            <span className="text-muted text-sm flex-1">Search apps...</span>
            <span className="text-[10px] text-muted bg-surface border border-border px-1.5 py-0.5 rounded-md">⌘K</span>
          </div>
        </div>

        {/* ── Category Pills ── */}
        <div className="mt-5">
          <div className="px-5 flex items-center justify-between mb-3">
            <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Categories</span>
            {activeCategory && (
              <button onClick={() => setActiveCategory(null)}
                className="tap text-accent text-xs font-semibold">Show All</button>
            )}
          </div>
          <div className="flex gap-4 pl-5 pr-3 overflow-x-auto no-sb pb-2">
            {homeCategories.map(cat => (
              <CategoryPill
                key={cat.id}
                cat={cat}
                active={activeCategory === cat.id}
                onPress={handleCategoryPress}
              />
            ))}
          </div>
        </div>

        {/* ── Recently Used ── */}
        {recents.length > 0 && (
          <div className="mt-5">
            <div className="px-5 flex items-center justify-between mb-3">
              <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Recently Used</span>
              <button onClick={() => go('recent')} className="tap text-accent text-xs font-semibold">View All</button>
            </div>
            <div className="flex gap-5 pl-5 overflow-x-auto no-sb pb-1">
              {recents.slice(0, 8).map(app => (
                <button key={app.id + app.openedAt} onClick={() => openDetail(app)}
                  className="tap flex flex-col items-center gap-3 flex-shrink-0">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <AppIcon app={app} size="sm" />
                  </div>
                  <span className="text-white/70 text-[10px] font-bold text-center max-w-[64px] truncate tracking-tight">{app.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Category Sections with 3-column Square Grid ── */}
        <div className="mt-6">
          {categoriesToShow.map(cat => {
            const catApps = liveApps.filter(a => a.homeCategory === cat.id);
            if (catApps.length === 0) return null;

            const displayApps = catApps.slice(0, 6); // show first 6

            return (
              <div
                key={cat.id}
                ref={el => sectionRefs.current[cat.id] = el}
                className="mb-7"
              >
                {/* Section Header */}
                <div className="px-5 flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${cat.grad} flex items-center justify-center text-sm`}>
                      {cat.emoji}
                    </div>
                    <span className="text-white font-extrabold text-base">{cat.label}</span>
                    <span className="text-muted text-xs">({catApps.length})</span>
                  </div>
                  <button
                    onClick={() => go('explore', { exploreCategory: cat.id })}
                    className="tap flex items-center gap-1 text-accent text-xs font-semibold">
                    See all <span>→</span>
                  </button>
                </div>

                {/* 3-Column Square Grid */}
                <div className="px-4 grid grid-cols-3 gap-3">
                  {displayApps.map(app => (
                    <AppSquareCard key={app.id} app={app} onPress={openDetail} />
                  ))}
                </div>

                {/* Divider */}
                {!activeCategory && (
                  <div className="mx-5 mt-6 border-t border-white/5" />
                )}
              </div>
            );
          })}
        </div>

      </div>

      <BottomNav active="apps" />
    </div>
  );
}
