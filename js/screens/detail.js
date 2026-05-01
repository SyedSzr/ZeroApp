// ── APP DETAIL SCREEN ─────────────────────────────────────────────────────────
function AppDetailScreen() {
  const { detailApp: app, launchApp, toggleFav, isFav, addToWorkspace, goBack } = useApp();
  if (!app) return null;
  const fav = isFav(app.id);

  const features = ['Instant Access', 'No Installation', 'Secure & Private', 'Works Everywhere'];

  return (
    <div className="slide-right flex flex-col h-full">

      {/* ── Top Bar ── */}
      <div className="pt-safe flex items-center gap-2 px-4 py-3 border-b border-border bg-surface/80 backdrop-blur-xl flex-shrink-0">
        <button onClick={goBack} className="tap w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-white text-lg">←</button>
        <div className="flex-1" />
        <button onClick={() => toggleFav(app)} className="tap w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-xl">
          {fav ? '❤️' : '🤍'}
        </button>
        <button className="tap w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-xl">⋮</button>
      </div>

      <div className="flex-1 overflow-y-auto no-sb px-5 pb-28">

        {/* ── App Identity ── */}
        <div className="flex items-center gap-4 py-6">
          <AppIcon app={app} size="lg" />
          <div>
            <h1 className="text-white text-2xl font-extrabold">{app.name}</h1>
            <p className="text-muted text-sm mt-0.5">{app.category}</p>
          </div>
        </div>

        {/* ── Rating + Tags ── */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <StarRating rating={app.rating} />
          <span className="text-muted text-xs">({app.reviews})</span>
          {app.tags.slice(0, 2).map(t => (
            <span key={t} className="pill bg-card border border-border text-muted capitalize">{t}</span>
          ))}
        </div>

        {/* ── Description ── */}
        <p className="text-white/70 text-sm leading-relaxed mb-6">{app.desc}</p>

        {/* ── Launch Button ── */}
        <button onClick={() => launchApp(app)}
          className="tap w-full flex items-center justify-center gap-3 py-4 rounded-3xl bg-gradient-to-r from-accent to-violet-500 glow-purple mb-6">
          <span className="text-white font-bold text-base">Launch App</span>
          <span className="text-white text-lg">↗</span>
        </button>

        {/* ── Feature checklist ── */}
        <div className="bg-card border border-border rounded-3xl p-5 mb-5 flex flex-col gap-3">
          {features.map(f => (
            <div key={f} className="flex items-center gap-3">
              <span className="text-accent text-base">✓</span>
              <span className="text-white/80 text-sm font-medium">{f}</span>
            </div>
          ))}
        </div>

        {/* ── Add to Workspace ── */}
        <button onClick={() => addToWorkspace(app)}
          className="tap w-full py-3.5 rounded-2xl bg-card border border-border text-white/70 text-sm font-semibold hover:border-accent transition-colors mb-2">
          📌 Add to Workspace
        </button>

        {/* ── App Preview ── */}
        <div className="mt-5 rounded-3xl overflow-hidden border border-border bg-card">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <span className="text-white/40 text-xs font-mono truncate">{app.url}</span>
          </div>
          <div className="h-48 flex items-center justify-center bg-bg/50">
            <div className="text-center">
              <div className="text-5xl mb-3">{app.emoji}</div>
              <p className="text-white/40 text-xs">Tap "Launch App" to open</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
