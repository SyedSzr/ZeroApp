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

  const heroBanners   = listApps.slice(0, 3);
  const featuredApp   = listApps[0];
  const suggestedApps = listApps.slice(1, 8);
  const recommended   = listApps.slice(5, 13);

  const headerLabel = activeCat
    ? `${activeCat.emoji} ${activeCat.label}`
    : '🧭 Explore';

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
        <div className="flex overflow-x-auto no-sb px-3 gap-0 pb-0">
          {/* "All" tab */}
          <button onClick={() => setActiveTab(ALL_TAB)}
            className={`tap flex-shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === ALL_TAB ? 'text-white border-accent' : 'text-gray-500 border-transparent'
            }`}>
            All
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
            <div className="mt-3 mb-2">
              <div className="flex gap-3 px-4 overflow-x-auto no-sb snap-x snap-mandatory">
                {heroBanners.map((app, idx) => (
                  <button key={app.id} onClick={() => openDetail(app)}
                    className="tap flex-shrink-0 snap-start rounded-2xl overflow-hidden relative"
                    style={{ width:'calc(100% - 40px)', minWidth:'calc(100% - 40px)', height:200,
                             background: heroBgs[idx % heroBgs.length] }}>
                    {/* bg art */}
                    {app.icon_url ? (
                      <img src={app.icon_url} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" />
                    ) : (
                      <span style={{ position:'absolute', right:-20, top:-20, fontSize:180, opacity:.12, transform:'rotate(-10deg)', lineHeight:1, userSelect:'none', pointerEvents:'none' }}>{app.emoji}</span>
                    )}
                    {/* fg icon */}
                    <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-60%)' }}>
                      <div className="w-16 h-16 rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                        <AppIcon app={app} size="lg" />
                      </div>
                    </div>
                    {/* gradient overlay */}
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, height:80,
                                  background:'linear-gradient(to top,rgba(0,0,0,.85),transparent)' }}/>
                    {/* "Now available" badge */}
                    <div style={{ position:'absolute', top:12, left:12 }}
                      className="bg-black/60 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Now available
                    </div>
                    {/* title */}
                    <div style={{ position:'absolute', bottom:14, left:16, right:16 }}>
                      <p className="text-white font-extrabold text-base leading-tight text-left"
                         style={{ textShadow:'0 1px 8px rgba(0,0,0,.8)' }}>
                        {app.name} · {app.category}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ══ FEATURED APP ROW ══ */}
            {featuredApp && (
              <div className="mx-4 mt-0 mb-4 px-4 py-3 rounded-2xl flex items-center gap-3"
                style={{ background:'#111', border:'1px solid #1f1f1f' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-[#222] overflow-hidden">
                  <AppIcon app={featuredApp} size="md" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-bold truncate">{featuredApp.name}</div>
                  <div className="text-gray-500 text-xs">{featuredApp.category}</div>
                  <span className="text-amber-400 text-xs">★ {featuredApp.rating}</span>
                </div>
                <button onClick={() => openDetail(featuredApp)}
                  className={`tap flex-shrink-0 ${accentBtn} text-white text-xs font-bold px-4 py-2 rounded-full`}>
                  Open
                </button>
              </div>
            )}

            {/* ══ SUGGESTED FOR YOU ══ */}
            {suggestedApps.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between px-4 mb-3">
                  <div>
                    <span className="text-gray-500 text-xs font-semibold">Suggested · </span>
                    <span className="text-white font-extrabold text-lg">For you</span>
                  </div>
                  <button className="tap text-gray-500 text-xl">⋮</button>
                </div>
                <div className="flex gap-4 px-4 overflow-x-auto no-sb">
                  {suggestedApps.map((app, idx) => (
                    <button key={app.id} onClick={() => openDetail(app)}
                      className="tap flex-shrink-0 flex flex-col" style={{width:130}}>
                      <div className="w-full rounded-3xl overflow-hidden relative flex items-center justify-center"
                        style={{ height:130, background: heroBgs[idx % heroBgs.length] }}>
                        {app.icon_url ? (
                          <img src={app.icon_url} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md" />
                        ) : (
                          <span style={{ position:'absolute', fontSize:90, opacity:.15, right:-8, bottom:-8, transform:'rotate(-10deg)', lineHeight:1, pointerEvents:'none' }}>{app.emoji}</span>
                        )}
                        <div className="relative z-10 w-14 h-14 rounded-2xl overflow-hidden shadow-lg border border-white/10">
                           <AppIcon app={app} size="md" />
                        </div>
                      </div>
                      <div className="mt-2 px-0.5">
                        <div className="text-white text-xs font-semibold leading-tight text-left line-clamp-2">{app.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-amber-400 text-xs">★</span>
                          <span className="text-gray-400 text-xs">{app.rating}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ══ RECOMMENDED FOR YOU ══ */}
            {recommended.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between px-4 mb-3">
                  <span className="text-white font-extrabold text-lg">Recommended for you</span>
                  <button className="tap w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background:'#1a1a1a', border:'1px solid #2a2a2a' }}>
                    <span className="text-white text-sm">→</span>
                  </button>
                </div>
                <div className="flex gap-3 px-4 overflow-x-auto no-sb">
                  {recommended.map(app => (
                    <button key={app.id} onClick={() => openDetail(app)}
                      className="tap flex-shrink-0 flex flex-col" style={{width:100}}>
                      <div className="w-full rounded-2xl overflow-hidden flex items-center justify-center"
                        style={{ height:100, background:'#1a1a1a', border:'1px solid #252525' }}>
                        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md">
                          <AppIcon app={app} size="md" />
                        </div>
                      </div>
                      <div className="mt-1.5 px-0.5">
                        <div className="text-white text-[11px] font-semibold leading-tight text-left line-clamp-2">{app.name}</div>
                        <div className="text-gray-500 text-[10px] mt-0.5">{app.category}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ══ ALL APPS LIST ══ */}
            <div className="mb-2">
              <div className="px-4 mb-3">
                <span className="text-white font-extrabold text-lg">
                  {activeCat ? `All ${activeCat.label} Apps` : 'All Apps'}
                  <span className="text-gray-600 text-sm font-normal ml-2">({listApps.length})</span>
                </span>
              </div>
              <div className="flex flex-col">
                {listApps.map(app => (
                  <button key={app.id} onClick={() => openDetail(app)}
                    className="tap flex items-center gap-4 px-4 py-3.5 active:bg-white/5 transition-colors">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 bg-[#141414] border border-[#222] overflow-hidden">
                      <AppIcon app={app} size="md" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-white text-sm font-semibold">{app.name}</div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        {(app.tags || []).slice(0,3).map((t,i) => (
                          <span key={t}>{i > 0 && <span className="mx-1">·</span>}<span className="capitalize">{t}</span></span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-amber-400 text-xs">★ {app.rating}</span>
                      </div>
                    </div>
                    <div className="w-10 h-16 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#141414] border border-[#1e1e1e] opacity-40 overflow-hidden">
                      <AppIcon app={listApps[(listApps.indexOf(app)+1)%listApps.length]} size="sm" />
                    </div>
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
