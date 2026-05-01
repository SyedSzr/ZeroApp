// ── HOME SCREEN ───────────────────────────────────────────────────────────────
function HomeScreen() {
  const { greeting, recents, openDetail, go } = useApp();

  const modeKeys = ['study', 'work', 'play'];

  return (
    <div className="slide-up flex flex-col h-full">
      <div className="flex-1 overflow-y-auto no-sb pb-24">

        {/* ── Header ── */}
        <div className="pt-safe px-5 pt-6 pb-2 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">⚡</span>
              <span className="text-white font-black text-xl tracking-tight">ZeroApp</span>
            </div>
            <p className="text-white text-2xl font-bold leading-tight">{greeting}, Ali 👋</p>
            <p className="text-muted text-sm mt-0.5">What would you like to do today?</p>
          </div>
          <button className="tap mt-1 w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
            <span className="text-xl">🔔</span>
          </button>
        </div>

        {/* ── Search Bar ── */}
        <div className="px-5 mt-4 mb-5" onClick={() => go('search')}>
          <div className="flex items-center gap-3 bg-card border border-border rounded-2xl py-3.5 px-4 cursor-pointer">
            <span className="text-muted text-base">🔍</span>
            <span className="text-muted text-sm flex-1">Search anything...</span>
            <span className="text-[10px] text-muted bg-surface border border-border px-1.5 py-0.5 rounded-md">⌘K</span>
          </div>
        </div>

        {/* ── Mode Cards (stacked) ── */}
        <div className="px-5 flex flex-col gap-3 mb-6">
          {modeKeys.map(m => {
            const c = MODE_CFG[m];
            return (
              <button key={m} onClick={() => go('explore', { mode: m })}
                className={`tap relative w-full flex items-center gap-4 p-5 rounded-3xl bg-gradient-to-r ${c.grad} overflow-hidden`}>
                <div className={`w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl flex-shrink-0`}>
                  {c.emoji}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-white font-bold text-base">{c.label}</div>
                  <div className="text-white/60 text-xs mt-0.5 leading-tight">{c.subtitle}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">→</div>
                {/* decorative */}
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/8 pointer-events-none"/>
              </button>
            );
          })}
        </div>

        {/* ── Recently Used ── */}
        {recents.length > 0 && (
          <div className="mb-4">
            <div className="px-5 flex items-center justify-between mb-3">
              <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Recently Used</span>
              <button onClick={() => go('recent')} className="text-accent text-xs font-semibold">View All</button>
            </div>
            <div className="flex gap-3 pl-5 overflow-x-auto no-sb pb-1">
              {recents.slice(0, 6).map(app => (
                <button key={app.id} onClick={() => openDetail(app)}
                  className="tap flex flex-col items-center gap-2 flex-shrink-0">
                  <AppIcon app={app} size="md" />
                  <span className="text-white/70 text-[10px] font-medium text-center max-w-[56px] truncate">{app.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav active="home" />
    </div>
  );
}
