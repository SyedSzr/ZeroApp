// ── WORKSPACE SCREEN (Multi-App Tabs) ─────────────────────────────────────────
function WorkspaceScreen() {
  const { wsApps, wsActive, setWsActive, removeFromWorkspace, go, openDetail } = useApp();
  const [tabLoading, setTabLoading] = useState(false);
  const [tabKey, setTabKey] = useState({});

  const activeApp = wsApps.find(a => a.id === wsActive);

  useEffect(() => {
    if (!wsActive && wsApps.length > 0) setWsActive(wsApps[0].id);
  }, [wsApps]);

  function switchTab(id) {
    setWsActive(id);
    setTabLoading(true);
  }

  return (
    <div className="slide-up flex flex-col h-full">

      {/* ── Header ── */}
      <div className="pt-safe px-5 flex items-center justify-between py-4 border-b border-border bg-surface flex-shrink-0">
        <h1 className="text-white font-extrabold text-xl">My Workspace</h1>
        <button className="tap w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
          <WorkspaceIcon active={false} />
        </button>
      </div>

      {/* ── Tabs row ── */}
      {wsApps.length > 0 && (
        <div className="flex gap-2 px-4 py-2.5 overflow-x-auto no-sb border-b border-border bg-surface/80 flex-shrink-0">
          {wsApps.map(app => (
            <div key={app.id} className="flex items-center flex-shrink-0">
              <button onClick={() => switchTab(app.id)}
                className={`tap flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${wsActive === app.id ? 'bg-accent text-white' : 'bg-card border border-border text-muted'}`}>
                <span>{app.emoji}</span>
                <span className="max-w-[80px] truncate">{app.name}</span>
              </button>
              <button onClick={() => removeFromWorkspace(app.id)}
                className="tap ml-1 text-muted text-xs w-5 h-5 rounded-full hover:text-white transition-colors">×</button>
            </div>
          ))}
          <button onClick={() => go('search')}
            className="tap flex-shrink-0 px-3 py-1.5 rounded-xl bg-card border border-border text-muted text-sm font-semibold">
            + Add
          </button>
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {wsApps.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="text-6xl">📌</span>
            <h2 className="text-white font-bold text-lg">Workspace is Empty</h2>
            <p className="text-muted text-sm">Add apps from their detail page to pin them here for quick access.</p>
            <button onClick={() => go('search')}
              className="tap mt-2 bg-accent text-white font-bold px-7 py-3 rounded-2xl text-sm glow-purple">
              Browse Apps
            </button>
          </div>
        ) : activeApp ? (
          <>
            {tabLoading && (
              <div className="absolute inset-0 bg-bg flex items-center justify-center z-10">
                <div className="spin" />
              </div>
            )}
            <iframe
              key={wsActive}
              src={activeApp.url}
              title={activeApp.name}
              className="w-full h-full border-0"
              onLoad={() => setTabLoading(false)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              allow="autoplay; fullscreen"
            />
          </>
        ) : null}
      </div>

      <BottomNav active="workspace" />
    </div>
  );
}
