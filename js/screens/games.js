// ── GAMES SCREEN — PlayScroll Immersive Feed ─────────────────────────────────
var { useState, useRef, useEffect, useCallback } = React;

const getCleanImage = (url) => {
  if (!url) return '';
  if (url.includes('bing.net')) {
    return url.replace(/&w=\d+/g, '').replace(/&h=\d+/g, '').replace(/&c=\d+/g, '');
  }
  return url;
};

// ── Per-Game Card (owns love/comment state) ───────────────────────────────────
function GameCard({ game, onCommentOpen }) {
  const { user, go, toggleSaveApp, isSaved, launchApp, fetchLoves, toggleLove, fetchComments, t } = useApp();

  const [loveCount, setLoveCount] = useState(0);
  const [loved, setLoved] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [lovePending, setLovePending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchLoves(game.id).then(({ count, loved: isLoved }) => {
      if (!cancelled) { setLoveCount(count); setLoved(isLoved); }
    });
    fetchComments(game.id).then(arr => {
      if (!cancelled) setCommentCount(arr.length);
    });

    const handleCommentPosted = (e) => {
      if (e.detail && e.detail.itemId === game.id) {
        setCommentCount(c => c + 1);
      }
    };
    window.addEventListener('comment-posted', handleCommentPosted);

    return () => {
      cancelled = true;
      window.removeEventListener('comment-posted', handleCommentPosted);
    };
  }, [game.id, user]);

  const handleLove = async () => {
    if (!user) { go('auth'); return; }
    if (lovePending) return;
    setLovePending(true);
    // Optimistic
    const wasLoved = loved;
    setLoved(!wasLoved);
    setLoveCount(c => wasLoved ? Math.max(0, c - 1) : c + 1);
    const result = await toggleLove(game.id);
    if (result.error) { setLoved(wasLoved); setLoveCount(c => wasLoved ? c + 1 : Math.max(0, c - 1)); }
    setLovePending(false);
  };

  const handleShare = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const longUrl = `${baseUrl}?shared=1#detail?id=${game.id}`;
    window.location.href = `uniwebview://share?title=${encodeURIComponent(game.name)}&url=${encodeURIComponent(longUrl)}`;
  };

  const tags = game.tags ? (Array.isArray(game.tags) ? game.tags : game.tags.split(',').map(t => t.trim())) : [];
  const developerName = game.developer || game.author || 'ZeroApp Studios';

  const cardImg = getCleanImage(game.featured_image || game.icon_url || game.icon || game.image);

  return (
    <article style={{
      position: 'relative',
      margin: '0 20px 12px',
      height: '246px',
      overflow: 'hidden',
      borderRadius: '18px',
      border: '1px solid #27334a',
      backgroundImage: cardImg ? 'url(' + cardImg + ')' : 'linear-gradient(135deg, #2b1f60, #172044, #09111f)',
      backgroundColor: '#10182b',
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
      boxShadow: '0 12px 24px rgba(0,0,0,0.38)'
    }}>
      {/* Dark overlay for text readability */}
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:1, background:'linear-gradient(to top, rgba(4,8,21,0.92) 0%, rgba(4,8,21,0.35) 45%, rgba(4,8,21,0.05) 100%)' }} />

      {/* Right Action Stack */}
      <div className="absolute right-2.5 bottom-4 flex w-10 flex-col items-center gap-3 z-20 pointer-events-auto">
        {/* Avatar */}
        <div className="absolute right-0 top-[-207px] rounded-full bg-[#07101f]/75 px-2 py-1 text-[10px] font-extrabold text-white shadow-lg backdrop-blur-md"><span className="text-[#ffbf2f]">★</span> {game.rating || '4.8'}</div>

        {/* Love */}
        <div className="flex flex-col items-center gap-1" onClick={handleLove} style={{ cursor: 'pointer' }}>
          <svg width="25" height="25" viewBox="0 0 24 24"
            fill={loved ? '#FF2D55' : 'none'}
            stroke="#FF2D55"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`drop-shadow-md transition-transform ${lovePending ? 'scale-90' : 'hover:scale-110'}`}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className="text-[#fff] text-[10px] font-bold drop-shadow-md">{loveCount > 0 ? loveCount : ''}</span>
        </div>

        {/* Comments */}
        <div className="flex flex-col items-center gap-1" onClick={() => onCommentOpen(game)} style={{ cursor: 'pointer' }}>
          <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md hover:scale-110 transition-transform">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-[#fff] text-[10px] font-bold drop-shadow-md">{commentCount}</span>
        </div>

        {/* Save */}
        <div className="flex flex-col items-center gap-1 mt-1" onClick={() => toggleSaveApp(game)} style={{ cursor: 'pointer' }}>
          <svg width="25" height="25" viewBox="0 0 24 24" fill={isSaved(game.id) ? '#FFD43B' : 'none'} stroke="#FFD43B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md hover:scale-110 transition-transform">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </div>

      </div>

      {/* Bottom Info */}
      <div className="relative z-10 flex min-h-[246px] items-end px-4 pb-4 pt-14 pointer-events-none">
        <div className="w-[calc(100%-42px)] pointer-events-auto">
          <div className="flex items-center gap-1.5 mb-1 cursor-pointer tap" onClick={() => go('developer', { developer: developerName })}>
            <span className="text-[#fff]/90 font-bold text-[11px] drop-shadow-md hover:underline uppercase tracking-wider">{developerName}</span>
          </div>
          <h2 className="text-[#fff] text-[24px] font-black tracking-[-0.05em] leading-[0.96] mb-1.5 drop-shadow-lg">{game.name}</h2>
          <p className="text-[#f4f5fa] text-[12px] font-semibold leading-[1.2] mb-2 line-clamp-2 drop-shadow-md">
            {game.desc || ''}
          </p>
          {tags.length > 0 && (
            <div className="flex gap-2 mb-2.5 flex-wrap">
              {tags.slice(0, 1).map(tag => (
                <span key={tag} className="bg-[#060c1d]/65 border border-[#36415b] backdrop-blur-sm px-2 py-1 rounded-lg text-[#a88aff] text-[10px] font-bold">
                  {tag.startsWith('#') ? tag : '#' + tag}
                </span>
              ))}
            </div>
          )}
          <button onClick={() => launchApp(game)}
            className="min-w-[106px] px-3 py-2.5 rounded-lg bg-gradient-to-r from-[#703cff] to-[#a04cff] text-[#fff] font-extrabold text-[14px] tracking-[-0.02em] flex items-center justify-center gap-1.5 shadow-[0_8px_22px_rgba(107,61,255,0.42)] border border-white/10 active:scale-[0.97] transition-transform">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            {t('play_now')}
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Comments Overlay (real DB) ────────────────────────────────────────────────
function CommentsOverlay({ game, onClose }) {
  const { user, go, fetchComments, postComment, t } = useApp();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchComments(game.id).then(data => {
      if (!cancelled) { setComments(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [game.id]);

  const handlePost = async () => {
    if (!user) { go('auth'); return; }
    if (!text.trim() || posting) return;
    setPosting(true);
    const { data, error } = await postComment(game.id, text.trim());
    if (error) {
      console.error('Error posting comment:', error);
    } else if (data) {
      setComments(prev => [data, ...prev]);
      setText('');
    }
    setPosting(false);
  };

  const getUserName = (c) => {
    if (c.profile?.display_name) return c.profile.display_name;
    if (c.profile?.email) return c.profile.email.split('@')[0];
    return 'Anonymous';
  };

  const initials = (c) => {
    const name = getUserName(c);
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const timeAgo = (ts) => {
    const diff = (Date.now() - new Date(ts)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-auto">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-[#111] w-full h-[65%] rounded-t-3xl relative flex flex-col slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="w-12 h-1 bg-[#fff]/20 rounded-full mx-auto mt-3 mb-2" />
        <h3 className="text-[#fff] font-bold text-center py-2 border-b border-[#fff]/10">
          {comments.length > 0 ? `${comments.length} ${t('comments_count')}` : t('comments_count')}
        </h3>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {loading && <div className="text-[#fff]/40 text-sm text-center py-8">Loading...</div>}
          {!loading && comments.length === 0 && (
            <div className="text-[#fff]/40 text-sm text-center py-8">No comments yet. Be the first!</div>
          )}
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6b4eff] to-[#ff2d55] flex items-center justify-center text-xs text-[#fff] font-bold flex-shrink-0">
                {c.profile?.avatar_url
                  ? <img src={c.profile.avatar_url} className="w-full h-full rounded-full object-cover" />
                  : initials(c)}
              </div>
              <div className="flex-1">
                <div className="text-[#fff]/60 text-xs font-semibold">{getUserName(c)}</div>
                <div className="text-[#fff] text-sm mt-0.5">{c.content}</div>
                <div className="text-[#fff]/40 text-[10px] mt-1">{timeAgo(c.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 pb-20 border-t border-[#fff]/10 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePost()}
            placeholder={t('add_comment')}
            className="flex-1 bg-[#fff]/10 border-none rounded-full px-4 py-2 text-sm text-[#fff] focus:outline-none"
          />
          <button
            onClick={handlePost}
            disabled={posting || !text.trim()}
            className="bg-[#6b4eff] text-[#fff] p-2 rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-40">
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

function GamesScreen() {
  const { greeting, openDetail, go, liveGames, launchApp, user, t, userProfile, settings, theme } = useApp();
  const [viewMode, setViewMode] = useState('feed');
  const [commentGame, setCommentGame] = useState(null); // game whose comments overlay is open
  const isDark = theme !== 'light';

  const visibleGames = useMemo(() => {
    if (settings && settings.play_scroll_games) {
      try {
        const selectedIds = JSON.parse(settings.play_scroll_games);
        if (Array.isArray(selectedIds) && selectedIds.length > 0) {
          const list = selectedIds.map(id => liveGames.find(g => String(g.id) === String(id))).filter(Boolean);
          if (list.length > 0) return list;
        }
      } catch (e) {}
    }
    return [...liveGames].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [settings, liveGames]);

  if (viewMode === 'discover') {
    return <GamesDiscoveryView onBack={() => setViewMode('feed')} />;
  }

  return (
    <div className={`flex h-full w-full flex-col overflow-hidden font-sans ${isDark ? 'bg-[#050b19]' : 'bg-bg'}`}>
      <header className={`flex-none px-5 pt-safe pt-4 pb-4 ${
        isDark 
          ? 'bg-[radial-gradient(circle_at_88%_0%,rgba(104,66,255,0.18),transparent_40%),linear-gradient(180deg,#050817_0%,#071024_100%)]' 
          : 'bg-bg border-b border-border'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="Logo/Logo%20Icon.png" alt="Icon" className="w-12 h-12 object-contain" />
            <img src="Logo/header.png" alt="ZeroApp" className="h-9 object-contain" />
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <button onClick={() => setViewMode('discover')} aria-label={t('discover')}
              className={`tap w-10 h-10 rounded-xl backdrop-blur-md border flex items-center justify-center text-base shadow-lg active:scale-95 ${
                isDark ? 'bg-[#171c2d] border-[#2a3043] text-white' : 'bg-surface border-border text-gray-900'
              }`}>
              🔔
            </button>
            {!user && (
              <button onClick={() => go('auth')} className="tap bg-gradient-to-r from-[#703cff] to-[#a04cff] text-[#fff] text-[14px] font-bold px-3 py-2.5 rounded-xl shadow-[0_8px_22px_rgba(107,61,255,0.42)] whitespace-nowrap">
                ♙&nbsp; {t('sign_in')}
              </button>
            )}
          </div>
        </div>
        <h1 className={`mt-5 text-[28px] font-black tracking-[-0.055em] leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{greeting} <span className="not-italic">👋</span></h1>
        <p className={`mt-2.5 text-[14px] font-medium leading-none ${isDark ? 'text-[#b8bdd0]' : 'text-gray-600'}`}>{t('games_header')}</p>
      </header>

      {/* Feed */}
      <div className="flex-1 w-full overflow-y-auto no-sb overscroll-contain pt-2 pb-28">
        {visibleGames.map((game) => (
          <GameCard key={game.id} game={game} onCommentOpen={(g) => setCommentGame(g)} />
        ))}
      </div>

      {/* Comments Overlay */}
      {commentGame && (
        <CommentsOverlay game={commentGame} onClose={() => setCommentGame(null)} />
      )}
    </div>
  );
}


// ── DISCOVERY VIEW (The previous grid layout) ──────────────────────────────────
function GamesDiscoveryView({ onBack }) {
  const { openDetail, go, liveGames, liveCats, t, getPromoItems, launchApp, greeting, user, userProfile, theme } = useApp();
  const isDark = theme !== 'light';
  const gameCategories = liveCats.filter(c => c.type === 'game');

  const [activeCategory, setActiveCategory] = useState('all');
  const [visibleCount, setVisibleCount] = useState(24);

  const filteredGames = activeCategory === 'all'
    ? liveGames
    : liveGames.filter(g => g.gameCategory === activeCategory);

  // Spotlighted items come FIRST; remaining slots filled with fallback pool (up to 20)
  const featuredGame  = getPromoItems('featured_game',               'game', liveGames.filter(g => g.is_featured))?.[0] || liveGames[0];
  const recommended   = getPromoItems('recommended_games',           'game', liveGames.slice(0, 20));
  const trending      = getPromoItems('trending_games',              'game', [...liveGames].sort((a,b) => (b.rating||0)-(a.rating||0)));
  const featuredGames = getPromoItems('featured_games',              'game', liveGames.filter(g => g.is_featured).length >= 8 ? liveGames.filter(g => g.is_featured) : liveGames);
  const hotRightNow   = getPromoItems('hot_right_now',               'game', liveGames.slice(3, 23));
  const topPicks      = getPromoItems('top_pick_for_you',            'game', liveGames.slice(12, 32));
  const editorsPicks  = getPromoItems('editors_picks',               'game', liveGames.slice(1, 21));
  const popular       = getPromoItems('popular_games',               'game', [...liveGames].sort((a,b) => parseInt(b.reviews||0)-parseInt(a.reviews||0)));
  const newExp        = getPromoItems('new_experience',              'game', liveGames.slice(15, 35));
  const superGames    = getPromoItems('super_games',                 'game', liveGames.slice(0, 20));
  const mightLike     = getPromoItems('games_might_like',            'game', liveGames.slice(10, 30));
  const personalized  = getPromoItems('personalize_recommendations', 'game', liveGames.slice(5, 25));
  const crowdFavs     = getPromoItems('crowd_favorites',             'game', liveGames.slice(2, 22));
  const monthBest     = getPromoItems('this_month_best',             'game', liveGames.slice(4, 24));

  const heroBgs = [
    'linear-gradient(135deg,#1a1a3e 0%,#2d1b69 40%,#11071f 100%)',
    'linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)',
    'linear-gradient(135deg,#1f4037 0%,#244c3c 50%,#0f2027 100%)',
    'linear-gradient(135deg,#3a1c71 0%,#d76d77 50%,#ffaf7b 100%)',
    'linear-gradient(135deg,#141e30 0%,#243b55 100%)',
  ];

  const SectionHeader = ({ title, onSeeAll }) => (
    <div className="px-5 flex items-center justify-between mb-4 mt-8">
      <span className="text-white font-black text-xl tracking-tight">{t(title)}</span>
      {onSeeAll && (
        <button onClick={onSeeAll} className="tap text-accent text-xs font-bold uppercase tracking-widest">
          {t('see_all')} →
        </button>
      )}
    </div>
  );

  const HorizontalScroll = ({ apps, size = 'md' }) => (
    <div className="flex gap-5 px-5 overflow-x-auto no-sb pb-2">
      {apps.map(app => (
        <div key={app.id} onClick={() => launchApp(app)}
          className="tap flex-shrink-0 flex flex-col items-center cursor-pointer" style={{ width: size === 'lg' ? 115 : size === 'md' ? 86 : 64 }}>
          <div className="w-full aspect-square relative flex items-center justify-center transition-transform active:scale-95 duration-200">
            <AppIcon app={app} size={size} />
          </div>
          <div className="mt-2 w-full text-center px-0.5">
            <div className="text-white text-[11px] font-bold leading-tight truncate">{app.name}</div>
            <div className="text-muted text-[9px] mt-0.5 uppercase tracking-widest truncate">{t('cat_' + app.gameCategory)}</div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`slide-up flex flex-col h-full ${isDark ? 'bg-[#050b19]' : 'bg-bg'}`}>
      
      {/* ── Fixed Header ── */}
      <header className={`pt-safe px-5 pt-5 pb-3 flex items-start justify-between flex-shrink-0 border-b border-border z-20 ${
        isDark 
          ? 'bg-[radial-gradient(circle_at_88%_0%,rgba(104,66,255,0.18),transparent_40%),linear-gradient(180deg,#050817_0%,#071024_100%)]' 
          : 'bg-bg'
      }`}>
        <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              {onBack && (
                <button onClick={onBack} className={`tap w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-lg mr-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>⬅️</button>
              )}
              <img src="Logo/Logo%20Icon.png" alt="Icon" className="w-10 h-10 object-contain" />
              <img src="Logo/header.png" alt="ZeroApp" className="h-7 object-contain" />
            </div>
          <p className={`text-2xl font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{greeting} 👋</p>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-muted' : 'text-gray-600'}`}>{t('games_header')}</p>
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-shrink-0 pointer-events-auto">
          <button onClick={() => go('search', { searchMode: 'games' })} className={`tap w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <span className="text-xl">🔍</span>
          </button>
          {!user && (
            <button onClick={() => go('auth')} className="tap bg-[#6b4eff] text-[#fff] text-[13px] font-bold px-3.5 py-1.5 rounded-full shadow-[0_0_20px_rgba(107,78,255,0.4)] whitespace-nowrap">
              {t('sign_in')}
            </button>
          )}
        </div>
      </header>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto no-sb pb-32">

        {/* ── 1. Featured Game (Large Image) ── */}
        {featuredGame && (
          <div className="mt-6 px-5">
            <div className="flex items-center justify-between mb-4">
               <span className="text-white font-black text-xl tracking-tight">{t('featured_game')}</span>
            </div>
            <div onClick={() => launchApp(featuredGame)}
              className="tap w-full group relative flex flex-col cursor-pointer">
              <div className="w-full aspect-[16/9] rounded-3xl overflow-hidden relative border border-border bg-surface">
                <button 
                  onClick={(e) => { e.stopPropagation(); openDetail(featuredGame); }}
                  className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-black/60 border border-white/20 flex items-center justify-center text-white text-lg font-bold hover:bg-black transition-all tap z-10"
                  title="View Details"
                >
                  ›
                </button>
                {(featuredGame.featured_image || featuredGame.icon_url || featuredGame.icon || featuredGame.image) ? (
                  <img src={getCleanImage(featuredGame.featured_image || featuredGame.icon_url || featuredGame.icon || featuredGame.image)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-30" style={{ background: heroBgs[0] }}>
                     <span className="text-6xl">{featuredGame.emoji}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                   <AppIcon app={featuredGame} size="sm" />
                   <div className="flex-1 text-left">
                      <div className="font-bold text-lg leading-tight" style={{color:'#fff'}}>{featuredGame.name}</div>
                      <div className="text-xs" style={{color:'rgba(255,255,255,0.7)'}}>{t('cat_' + featuredGame.gameCategory)} · ★ {featuredGame.rating}</div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. Recommended Games ── */}
        <SectionHeader title="recommended_games" />
        <HorizontalScroll apps={recommended} size="lg" />

        {/* ── 3. Trending Games ── */}
        <SectionHeader title="trending_games" />
        <HorizontalScroll apps={trending} size="md" />

        {/* ── 4. Featured Games ── */}
        <SectionHeader title="featured_games" />
        <HorizontalScroll apps={featuredGames} size="md" />

        {/* ── 5. Hot Right Now ── */}
        <SectionHeader title="hot_right_now" />
        <HorizontalScroll apps={hotRightNow} size="md" />

        {/* ── 6. Top Pick For You ── */}
        <SectionHeader title="top_pick_for_you" />
        <HorizontalScroll apps={topPicks} size="md" />

        {/* ── 7. Editors Picks ── */}
        <SectionHeader title="editors_picks" />
        <div className="px-5 grid grid-cols-2 gap-4">
          {editorsPicks.slice(0, 4).map(game => (
            <div key={game.id} onClick={() => launchApp(game)}
              className="tap flex items-center gap-3 p-2 bg-surface rounded-2xl border border-border cursor-pointer relative">
              <AppIcon app={game} size="xs" />
              <div className="flex-1 min-w-0 text-left">
                <div className="text-white text-xs font-bold truncate">{game.name}</div>
                <div className="text-muted text-[9px] truncate uppercase">{t('cat_' + game.gameCategory)}</div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); openDetail(game); }}
                className="w-7 h-7 rounded-xl bg-card border border-border flex items-center justify-center text-muted hover:text-white transition-all tap flex-shrink-0"
              >
                ›
              </button>
            </div>
          ))}
        </div>

        {/* ── 8. Popular Games ── */}
        <SectionHeader title="popular_games" />
        <HorizontalScroll apps={popular} size="md" />

        {/* ── 9. New Experience ── */}
        <SectionHeader title="new_experience" />
        <HorizontalScroll apps={newExp} size="md" />

        {/* ── 10. Super Games ── */}
        <SectionHeader title="super_games" />
        <div className="px-5 flex flex-col gap-3">
          {superGames.map(game => (
            <div key={game.id} onClick={() => launchApp(game)}
              className="tap flex items-center gap-4 p-3 bg-surface rounded-2xl border border-border cursor-pointer">
              <AppIcon app={game} size="sm" />
              <div className="flex-1 min-w-0 text-left">
                <div className="text-white text-base font-bold truncate">{game.name}</div>
                <div className="text-muted text-xs truncate">{game.desc || t('cat_' + game.gameCategory)}</div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); openDetail(game); }}
                  className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-muted hover:text-white transition-all tap"
                >
                  ›
                </button>
                <div className="text-accent font-bold text-xs uppercase tracking-widest">{t('play_now')}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 11. Games You might Like ── */}
        <SectionHeader title="games_might_like" />
        <HorizontalScroll apps={mightLike} size="md" />

        {/* ── 12. Personalize Recomendations ── */}
        <SectionHeader title="personalize_recommendations" />
        <div className="px-5">
           <PersonalizedCard 
             type="game" 
             data={liveGames} 
             t={t} 
             openDetail={openDetail} 
           />
        </div>

        {/* ── 13. Crowd Favorites ── */}
        <SectionHeader title="crowd_favorites" />
        <HorizontalScroll apps={crowdFavs} size="md" />

        {/* ── 14. This Month's Best ── */}
        <SectionHeader title="this_month_best" />
        <div className="px-5 pb-10">
          <div className="grid grid-cols-1 gap-4">
            {monthBest.map((game, idx) => (
              <div key={game.id} onClick={() => launchApp(game)}
                className="tap flex items-center gap-4 cursor-pointer">
                <span className="text-white/20 font-black text-2xl italic w-8 text-center">{idx + 1}</span>
                <AppIcon app={game} size="sm" />
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-white text-base font-bold truncate">{game.name}</div>
                  <div className="text-muted text-xs truncate uppercase tracking-widest">{t('cat_' + game.gameCategory)}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                     <span>★</span> {game.rating}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); openDetail(game); }}
                    className="w-7 h-7 rounded-xl bg-surface border border-border flex items-center justify-center text-muted hover:text-white transition-all tap"
                  >
                    ›
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 15. All Games categorically ── */}
        <div className="border-t border-border mt-10 pt-8 pb-32">
          <div className="px-5 mb-4">
            <span className="text-white font-black text-2xl tracking-tight">
              {t('all_games') || 'All Games'}
              <span className="text-muted text-sm font-normal ml-2">({liveGames.length})</span>
            </span>
          </div>

          {/* Horizontally scrolling category pills */}
          <div className="flex overflow-x-auto no-sb px-5 gap-2 mb-6">
            <button
              onClick={() => { setActiveCategory('all'); setVisibleCount(24); }}
              className={`tap flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                activeCategory === 'all'
                  ? 'bg-gradient-to-r from-[#5a3eff] to-[#7b5cff] border-transparent text-white shadow-[0_0_15px_rgba(90,62,255,0.4)]'
                  : 'bg-surface border-border text-muted hover:text-white'
              }`}
            >
              🎮 {t('all') || 'All'}
            </button>
            {gameCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setVisibleCount(24); }}
                className={`tap flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-[#5a3eff] to-[#7b5cff] border-transparent text-white shadow-[0_0_15px_rgba(90,62,255,0.4)]'
                    : 'bg-surface border-border text-muted hover:text-white'
                }`}
              >
                {cat.emoji} {t('cat_' + cat.id) || cat.label}
              </button>
            ))}
          </div>

          {/* Games Grid */}
          <div className="px-5 grid grid-cols-2 gap-4">
            {filteredGames.slice(0, visibleCount).map(game => (
              <div
                key={game.id}
                onClick={() => launchApp(game)}
                className="tap group flex flex-col bg-surface border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/20 hover:-translate-y-0.5 cursor-pointer relative"
              >
                {/* Immersive Splash Banner */}
                <div className="w-full aspect-[16/10] relative bg-black/40 overflow-hidden flex-shrink-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openDetail(game); }}
                    className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white text-sm font-bold hover:bg-black transition-all tap z-10"
                    title="View Details"
                  >
                    ›
                  </button>
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
                  {/* Rating Badge Overlay */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                    <span>★</span> {game.rating}
                  </div>
                </div>

                {/* Info and Brand Icon */}
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
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {filteredGames.length > visibleCount && (
            <div className="px-5 mt-6 flex justify-center">
              <button
                onClick={() => setVisibleCount(c => c + 24)}
                className="tap py-3 px-6 rounded-xl bg-surface border border-border text-white font-bold text-sm hover:border-white/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>➕</span> {t('load_more') || 'Load More'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
