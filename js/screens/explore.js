// ── EXPLORE SCREEN (Category) ─────────────────────────────────────────────────
function ExploreScreen() {
  const { mode, openDetail, go } = useApp();
  const [activeFilter, setActiveFilter] = useState('All');

  const cfg = MODE_CFG[mode] || MODE_CFG.study;
  const allApps = APPS.filter(a => a.mode === mode);
  const filters = getModeFilters(mode);

  const filtered = activeFilter === 'All'
    ? allApps
    : allApps.filter(a => a.category.toLowerCase() === activeFilter.toLowerCase() || a.tags.includes(activeFilter.toLowerCase()));

  return (
    <div className="slide-right flex flex-col h-full">

      {/* ── Hero Header ── */}
      <div className={`pt-safe px-5 pb-5 bg-gradient-to-b ${cfg.grad} flex-shrink-0`}>
        <div className="flex items-center justify-between pt-4 mb-5">
          <button onClick={() => go('home')} className="tap text-white/70 text-2xl">←</button>
          <button className="tap text-white/70 text-xl">🔍</button>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-white/15 flex items-center justify-center text-4xl">
            {cfg.emoji}
          </div>
          <div>
            <h1 className="text-white text-2xl font-extrabold">{cfg.label}</h1>
            <p className="text-white/60 text-sm mt-0.5">All the tools you need to learn better</p>
          </div>
        </div>
      </div>

      {/* ── Filter Pills ── */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-sb border-b border-border bg-surface flex-shrink-0">
        {filters.map(f => (
          <FilterPill key={f} label={f} active={activeFilter === f} onPress={setActiveFilter} />
        ))}
      </div>

      {/* ── App Grid (2 columns) ── */}
      <div className="flex-1 overflow-y-auto no-sb px-4 pt-4 pb-28">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted text-sm">No apps in this category</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(app => (
              <AppCard key={app.id} app={app} onPress={openDetail} />
            ))}
          </div>
        )}
      </div>

      <BottomNav active="explore" />
    </div>
  );
}
