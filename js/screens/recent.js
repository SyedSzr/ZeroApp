// ── RECENT / HISTORY SCREEN ───────────────────────────────────────────────────
var { useState, useEffect, useMemo, useRef } = React;

function RecentScreen() {
  const { recents, clearRecents, openDetail, goBack, t, launchApp, liveGames } = useApp();

  const gamesOnlyRecents = useMemo(() => {
    return recents.filter(r => r.gameCategory || (liveGames || []).some(g => String(g.id) === String(r.id)));
  }, [recents, liveGames]);

  function groupByDate(list) {
    const groups = {};
    groups[t('today')] = [];
    groups[t('yesterday')] = [];
    groups[t('earlier')] = [];

    const now   = new Date();
    const todayTs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yestTs  = todayTs - 86400000;

    list.forEach(app => {
      const ts = app.openedAt || Date.now();
      if (ts >= todayTs)     groups[t('today')].push(app);
      else if (ts >= yestTs) groups[t('yesterday')].push(app);
      else                groups[t('earlier')].push(app);
    });
    return groups;
  }

  const groups = groupByDate(gamesOnlyRecents);

  function fmtTime(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="slide-up flex flex-col h-full bg-bg">

      {/* ── Header ── */}
      <div className="pt-safe px-5 flex items-center justify-between py-4 border-b border-border bg-surface flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="tap text-white text-xl">←</button>
          <h1 className="text-white font-extrabold text-xl">{t('recent')}</h1>
        </div>
        {recents.length > 0 && (
          <button onClick={clearRecents} className="tap text-accent text-sm font-semibold">{t('clear_all')}</button>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto no-sb pb-28">
        {recents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <span className="text-6xl">🕐</span>
            <p className="text-white font-bold text-lg">{t('no_recent')}</p>
            <p className="text-muted text-sm">{t('no_recent_sub')}</p>
          </div>
        ) : (
          Object.entries(groups).map(([label, apps]) => apps.length > 0 && (
            <div key={label} className="mt-5">
              <p className="px-5 text-muted text-xs font-bold uppercase tracking-widest mb-3">{label}</p>
              <div className="flex flex-col gap-2 px-4">
                {apps.map(app => (
                  <button key={app.id + app.openedAt} onClick={() => {
                    if (app.gameCategory) {
                      launchApp(app);
                    } else {
                      openDetail(app);
                    }
                  }}
                    className="tap flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border hover:border-white/20 transition-colors">
                    <AppIcon app={app} size="sm" />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-white text-sm font-semibold truncate">{app.name}</div>
                      <div className="text-muted text-xs mt-0.5">{app.category}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-muted text-xs">{fmtTime(app.openedAt)}</span>
                      <button onClick={e => {
                        e.stopPropagation();
                        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|UniWebView/i.test(navigator.userAgent) || window.UniWebView;
                        if (isMobile) {
                          launchApp(app);
                        } else {
                          window.open(app.url, '_blank');
                        }
                      }}
                        className="tap text-muted text-sm">↗</button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
