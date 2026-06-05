// ── DEVELOPER GAMES SCREEN ─────────────────────────────────────────────────────
function DeveloperScreen({ developer }) {
  const { goBack, liveGames, launchApp, t } = useApp();

  const developerGames = React.useMemo(() => {
    if (!developer) return [];
    return (liveGames || []).filter(g => {
      const devName = g.developer || g.author || 'ZeroApp Studios';
      return devName.toLowerCase() === developer.toLowerCase();
    });
  }, [developer, liveGames]);

  return (
    <div className="slide-right flex flex-col h-full bg-bg">
      {/* ── Top Bar ── */}
      <div className="pt-safe flex items-center justify-between px-4 pt-3 pb-3 border-b border-border bg-surface flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="tap w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-white text-lg">←</button>
          <div className="text-left">
            <h1 className="text-white font-extrabold text-base tracking-tight truncate max-w-[220px]">{developer}</h1>
            <p className="text-muted text-[10px] font-bold uppercase tracking-wider mt-0.5">{developerGames.length} {t('games') || 'Games'}</p>
          </div>
        </div>
      </div>

      {/* ── Content Grid ── */}
      <div className="flex-1 overflow-y-auto no-sb pb-28 px-5 pt-6 bg-bg">
        {developerGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
            <span className="text-5xl">🎮</span>
            <p className="text-sm">No games found for this developer</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {developerGames.map(game => (
              <button
                key={game.id}
                onClick={() => launchApp(game)}
                className="tap group flex flex-col bg-surface border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/20 hover:-translate-y-0.5"
              >
                {/* Splash Image */}
                <div className="w-full aspect-[16/10] relative bg-black/40 overflow-hidden flex-shrink-0">
                  {game.featured_image ? (
                    <img
                      src={game.featured_image}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a1a3e] to-[#11071f] opacity-40">
                      <span className="text-3xl">{game.emoji || '🎮'}</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                    <span>★</span> {game.rating}
                  </div>
                </div>

                {/* Details */}
                <div className="p-3 w-full flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl overflow-hidden border border-border shadow-md flex-shrink-0 bg-white">
                    <AppIcon app={game} size="xs" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-white text-xs font-bold truncate leading-tight group-hover:text-accent transition-colors">
                      {game.name}
                    </div>
                    <div className="text-muted text-[10px] mt-0.5 uppercase tracking-wider truncate font-medium">
                      {t('cat_' + game.gameCategory) || game.gameCategory}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
window.DeveloperScreen = DeveloperScreen;
