// ── APP VIEWER (WebView) ──────────────────────────────────────────────────────
function AppViewerScreen() {
  const { viewerApp: app, goBack } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [ikey, setIkey]       = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    setLoading(true); setError(false);
    timer.current = setTimeout(() => setError(true), 9000);
    return () => clearTimeout(timer.current);
  }, [ikey, app?.id]);

  if (!app) return null;

  const reload  = () => { setIkey(k => k + 1); };
  const openExt = () => window.open(app.url, '_blank');

  return (
    <div className="fade-in flex flex-col h-full bg-black">

      {/* ── Top bar ── */}
      <div className="pt-safe flex items-center gap-2 px-3 py-2 bg-surface border-b border-border flex-shrink-0" style={{zIndex:60}}>
        <button onClick={goBack}
          className="tap w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-white text-lg flex-shrink-0">←</button>

        <div className="flex-1 min-w-0 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 mx-1">
          <span className="text-base flex-shrink-0">{app.emoji}</span>
          <span className="text-white text-sm font-semibold truncate">{app.name}</span>
          <span className="text-muted text-xs flex-shrink-0">3.5 ▾</span>
        </div>

        <button onClick={reload}
          className="tap w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-white text-lg flex-shrink-0">↻</button>
        <button onClick={openExt}
          className="tap w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white text-lg flex-shrink-0">↗</button>
      </div>

      {/* ── Frame ── */}
      <div className="flex-1 relative overflow-hidden">
        {loading && !error && (
          <div className="absolute inset-0 bg-bg flex flex-col items-center justify-center gap-4 z-10">
            <div className="spin" />
            <span className="text-5xl mt-2">{app.emoji}</span>
            <p className="text-white/70 text-sm font-medium">Loading {app.name}...</p>
            <p className="text-muted text-xs">This may take a moment</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 bg-bg flex flex-col items-center justify-center gap-4 z-10 px-8 text-center">
            <span className="text-5xl">⚠️</span>
            <h2 className="text-white font-bold text-lg">Cannot Embed App</h2>
            <p className="text-white/50 text-sm">{app.name} blocks embedding due to security policies.</p>
            <button onClick={openExt} className="tap mt-2 bg-accent text-white font-bold px-8 py-3.5 rounded-2xl text-sm glow-purple">
              Open in Browser ↗
            </button>
            <button onClick={reload} className="tap text-muted text-xs underline">Try Again</button>
          </div>
        )}
        <iframe
          key={ikey}
          src={app.url}
          title={app.name}
          className="w-full h-full border-0"
          style={{ opacity: loading || error ? 0 : 1, transition: 'opacity .4s' }}
          onLoad={() => { clearTimeout(timer.current); setLoading(false); }}
          onError={() => { setError(true); setLoading(false); }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          allow="autoplay; fullscreen"
        />
      </div>

      {/* ── Bottom mini bar ── */}
      {!loading && !error && (
        <div className="pb-safe flex items-center justify-around bg-surface border-t border-border px-6 py-2">
          <button onClick={goBack} className="tap flex flex-col items-center gap-0.5 text-muted">
            <span className="text-lg">←</span>
            <span className="text-[10px] font-semibold">Back</span>
          </button>
          <button onClick={() => navigator.share?.({ url: app.url, title: app.name })} className="tap flex flex-col items-center gap-0.5 text-muted">
            <span className="text-lg">⬆</span>
            <span className="text-[10px] font-semibold">Share</span>
          </button>
        </div>
      )}
    </div>
  );
}
