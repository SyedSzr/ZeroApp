const { useState, useEffect, useMemo, useRef } = React;

function ExploreScreen({ exploreCategory }) {
  const { openDetail, go, liveApps, liveCats } = useApp();
  const homeCategories = liveCats.filter(c => c.type === 'app');

  // Build tab list: 'All' + every home category label
  const ALL_TAB = 'All';
  const categoryTabs = homeCategories; // the categories from cloud

  // Find the initial active tab from exploreCategory context
  function getInitialTab() {
    if (!exploreCategory) return ALL_TAB;
    const found = homeCategories.find(c => c.id === exploreCategory);
    return found ? found.label : ALL_TAB;
  }

  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Re-sync if context changes (e.g. navigating back then forward)
  useEffect(() => {
    if (!exploreCategory) { setActiveTab(ALL_TAB); return; }
    const found = homeCategories.find(c => c.id === exploreCategory);
    if (found) setActiveTab(found.label);
  }, [exploreCategory, liveCats]);

  // Derive active category object
  const activeCat = activeTab === ALL_TAB
    ? null
    : homeCategories.find(c => c.label === activeTab);

  // Filter apps by selected tab
  const listApps = activeCat
    ? liveApps.filter(a => a.homeCategory === activeCat.id)
    : liveApps;

  // Card gradient backgrounds
  const heroBgs = [
    'linear-gradient(135deg,#1a1a3e 0%,#2d1b69 40%,#11071f 100%)',
    'linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)',
    'linear-gradient(135deg,#1f4037 0%,#244c3c 50%,#0f2027 100%)',
    'linear-gradient(135deg,#3a1c71 0%,#d76d77 50%,#ffaf7b 100%)',
    'linear-gradient(135deg,#141e30 0%,#243b55 100%)',
    'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)',
  ];

  // Open button accent — use category color if available, else default
  const accentBtn = activeCat
    ? `bg-gradient-to-r ${activeCat.grad}`
    : 'bg-accent';

  const headerLabel = activeCat
    ? `${activeCat.emoji} ${activeCat.label}`
    : '🧭 Explore';

  // ── Featured Content ──
  const heroBanners = listApps.filter(a => a.is_featured).slice(0, 5);
  const featuredApp = heroBanners[0];
  
  const suggestedApps = listApps.slice(0, 8);
  const recommended   = listApps.slice(5, 13);

  return (
    <div className="slide-right flex flex-col h-full" style={{background:'#000'}}>

      {/* ── Header ── */}
      <div className="pt-safe flex-shrink-0" style={{background:'#000', borderBottom:'1px solid #1a1a1a'}}>
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <button onClick={() => go('apps')} className="tap text-white text-xl">←</button>
          <span className="text-white font-extrabold text-base tracking-tight">{headerLabel}</span>
          <button onClick={() => go('search')} className="tap text-gray-400 text-xl">🔍</button>
        </div>

        {/* ── Tab Strip: All + 12 categories ── */}
        <div className="flex overflow-x-auto no-sb px-2 pt-1 pb-1">
          <button onClick={() => setActiveTab(ALL_TAB)}
            className={`tap flex-shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === ALL_TAB ? 'text-white border-accent' : 'text-gray-500 border-transparent'
            }`}>
            {ALL_TAB}
          </button>

          {/* Category tabs */}
          {categoryTabs.map(cat => (
            <button key={cat.id} onClick={() => setActiveTab(cat.label)}
              className={`tap flex-shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === cat.label ? 'text-white border-accent' : 'text-gray-500 border-transparent'
              }`}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto no-sb pb-24" style={{background:'#000'}}>

        {listApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted">
            <span className="text-5xl">📭</span>
            <p className="text-sm">No apps in this category yet</p>
          </div>
        ) : (
          <>
            {/* ══ HERO CAROUSEL ══ */}
            {heroBanners.length > 0 && (
              <div className="mt-4 mb-6">
                <div className="flex gap-4 px-4 overflow-x-auto no-sb snap-x snap-mandatory">
                  {heroBanners.map((app, idx) => (
                    <button key={app.id} onClick={() => openDetail(app)}
                      className="tap flex-shrink-0 snap-start flex flex-col w-[280px] group">
                      
                      {/* Top Graphic */}
                      <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden relative border border-white/5 bg-[#111]">
                        {app.featured_image ? (
                          <img src={app.featured_image} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center opacity-30" style={{ background: heroBgs[idx % heroBgs.length] }}>
                             <span className="text-4xl">{app.emoji}</span>
                          </div>
                        )}
                        
                        {/* Featured Badge Overlay */}
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black text-white uppercase tracking-wider">
                          Featured
                        </div>
                      </div>

                      {/* Bottom Details */}
                      <div className="flex items-center gap-3 mt-3 px-1">
                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 shadow-lg flex-shrink-0">
                          <AppIcon app={app} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="text-white text-sm font-bold truncate tracking-tight">{app.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-gray-500 text-[11px] font-medium">{app.category}</span>
                            <span className="text-gray-600">·</span>
                            <span className="text-amber-400 text-[11px] font-bold">★ {app.rating}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ══ SUGGESTED FOR YOU ══ */}
            {suggestedApps.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between px-4 mb-4">
                  <div>
                    <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Suggested · </span>
                    <span className="text-white font-black text-xl tracking-tight">For you</span>
                  </div>
                  <button className="tap text-gray-500 text-xl">⋮</button>
                </div>
                <div className="flex gap-6 px-4 overflow-x-auto no-sb">
                  {suggestedApps.map((app, idx) => (
                    <button key={app.id} onClick={() => openDetail(app)}
                      className="tap flex-shrink-0 flex flex-col items-center" style={{width:115}}>
                      <div className="w-full aspect-square flex items-center justify-center transition-transform active:scale-95 duration-200">
                        <AppIcon app={app} size="lg" />
                      </div>
                      <div className="mt-3 w-full text-center px-0.5">
                        <div className="text-white text-xs font-bold leading-tight truncate">{app.name}</div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="text-amber-400 text-[10px] font-bold">★ {app.rating}</span>
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
                  <span className="text-white font-black text-xl tracking-tight">Recommended for you</span>
                  <button className="tap w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-white text-sm">→</span>
                  </button>
                </div>
                <div className="flex gap-5 px-4 overflow-x-auto no-sb">
                  {recommended.map(app => (
                    <button key={app.id} onClick={() => openDetail(app)}
                      className="tap flex-shrink-0 flex flex-col items-center" style={{width:86}}>
                      <div className="w-full aspect-square flex items-center justify-center transition-transform active:scale-95 duration-200">
                        <AppIcon app={app} size="md" />
                      </div>
                      <div className="mt-2.5 w-full text-center px-0.5">
                        <div className="text-white text-[11px] font-bold leading-tight truncate">{app.name}</div>
                        <div className="text-gray-500 text-[9px] mt-0.5 uppercase tracking-widest truncate">{app.category}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ══ ALL APPS LIST ══ */}
            <div className="mb-2">
              <div className="px-4 mb-4">
                <span className="text-white font-black text-xl tracking-tight">
                  {activeCat ? `All ${activeCat.label} Apps` : 'All Apps'}
                  <span className="text-gray-600 text-sm font-normal ml-2">({listApps.length})</span>
                </span>
              </div>
              <div className="flex flex-col">
                {listApps.map(app => (
                  <button key={app.id} onClick={() => openDetail(app)}
                    className="tap flex items-center gap-5 px-4 py-4 active:bg-white/5 transition-colors border-b border-white/[0.03]">
                    <div className="w-20 h-20 flex items-center justify-center flex-shrink-0">
                      <AppIcon app={app} size="md" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-white text-base font-bold tracking-tight">{app.name}</div>
                      <div className="text-gray-500 text-[11px] font-medium mt-1 truncate">
                        {(app.tags || []).slice(0,3).map((t,i) => (
                          <span key={t}>{i > 0 && <span className="mx-1">·</span>}<span className="capitalize">{t}</span></span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-amber-400 text-xs font-bold">★ {app.rating}</span>
                        <span className="text-gray-700">·</span>
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-tighter">{app.category}</span>
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

      <BottomNav active="explore" />
    </div>
  );
}
