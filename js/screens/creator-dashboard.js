var { useState, useEffect, useRef } = React;

function CreatorDashboardScreen() {
  const { user, go, goBack, t, theme, liveGames, liveApps } = useApp();
  const isDark = theme !== 'light';
  const supabase = window.supabase;

  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemStats, setItemStats] = useState(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoSections, setPromoSections] = useState([]);
  const [selectedPromos, setSelectedPromos] = useState([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch user's submitted items
  useEffect(() => {
    if (!user) return;
    const fetchItems = async () => {
      setLoading(true);
      const [{ data: apps }, { data: games }] = await Promise.all([
        supabase.from('apps').select('*').eq('user_id', user.id),
        supabase.from('games').select('*').eq('user_id', user.id),
      ]);
      const allItems = [...(apps || []).map(a => ({ ...a, _type: 'app' })), ...(games || []).map(g => ({ ...g, _type: 'game' }))];
      setMyItems(allItems);
      setLoading(false);
    };
    fetchItems();
  }, [user]);

  // Fetch stats for selected item
  const fetchStats = async (item) => {
    const [{ count: lovesCount }, { count: commentsCount }, { data: ratings }] = await Promise.all([
      supabase.from('loves').select('*', { count: 'exact', head: true }).eq('item_id', item.id),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('item_id', item.id),
      supabase.from('ratings').select('stars').eq('item_id', item.id),
    ]);
    const avgRating = ratings && ratings.length > 0
      ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1)
      : item.rating || '0.0';
    
    // Fetch active promotions for this item
    const { data: activePromos } = await supabase.from('promotions').select('*').eq('item_id', item.id).eq('is_active', true);

    setItemStats({
      loves: lovesCount || 0,
      comments: commentsCount || 0,
      avgRating,
      totalPlayTime: item.total_play_time || 0,
      activePromos: activePromos || [],
    });
  };

  const openItem = (item) => {
    setSelectedItem(item);
    fetchStats(item);
  };

  // Delete item
  const handleDelete = async (item) => {
    const table = item._type === 'game' ? 'games' : 'apps';
    await supabase.from(table).delete().eq('id', item.id);
    await supabase.from('loves').delete().eq('item_id', item.id);
    await supabase.from('comments').delete().eq('item_id', item.id);
    await supabase.from('promotions').delete().eq('item_id', item.id);
    setMyItems(prev => prev.filter(i => i.id !== item.id));
    setSelectedItem(null);
    setDeleteConfirm(null);
  };

  // Fetch promotion pricing
  const openPromoModal = async () => {
    setPromoLoading(true);
    const { data } = await supabase.from('promotion_pricing').select('*').eq('is_active', true);
    setPromoSections(data || []);
    setSelectedPromos([]);
    setShowPromoModal(true);
    setPromoLoading(false);
  };

  const togglePromo = (sectionKey) => {
    setSelectedPromos(prev =>
      prev.includes(sectionKey) ? prev.filter(k => k !== sectionKey) : [...prev, sectionKey]
    );
  };

  const totalPrice = selectedPromos.reduce((sum, key) => {
    const sec = promoSections.find(s => s.section_key === key);
    return sum + (sec ? parseFloat(sec.price) : 0);
  }, 0);

  // Process promotion payment
  const handlePromoPurchase = async () => {
    if (selectedPromos.length === 0) return;
    
    const confirmed = confirm(`You are about to pay $${totalPrice.toFixed(2)} to promote "${selectedItem.name}" in ${selectedPromos.length} section(s). Proceed?`);
    if (!confirmed) return;

    setPromoLoading(true);
    
    // Create promotion entries
    const now = new Date();
    const entries = selectedPromos.map(key => {
      const sec = promoSections.find(s => s.section_key === key);
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + (sec?.duration_days || 7));
      return {
        item_id: selectedItem.id,
        item_type: selectedItem._type,
        category_key: key,
        region: selectedItem.region || 'Global',
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        is_active: sec?.auto_approve !== false,
      };
    });

    for (const entry of entries) {
      await supabase.from('promotions').upsert(entry, { onConflict: 'item_id,category_key' });
    }

    // Log payment
    await supabase.from('activity_log').insert({
      action: 'promotion_purchase',
      item_id: selectedItem.id,
      user_id: user.id,
      metadata: { sections: selectedPromos, total: totalPrice },
    });

    alert(`✅ "${selectedItem.name}" has been promoted to ${selectedPromos.length} section(s)!`);
    setShowPromoModal(false);
    setPromoLoading(false);
    fetchStats(selectedItem);
  };

  const statusColor = (s) => {
    if (s === 'approved') return 'bg-green-500/15 text-green-500 border-green-500/20';
    if (s === 'rejected') return 'bg-red-500/15 text-red-500 border-red-500/20';
    if (s === 'deleted') return 'bg-gray-500/15 text-gray-400 border-gray-500/20';
    return 'bg-yellow-500/15 text-yellow-500 border-yellow-500/20';
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (!user) {
    return (
      <div className={`slide-right flex flex-col h-full ${isDark ? 'bg-[#050b19]' : 'bg-bg'}`}>
        <BackHeader title="Creator Dashboard" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Sign In Required</h2>
            <p className="text-muted text-sm mb-6">Sign in to access your Creator Dashboard</p>
            <button onClick={() => go('auth')} className="tap bg-accent text-white font-bold text-sm px-8 py-3 rounded-full">
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ITEM DETAIL VIEW ──
  if (selectedItem) {
    return (
      <div className={`slide-right flex flex-col h-full ${isDark ? 'bg-[#050b19]' : 'bg-bg'}`}>
        <div className={`pt-safe flex items-center gap-3 px-4 py-3 border-b ${isDark ? 'bg-surface/80 border-white/5' : 'bg-white border-gray-200'}`} style={{zIndex:40}}>
          <button onClick={() => { setSelectedItem(null); setItemStats(null); }} className={`tap w-9 h-9 rounded-xl border flex items-center justify-center text-lg ${isDark ? 'bg-[#171c2d] border-[#2a3043] text-white' : 'bg-gray-100 border-gray-200 text-gray-900'}`}>←</button>
          <span className={`flex-1 font-bold text-base truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedItem.name}</span>
        </div>

        <div className="flex-1 overflow-y-auto no-sb p-5 space-y-5">
          {/* Item Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-card border border-border flex-shrink-0">
              {selectedItem.icon_url
                ? <img src={selectedItem.icon_url} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl">{selectedItem.emoji || '🎮'}</div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <h2 className={`font-black text-xl truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedItem.name}</h2>
              <p className="text-muted text-sm">{selectedItem.category || selectedItem._type}</p>
              <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(selectedItem.status)}`}>
                {(selectedItem.status || 'pending').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          {itemStats ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Likes', value: itemStats.loves, emoji: '❤️' },
                { label: 'Comments', value: itemStats.comments, emoji: '💬' },
                { label: 'Avg Rating', value: `⭐ ${itemStats.avgRating}`, emoji: '' },
                { label: 'Play Time', value: formatTime(itemStats.totalPlayTime), emoji: '⏱️' },
              ].map(stat => (
                <div key={stat.label} className={`rounded-2xl p-4 border ${isDark ? 'bg-card border-border' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-muted text-xs font-bold mb-1">{stat.emoji} {stat.label}</div>
                  <div className={`font-black text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted text-sm">Loading stats...</div>
          )}

          {/* Active Promotions */}
          {itemStats?.activePromos?.length > 0 && (
            <div>
              <h3 className={`font-bold text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>🚀 Active Promotions</h3>
              <div className="space-y-2">
                {itemStats.activePromos.map(p => (
                  <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-card border-border' : 'bg-green-50 border-green-200'}`}>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.category_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    <span className="text-xs text-muted">Until {new Date(p.end_date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Featured Image */}
          {selectedItem.featured_image && (
            <div>
              <h3 className={`font-bold text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Featured Image</h3>
              <img src={selectedItem.featured_image} className="w-full rounded-2xl border border-border" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {selectedItem.status === 'approved' && (
              <button onClick={openPromoModal} className="tap w-full py-4 rounded-2xl bg-gradient-to-r from-accent to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-[0.97] transition-transform">
                🚀 Boost Your App
              </button>
            )}

            <button onClick={() => go('submit', { editItem: selectedItem })} className={`tap w-full py-4 rounded-2xl border font-bold text-sm ${isDark ? 'bg-card border-border text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
              ✏️ Edit Submission
            </button>

            <button onClick={() => setDeleteConfirm(selectedItem)} className="tap w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-sm">
              🗑️ Delete App
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center px-5">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}></div>
            <div className={`border rounded-3xl w-full max-w-[340px] p-6 relative z-10 shadow-2xl slide-up ${isDark ? 'bg-surface border-border' : 'bg-white border-gray-200'}`}>
              <div className="text-center">
                <div className="text-4xl mb-3">⚠️</div>
                <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Delete "{deleteConfirm.name}"?</h3>
                <p className="text-muted text-sm mb-6">This will permanently remove your app, all its stats, likes, comments, and active promotions. This cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className={`flex-1 py-3 rounded-xl border font-semibold text-sm ${isDark ? 'bg-card border-border text-white' : 'bg-gray-100 border-gray-200 text-gray-900'}`}>Cancel</button>
                  <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm">Delete</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Promotion Modal */}
        {showPromoModal && (
          <div className="absolute inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPromoModal(false)}></div>
            <div className={`border rounded-t-3xl w-full max-h-[80%] relative z-10 shadow-2xl slide-up flex flex-col ${isDark ? 'bg-surface border-border' : 'bg-white border-gray-200'}`}>
              <div className="w-12 h-1 bg-muted/30 rounded-full mx-auto mt-3 mb-2" />
              <div className="px-5 pb-2">
                <h3 className={`font-black text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>🚀 Boost "{selectedItem.name}"</h3>
                <p className="text-muted text-xs mt-1">Select sections to promote your app. Payment will be processed automatically.</p>
              </div>

              <div className="flex-1 overflow-y-auto no-sb px-5 py-3 space-y-2">
                {promoSections.length === 0 ? (
                  <div className="text-center py-8 text-muted text-sm">No promotion sections available right now.</div>
                ) : (
                  promoSections.map(sec => {
                    const checked = selectedPromos.includes(sec.section_key);
                    return (
                      <div key={sec.section_key} onClick={() => togglePromo(sec.section_key)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                          checked
                            ? (isDark ? 'bg-accent/10 border-accent/40' : 'bg-purple-50 border-purple-300')
                            : (isDark ? 'bg-card border-border' : 'bg-gray-50 border-gray-200')
                        }`}>
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          checked ? 'bg-accent border-accent text-white' : (isDark ? 'border-muted/40' : 'border-gray-300')
                        }`}>
                          {checked && <span className="text-xs font-bold">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{sec.section_label}</div>
                          <div className="text-muted text-xs">{sec.duration_days} days</div>
                        </div>
                        <div className="text-accent font-black text-lg">${parseFloat(sec.price).toFixed(2)}</div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Bar */}
              <div className={`px-5 py-4 border-t ${isDark ? 'border-border' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-muted text-sm font-bold">{selectedPromos.length} section(s) selected</span>
                  <span className={`font-black text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>${totalPrice.toFixed(2)}</span>
                </div>
                <button
                  onClick={handlePromoPurchase}
                  disabled={selectedPromos.length === 0 || promoLoading}
                  className={`tap w-full py-4 rounded-2xl font-bold text-sm transition-all ${
                    selectedPromos.length > 0
                      ? 'bg-gradient-to-r from-accent to-purple-600 text-white shadow-lg shadow-accent/20 active:scale-[0.97]'
                      : (isDark ? 'bg-card text-muted' : 'bg-gray-200 text-gray-400')
                  }`}>
                  {promoLoading ? 'Processing...' : `Pay $${totalPrice.toFixed(2)} & Promote`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── MAIN LIST VIEW ──
  return (
    <div className={`slide-right flex flex-col h-full ${isDark ? 'bg-[#050b19]' : 'bg-bg'}`}>
      <BackHeader title="Creator Dashboard" />

      <div className="flex-1 overflow-y-auto no-sb">
        {/* Stats Banner */}
        <div className="px-5 pt-4 pb-2">
          <div className={`rounded-2xl p-5 border ${isDark ? 'bg-gradient-to-br from-accent/10 to-purple-900/20 border-accent/20' : 'bg-gradient-to-br from-purple-50 to-white border-purple-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`font-black text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{myItems.length}</div>
                <div className="text-muted text-xs font-bold">Total Submissions</div>
              </div>
              <div className="text-center">
                <div className={`font-black text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{myItems.filter(i => i.status === 'approved').length}</div>
                <div className="text-muted text-xs font-bold">Approved</div>
              </div>
              <div className="text-right">
                <div className={`font-black text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{myItems.filter(i => i.status === 'pending').length}</div>
                <div className="text-muted text-xs font-bold">Pending</div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit New Button */}
        <div className="px-5 py-3">
          <button onClick={() => go('submit')} className="tap w-full py-4 rounded-2xl bg-gradient-to-r from-accent to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-[0.97] transition-transform">
            ＋ Submit New App / Game
          </button>
        </div>

        {/* Items List */}
        <div className="px-5 space-y-3 pb-20">
          <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Your Submissions</h3>
          
          {loading ? (
            <div className="text-center py-12 text-muted text-sm">Loading your apps...</div>
          ) : myItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📦</div>
              <div className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>No submissions yet</div>
              <div className="text-muted text-xs">Submit your first app or game to get started!</div>
            </div>
          ) : (
            myItems.map(item => (
              <div key={item.id} onClick={() => openItem(item)}
                className={`tap flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
                  isDark ? 'bg-card border-border hover:border-accent/30' : 'bg-white border-gray-200 hover:border-purple-300 shadow-sm'
                }`}>
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface border border-border flex-shrink-0">
                  {item.icon_url
                    ? <img src={item.icon_url} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xl">{item.emoji || '🎮'}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.name}</div>
                  <div className="text-muted text-xs">{item._type === 'game' ? '🎮 Game' : '📱 App'} · {item.category || 'Uncategorized'}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(item.status)}`}>
                    {(item.status || 'pending').toUpperCase()}
                  </span>
                  <span className="text-muted text-[10px]">⭐ {item.rating || '0.0'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

window.CreatorDashboardScreen = CreatorDashboardScreen;

