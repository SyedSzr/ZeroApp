// ── APP DETAIL SCREEN ─────────────────────────────────────────────────────────
function AppDetailScreen({ detailApp: initialApp }) {
  const { liveApps, liveGames, launchApp, toggleSaveApp, isSaved, goBack, t } = useApp();
  
  const app = React.useMemo(() => {
    if (typeof initialApp === 'object' && initialApp !== null) return initialApp;
    const all = [...(liveApps || []), ...(liveGames || [])];
    return all.find(a => String(a.id) === String(initialApp));
  }, [initialApp, liveApps, liveGames]);

  const [activeScreenshot, setActiveScreenshot] = React.useState(null);
  const [showFullDesc, setShowFullDesc] = React.useState(false);
  
  if (!app) return (
    <div className="flex h-full items-center justify-center bg-bg">
      <div className="spin" />
    </div>
  );

  const features = ['Instant Access', 'No Installation', 'Secure & Private', 'Works Everywhere'];

  return (
    <>
      <div className="slide-right flex flex-col h-full bg-bg">

        {/* ── Top Bar ── */}
        <div className="pt-safe flex items-center gap-2 px-4 py-3 border-b border-border bg-surface/80 backdrop-blur-xl flex-shrink-0">
          <button onClick={goBack} className="tap w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-white text-lg">←</button>
          <div className="flex-1" />
          <button className="tap w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-xl">⋮</button>
        </div>

        <div className="flex-1 overflow-y-auto no-sb pb-28">

          {/* ── App Identity ── */}
          <div className="px-5 pt-6 pb-4">
            <div className="flex items-center gap-4 mb-4">
              <AppIcon app={app} size="lg" />
              <div>
                <h1 className="text-white text-2xl font-extrabold leading-tight">{app.name}</h1>
                <p className="text-accent text-sm font-semibold mt-1">{app.category}</p>
              </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="flex items-center gap-6 mb-6 overflow-x-auto no-sb pb-1">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <span className="text-white font-bold">{app.rating}</span>
                  <span className="text-white text-[10px]">★</span>
                </div>
                <span className="text-muted text-[10px]">{app.reviews} {t('reviews')}</span>
              </div>
              <div className="w-px h-6 bg-border"></div>
              <div className="flex flex-col items-center">
                <span className="text-white font-bold">100K+</span>
                <span className="text-muted text-[10px]">{t('downloads')}</span>
              </div>
              <div className="w-px h-6 bg-border"></div>
              <div className="flex flex-col items-center">
                <span className="text-white font-bold text-sm bg-card border border-border px-1.5 rounded-sm">E</span>
                <span className="text-muted text-[10px]">{t('everyone')}</span>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <button onClick={() => launchApp(app)}
              className="tap w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-accent text-white font-bold text-[15px] mb-3">
              <span>{t('launch_app')}</span>
            </button>
            
            <button onClick={() => toggleSaveApp(app)}
              className={`tap w-full py-3.5 rounded-full border text-[15px] font-bold transition-colors ${
                isSaved(app.id) 
                  ? 'bg-transparent border-accent text-accent' 
                  : 'bg-transparent border-border text-accent hover:border-accent'
              }`}>
              {isSaved(app.id) ? t('saved') : t('save_app')}
            </button>
          </div>

          {/* ── Screenshots ── */}
          {app.screenshots && app.screenshots.length > 0 && (
            <div className="mt-2 mb-6">
              <div className="flex gap-3 overflow-x-auto no-sb px-5 pb-2">
                {app.screenshots.map((url, i) => (
                  <button key={i} onClick={() => setActiveScreenshot(i)} className="tap flex-shrink-0 w-[130px] aspect-[9/16] rounded-xl bg-card border border-border overflow-hidden snap-center">
                    <img src={url} alt={`Screenshot ${i+1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── About this app ── */}
          <div className="px-5 mb-6">
            <button onClick={() => setShowFullDesc(true)} className="tap w-full flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-base">{t('about_app')}</h3>
              <span className="text-accent text-xl">→</span>
            </button>
            <p onClick={() => setShowFullDesc(true)} className="tap text-white/70 text-sm leading-relaxed line-clamp-3 text-left">{app.description}</p>
            
            <div className="flex gap-2 mt-4 flex-wrap">
              {(app.tags || []).slice(0, 3).map(t => (
                <span key={t} className="px-3 py-1 rounded-full border border-border text-muted text-xs capitalize">{t}</span>
              ))}
            </div>
          </div>

          {/* ── Feature checklist ── */}
          <div className="px-5 mb-6">
          <h3 className="text-white font-bold text-base mb-3">Features</h3>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            {features.map(f => (
              <div key={f} className="flex items-center gap-3">
                <span className="text-accent text-base">✓</span>
                <span className="text-white/80 text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── App Preview ── */}
        <div className="px-5">
          <h3 className="text-white font-bold text-base mb-3">Preview</h3>
          <div className="rounded-2xl overflow-hidden border border-border bg-card">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <span className="text-white/40 text-xs font-mono truncate">{app.url}</span>
            </div>
            <div className="h-48 flex items-center justify-center bg-bg/50">
              <div className="text-center">
                <div className="mb-3 w-16 h-16 mx-auto rounded-2xl overflow-hidden shadow-lg border border-white/10">
                  <AppIcon app={app} size="lg" />
                </div>
                <p className="text-white/40 text-xs">Tap "Launch App" to open</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    {/* ── Fullscreen Screenshot Viewer ── */}
    {activeScreenshot !== null && (
      <div className="fixed inset-0 z-50 bg-black flex flex-col slide-up">
        <div className="pt-safe flex items-center px-4 py-3 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={() => setActiveScreenshot(null)} className="tap w-10 h-10 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-white text-xl">
            ←
          </button>
        </div>
        <div className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-sb"
             ref={el => {
               if (el && !el.dataset.initialized) {
                 el.scrollLeft = activeScreenshot * window.innerWidth;
                 el.dataset.initialized = "true";
               }
             }}>
          {app.screenshots.map((url, i) => (
            <div key={i} className="w-screen h-full flex-shrink-0 snap-center flex items-center justify-center">
              <img src={url} className="w-full h-full object-contain" />
            </div>
          ))}
        </div>
      </div>
    )}

    {/* ── Full Description Overlay ── */}
    {showFullDesc && (
      <div className="fixed inset-0 z-50 bg-bg flex flex-col slide-up">
        <div className="pt-safe flex items-center px-4 py-3 bg-card border-b border-border flex-shrink-0 shadow-sm">
          <button onClick={() => setShowFullDesc(false)} className="tap w-10 h-10 rounded-full flex items-center justify-center text-white text-xl -ml-2">
            ←
          </button>
          <h2 className="text-white font-bold text-lg ml-2">About this app</h2>
        </div>
        <div className="flex-1 overflow-y-auto no-sb px-5 py-6 bg-surface">
          <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap">{app.description}</p>
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-white font-bold text-sm mb-4">App info</h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <div className="text-white/90 text-sm font-semibold">Version</div>
                <div className="text-muted text-xs mt-0.5">1.0.0</div>
              </div>
              <div>
                <div className="text-white/90 text-sm font-semibold">Updated on</div>
                <div className="text-muted text-xs mt-0.5">May 2026</div>
              </div>
              <div>
                <div className="text-white/90 text-sm font-semibold">Downloads</div>
                <div className="text-muted text-xs mt-0.5">100,000+ downloads</div>
              </div>
              <div>
                <div className="text-white/90 text-sm font-semibold">Offered by</div>
                <div className="text-muted text-xs mt-0.5">ZeroApp Developer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
