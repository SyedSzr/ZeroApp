// ── SEARCH SCREEN ─────────────────────────────────────────────────────────────
function SearchScreen() {
  const { goBack, searchQ, setSearchQ, openDetail } = useApp();
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 150); }, []);

  const q = searchQ.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return [];
    return ALL_APPS.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.tags.some(t => t.includes(q))
    );
  }, [q]);

  const topResults = results.slice(0, 4);
  const moreResults = results.slice(4);

  return (
    <div className="slide-up flex flex-col h-full">

      {/* ── Search Header ── */}
      <div className="pt-safe px-4 py-3 border-b border-border bg-surface flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-2.5">
            <span className="text-muted text-base flex-shrink-0">🔍</span>
            <input
              ref={inputRef}
              type="search"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search anything..."
              autoComplete="off"
              className="flex-1 bg-transparent text-white text-sm placeholder-muted outline-none"
            />
            {searchQ && (
              <button onClick={() => setSearchQ('')} className="tap text-muted text-lg flex-shrink-0">×</button>
            )}
          </div>
          <button onClick={goBack} className="tap text-accent text-sm font-semibold flex-shrink-0">Cancel</button>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="flex-1 overflow-y-auto no-sb pb-28">

        {/* Empty state */}
        {!q && (
          <div className="px-5 pt-6">
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">All Apps ({ALL_APPS.length})</p>
            <div className="flex flex-col gap-2">
              {ALL_APPS.map(app => (
                <ListAppRow key={app.id} app={app} onPress={openDetail} />
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {q && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-5xl">😕</span>
            <p className="text-muted text-sm">No results for "{searchQ}"</p>
          </div>
        )}

        {/* Top Results */}
        {topResults.length > 0 && (
          <div className="px-4 pt-5">
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Top Results</p>
            <div className="flex flex-col gap-2">
              {topResults.map(app => (
                <ListAppRow key={app.id} app={app} onPress={openDetail}
                  rightSlot={<span className="text-muted text-sm">›</span>} />
              ))}
            </div>
          </div>
        )}

        {/* More Apps */}
        {moreResults.length > 0 && (
          <div className="px-4 pt-5">
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">More Apps</p>
            <div className="flex flex-col gap-2">
              {moreResults.map(app => (
                <ListAppRow key={app.id} app={app} onPress={openDetail} />
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav active="explore" />
    </div>
  );
}
