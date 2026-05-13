// ── APP DETAIL SCREEN ─────────────────────────────────────────────────────────
function AppDetailScreen({ detailApp: initialApp }) {
  const { liveApps, liveGames, launchApp, toggleSaveApp, isSaved, goBack, t, fetchComments, postComment, submitRating, user } = useApp();
  
  const app = React.useMemo(() => {
    if (typeof initialApp === 'object' && initialApp !== null) return initialApp;
    const all = [...(liveApps || []), ...(liveGames || [])];
    return all.find(a => String(a.id) === String(initialApp));
  }, [initialApp, liveApps, liveGames]);

  const [activeScreenshot, setActiveScreenshot] = React.useState(null);
  const [showFullDesc, setShowFullDesc] = React.useState(false);
  const [comments, setComments] = React.useState([]);
  const [scores, setScores] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('reviews'); // 'reviews' or 'leaderboard'
  const [newComment, setNewComment] = React.useState('');
  const [isPosting, setIsPosting] = React.useState(false);
  const [userRating, setUserRating] = React.useState(0);

  const { fetchScores, postScore } = useApp();

  const isGame = React.useMemo(() => {
    return (liveGames || []).some(g => String(g.id) === String(app?.id));
  }, [app, liveGames]);

  React.useEffect(() => {
    if (app?.id) {
      fetchComments(app.id).then(setComments);
      if (isGame) fetchScores(app.id).then(setScores);
    }
  }, [app?.id, fetchComments, fetchScores, isGame]);
  
  if (!app) return (
    <div className="flex h-full items-center justify-center bg-bg">
      <div className="spin" />
    </div>
  );

  const features = ['Instant Access', 'No Installation', 'Secure & Private', 'Works Everywhere'];

  return (
    <>
      <div className="slide-right flex flex-col h-full bg-bg">

        {/* ── Top Bar ── */}
        <div className="pt-safe flex items-center gap-2 px-4 py-3 border-b border-border bg-surface/80 backdrop-blur-xl flex-shrink-0">
          <button onClick={goBack} className="tap w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-white text-lg">←</button>
          <div className="flex-1" />
          <button className="tap w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-xl">⋮</button>
        </div>

        <div className="flex-1 overflow-y-auto no-sb pb-28">

          {/* ── App Identity ── */}
          <div className="px-5 pt-6 pb-4">
            <div className="flex items-center gap-4 mb-4">
              <AppIcon app={app} size="lg" />
              <div>
                <h1 className="text-white text-2xl font-extrabold leading-tight">{app.name}</h1>
                <p className="text-accent text-sm font-semibold mt-1">{app.category}</p>
              </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="flex items-center gap-6 mb-6 overflow-x-auto no-sb pb-1">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <span className="text-white font-bold">{app.rating}</span>
                  <span className="text-white text-[10px]">★</span>
                </div>
                <span className="text-muted text-[10px]">{app.reviews} {t('reviews')}</span>
              </div>
              <div className="w-px h-6 bg-border"></div>
              <div className="flex flex-col items-center">
                <span className="text-white font-bold">100K+</span>
                <span className="text-muted text-[10px]">{t('downloads')}</span>
              </div>
              <div className="w-px h-6 bg-border"></div>
              <div className="flex flex-col items-center">
                <span className="text-white font-bold text-sm bg-card border border-border px-1.5 rounded-sm">E</span>
                <span className="text-muted text-[10px]">{t('everyone')}</span>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <button onClick={() => launchApp(app)}
              className="tap w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-accent text-white font-bold text-[15px] mb-3">
              <span>{t('launch_app')}</span>
            </button>
            
            <button onClick={() => toggleSaveApp(app)}
              className={`tap w-full py-3.5 rounded-full border text-[15px] font-bold transition-colors ${
                isSaved(app.id) 
                  ? 'bg-transparent border-accent text-accent' 
                  : 'bg-transparent border-border text-accent hover:border-accent'
              }`}>
              {isSaved(app.id) ? t('saved') : t('save_app')}
            </button>
          </div>

          {/* ── Screenshots ── */}
          {app.screenshots && app.screenshots.length > 0 && (
            <div className="mt-2 mb-6">
              <div className="flex gap-3 overflow-x-auto no-sb px-5 pb-2">
                {app.screenshots.map((url, i) => (
                  <button key={i} onClick={() => setActiveScreenshot(i)} className="tap flex-shrink-0 w-[130px] aspect-[9/16] rounded-xl bg-card border border-border overflow-hidden snap-center">
                    <img src={url} alt={`Screenshot ${i+1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── About this app ── */}
          <div className="px-5 mb-6">
            <button onClick={() => setShowFullDesc(true)} className="tap w-full flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-base">{t('about_app')}</h3>
              <span className="text-accent text-xl">→</span>
            </button>
            <p onClick={() => setShowFullDesc(true)} className="tap text-white/70 text-sm leading-relaxed line-clamp-3 text-left">{app.description}</p>
            
            <div className="flex gap-2 mt-4 flex-wrap">
              {(app.tags || []).slice(0, 3).map(t => (
                <span key={t} className="px-3 py-1 rounded-full border border-border text-muted text-xs capitalize">{t}</span>
              ))}
            </div>
          </div>

          {/* ── Feature checklist ── */}
          <div className="px-5 mb-6">
          <h3 className="text-white font-bold text-base mb-3">Features</h3>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            {features.map(f => (
              <div key={f} className="flex items-center gap-3">
                <span className="text-accent text-base">✓</span>
                <span className="text-white/80 text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>


        {/* ── Social Hub (Tabs) ── */}
        <div className="px-5 mt-10 pb-20">
          <div className="flex gap-8 border-b border-white/5 mb-8">
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'reviews' ? 'text-white' : 'text-muted'}`}>
              {t('reviews')}
              {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-t-full shadow-[0_-2px_10px_rgba(124,106,247,0.5)]" />}
            </button>
            {isGame && (
              <button 
                onClick={() => setActiveTab('leaderboard')}
                className={`pb-3 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'leaderboard' ? 'text-white' : 'text-muted'}`}>
                {t('leaderboard')}
                {activeTab === 'leaderboard' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-t-full shadow-[0_-2px_10px_rgba(124,106,247,0.5)]" />}
              </button>
            )}
          </div>

          {activeTab === 'reviews' && (
            <div className="slide-left">
              {/* Rating Summary */}
              <div className="flex items-center gap-8 mb-10">
                <div className="text-center">
                  <div className="text-white text-5xl font-black leading-none mb-1">{app.rating}</div>
                  <div className="flex items-center justify-center text-yellow-400 text-sm gap-0.5 mb-1">
                    {[1,2,3,4,5].map(s => <span key={s}>★</span>)}
                  </div>
                  <div className="text-muted text-[10px] font-bold uppercase tracking-tight">{app.reviews} {t('reviews')}</div>
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  {[5, 4, 3, 2, 1].map((stars, idx) => (
                    <div key={stars} className="flex items-center gap-3">
                      <span className="text-muted text-[10px] font-bold w-2">{stars}</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent/60 rounded-full" 
                          style={{ width: `${[85, 12, 2, 1, 0][idx]}%` }} // Mock distribution
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating Action */}
              <div className="bg-card/50 border border-border rounded-[32px] p-6 mb-10 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
                <p className="text-white/90 text-sm font-black mb-4 uppercase tracking-tight">Your Experience</p>
                <div className="flex items-center justify-center gap-3 mb-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      onClick={() => {
                        setUserRating(star);
                        submitRating(app.id, star);
                      }}
                      className={`tap text-3xl transition-all duration-300 transform ${star <= userRating ? 'text-yellow-400 scale-110' : 'text-white/5 hover:text-white/20'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-muted text-[10px] font-bold uppercase tracking-[0.2em]">{userRating > 0 ? 'Thanks for rating!' : 'Tap a star to rate'}</p>
              </div>

              {/* Post Comment Input */}
              {user ? (
                <div className="mb-10">
                  <div className="relative bg-card border border-border rounded-[28px] p-4 focus-within:border-accent/50 transition-colors shadow-inner">
                    <textarea 
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Share your thoughts with the community..."
                      className="w-full bg-transparent text-white text-sm focus:outline-none min-h-[80px] resize-none placeholder:text-muted/60"
                    />
                    <div className="flex justify-end pt-2">
                      <button 
                        onClick={async () => {
                          if (!newComment.trim()) return;
                          setIsPosting(true);
                          const { data, error } = await postComment(app.id, newComment);
                          if (!error) {
                            setComments(prev => [data, ...prev]);
                            setNewComment('');
                          }
                          setIsPosting(false);
                        }}
                        disabled={isPosting || !newComment.trim()}
                        className="bg-accent hover:bg-accent/80 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-accent/20 disabled:opacity-30 transition-all"
                      >
                        {isPosting ? '...' : 'Post Review'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-surface border border-dashed border-border rounded-3xl p-6 mb-10 text-center">
                  <p className="text-accent text-xs font-black uppercase tracking-widest mb-1">{t('sign_in')} to review</p>
                  <p className="text-muted text-[10px]">{t('login_sub')}</p>
                </div>
              )}

              {/* Comment List */}
              <div className="space-y-4">
                {comments.length > 0 ? comments.map(comment => (
                  <div key={comment.id} className="p-5 bg-card/40 border border-white/5 rounded-[28px] group hover:border-accent/20 transition-all">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center text-accent text-sm font-black flex-shrink-0 shadow-lg shadow-accent/5">
                        {comment.profile?.display_name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-white text-xs font-black truncate tracking-tight">{comment.profile?.display_name || 'Anonymous'}</span>
                          <span className="text-muted text-[9px] font-bold uppercase">{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex text-[8px] text-yellow-500/60 mb-2">★★★★★</div>
                        <p className="text-white/70 text-xs leading-relaxed font-medium">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-12 text-center opacity-40">
                    <div className="text-5xl mb-4">✨</div>
                    <p className="text-muted text-sm italic font-medium">Be the first to share your experience!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="slide-right">
              <div className="bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 rounded-[32px] p-6 mb-8 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-black text-sm uppercase tracking-widest mb-1">Top Legends</h4>
                  <p className="text-accent text-[10px] font-bold">Updated in real-time</p>
                </div>
                <div className="text-3xl">🏆</div>
              </div>

              <div className="space-y-2">
                {scores.length > 0 ? scores.map((score, idx) => (
                  <div key={score.id} className="flex items-center gap-4 p-4 bg-card/60 border border-white/5 rounded-2xl hover:bg-card transition-all">
                    <span className={`w-6 text-center font-black italic text-sm ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-white/20'}`}>
                      {idx + 1}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                      {score.profile?.avatar_url ? <img src={score.profile.avatar_url} /> : (score.profile?.display_name?.charAt(0) || 'U')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-black truncate">{score.profile?.display_name || 'Player'}</div>
                      <div className="text-muted text-[9px] font-bold uppercase">{new Date(score.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-accent font-black text-sm tabular-nums">
                      {parseInt(score.score).toLocaleString()}
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center opacity-20 flex flex-col items-center">
                    <div className="text-5xl mb-4">🎮</div>
                    <p className="text-white font-black text-sm uppercase tracking-widest">No Legends Yet</p>
                    <p className="text-white text-[10px] mt-2">Will you be the first on the board?</p>
                  </div>
                )}
              </div>
              
              {/* Submission for Testing */}
              {user && (
                <button 
                  onClick={() => {
                    const s = Math.floor(Math.random() * 50000) + 1000;
                    postScore(app.id, s).then(() => fetchScores(app.id).then(setScores));
                  }}
                  className="w-full mt-10 py-4 rounded-2xl border border-dashed border-accent/40 text-accent text-[10px] font-black uppercase tracking-[0.2em] hover:bg-accent/5 transition-all">
                  + Submit Mock Score for Testing
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>

    {/* ── Fullscreen Screenshot Viewer ── */}
    {activeScreenshot !== null && (
      <div className="fixed inset-0 z-50 bg-black flex flex-col slide-up">
        <div className="pt-safe flex items-center px-4 py-3 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={() => setActiveScreenshot(null)} className="tap w-10 h-10 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-white text-xl">
            ←
          </button>
        </div>
        <div className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-sb"
             ref={el => {
               if (el && !el.dataset.initialized) {
                 el.scrollLeft = activeScreenshot * window.innerWidth;
                 el.dataset.initialized = "true";
               }
             }}>
          {app.screenshots.map((url, i) => (
            <div key={i} className="w-screen h-full flex-shrink-0 snap-center flex items-center justify-center">
              <img src={url} className="w-full h-full object-contain" />
            </div>
          ))}
        </div>
      </div>
    )}

    {/* ── Full Description Overlay ── */}
    {showFullDesc && (
      <div className="fixed inset-0 z-50 bg-bg flex flex-col slide-up">
        <div className="pt-safe flex items-center px-4 py-3 bg-card border-b border-border flex-shrink-0 shadow-sm">
          <button onClick={() => setShowFullDesc(false)} className="tap w-10 h-10 rounded-full flex items-center justify-center text-white text-xl -ml-2">
            ←
          </button>
          <h2 className="text-white font-bold text-lg ml-2">About this app</h2>
        </div>
        <div className="flex-1 overflow-y-auto no-sb px-5 py-6 bg-surface">
          <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap">{app.description}</p>
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-white font-bold text-sm mb-4">App info</h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <div className="text-white/90 text-sm font-semibold">Version</div>
                <div className="text-muted text-xs mt-0.5">1.0.0</div>
              </div>
              <div>
                <div className="text-white/90 text-sm font-semibold">Updated on</div>
                <div className="text-muted text-xs mt-0.5">May 2026</div>
              </div>
              <div>
                <div className="text-white/90 text-sm font-semibold">Downloads</div>
                <div className="text-muted text-xs mt-0.5">100,000+ downloads</div>
              </div>
              <div>
                <div className="text-white/90 text-sm font-semibold">Offered by</div>
                <div className="text-muted text-xs mt-0.5">ZeroApp Developer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
