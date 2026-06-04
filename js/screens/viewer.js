// ── APP VIEWER (Opens in new browser tab) ────────────────────────────────────
function AppViewerScreen({ viewerApp: initialApp }) {
  const { liveApps, liveGames, goBack } = useApp();

  const app = React.useMemo(() => {
    if (typeof initialApp === 'object' && initialApp !== null) return initialApp;
    const all = [...(liveApps || []), ...(liveGames || [])];
    return all.find(a => String(a.id) === String(initialApp));
  }, [initialApp, liveApps, liveGames]);

  const tabRef = React.useRef(null);
  const [tabClosed, setTabClosed] = React.useState(false);
  const [opened, setOpened] = React.useState(false);

  // Open the app in a new tab as soon as we land here
  React.useEffect(() => {
    if (!app?.url) return;

    // Small delay so the screen renders first (feels intentional, not glitchy)
    const t = setTimeout(() => {
      tabRef.current = window.open(app.url, '_blank');
      setOpened(true);

      // Poll to detect if the user closed the external tab
      const poll = setInterval(() => {
        if (tabRef.current && tabRef.current.closed) {
          setTabClosed(true);
          clearInterval(poll);
        }
      }, 800);

      return () => clearInterval(poll);
    }, 300);

    return () => clearTimeout(t);
  }, [app?.url]);

  // Focus the external tab when user taps "Switch to App"
  const focusTab = () => {
    if (tabRef.current && !tabRef.current.closed) {
      tabRef.current.focus();
    } else {
      // Re-open if they closed it
      tabRef.current = window.open(app.url, '_blank');
      setTabClosed(false);
    }
  };

  if (!app) return (
    <div className="flex h-full items-center justify-center bg-bg">
      <div className="spin" />
    </div>
  );

  return (
    <div className="fade-in flex flex-col h-full bg-bg">

      {/* ── Top bar ── */}
      <div className="pt-safe flex items-center gap-2 px-3 py-2 bg-surface border-b border-border flex-shrink-0" style={{zIndex:60}}>
        <button onClick={goBack}
          className="tap w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-white text-lg flex-shrink-0">←</button>

        <div className="flex-1 min-w-0 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 mx-1">
          <span className="text-base flex-shrink-0">{app.emoji}</span>
          <span className="text-white text-sm font-semibold truncate">{app.name}</span>
          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 flex-shrink-0">LIVE</span>
        </div>

        <button onClick={() => window.open(app.url, '_blank')}
          className="tap w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white text-lg flex-shrink-0">↗</button>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">

        {/* App icon pulsing */}
        <div className="relative">
          <div className="absolute inset-0 rounded-[32px] bg-accent/20 animate-ping" style={{animationDuration:'2s'}} />
          <div className="relative w-28 h-28 rounded-[32px] bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/30 flex items-center justify-center text-6xl shadow-2xl shadow-accent/20">
            {app.emoji || '🌐'}
          </div>
        </div>

        {/* Status text */}
        {!opened ? (
          <>
            <div className="spin" />
            <p className="text-white/60 text-sm">Opening {app.name}...</p>
          </>
        ) : tabClosed ? (
          <>
            <h2 className="text-white font-bold text-xl">{app.name}</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              The app tab was closed.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-white font-bold text-xl">{app.name}</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              {app.name} is running in another browser tab.{'\n'}Switch to it or come back here anytime.
            </p>
          </>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
          <button
            onClick={focusTab}
            className="tap w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-accent text-white font-bold text-[15px] shadow-lg shadow-accent/30"
          >
            <span>↗</span>
            <span>{tabClosed ? 'Reopen App' : 'Switch to App'}</span>
          </button>

          <button
            onClick={goBack}
            className="tap w-full py-4 rounded-2xl border border-border text-white/70 font-semibold text-[15px]"
          >
            ← Back to ZeroApp
          </button>
        </div>

        {/* Tip */}
        <p className="text-muted text-xs mt-4 px-4">
          Tip: Close the app tab and tap "← Back" to return to browsing.
        </p>
      </div>
    </div>
  );
}
