// ── RECENT / HISTORY SCREEN ───────────────────────────────────────────────────
const { useState, useEffect, useMemo, useRef } = React;

function RecentScreen() {
  const { recents, clearRecents, openDetail, goBack } = useApp();

  function groupByDate(list) {
    const groups = { Today: [], Yesterday: [], Earlier: [] };
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yest  = today - 86400000;

    list.forEach(app => {
      const t = app.openedAt || Date.now();
      if (t >= today)     groups.Today.push(app);
      else if (t >= yest) groups.Yesterday.push(app);
      else                groups.Earlier.push(app);
    });
    return groups;
  }

  const groups = groupByDate(recents);

  function fmtTime(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="slide-up flex flex-col h-full">

      {/* ── Header ── */}
      <div className="pt-safe px-5 flex items-center justify-between py-4 border-b border-border bg-surface flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="tap text-white text-xl">←</button>
          <h1 className="text-white font-extrabold text-xl">Recent</h1>
        </div>
        {recents.length > 0 && (
          <button onClick={clearRecents} className="tap text-accent text-sm font-semibold">Clear all</button>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto no-sb pb-28">
        {recents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <span className="text-6xl">🕐</span>
            <p className="text-white font-bold text-lg">No Recent Apps</p>
            <p className="text-muted text-sm">Apps you open will appear here</p>
          </div>
        ) : (
          Object.entries(groups).map(([label, apps]) => apps.length > 0 && (
            <div key={label} className="mt-5">
              <p className="px-5 text-white/40 text-xs font-bold uppercase tracking-widest mb-3">{label}</p>
              <div className="flex flex-col gap-2 px-4">
                {apps.map(app => (
                  <button key={app.id + app.openedAt} onClick={() => openDetail(app)}
                    className="tap flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border hover:border-white/20 transition-colors">
                    <AppIcon app={app} size="sm" />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-white text-sm font-semibold truncate">{app.name}</div>
                      <div className="text-muted text-xs mt-0.5">{app.category}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-muted text-xs">{fmtTime(app.openedAt)}</span>
                      <button onClick={e => { e.stopPropagation(); window.open(app.url, '_blank'); }}
                        className="tap text-muted text-sm">↗</button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav active="home" />
    </div>
  );
}
