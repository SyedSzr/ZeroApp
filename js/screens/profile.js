// ── PROFILE SCREEN ────────────────────────────────────────────────────────────
function ProfileScreen() {
  const { favorites, go } = useApp();

  const menuItems = [
    { icon: '⭐', label: 'Favorites',     badge: null,  action: () => {} },
    { icon: '⬇️', label: 'Downloads',     badge: '12',  action: () => {} },
    { icon: '📁', label: 'My Workspace',  badge: null,  action: () => go('workspace') },
    { icon: '⚙️', label: 'Settings',      badge: null,  action: () => {} },
    { icon: '❓', label: 'Help & Support', badge: null, action: () => {} },
    { icon: 'ℹ️', label: 'About ZeroApp', badge: null,  action: () => {} },
  ];

  return (
    <div className="slide-up flex flex-col h-full">

      {/* ── Header ── */}
      <div className="pt-safe px-5 flex items-center justify-between py-4 border-b border-border bg-surface flex-shrink-0">
        <h1 className="text-white font-extrabold text-xl">Profile</h1>
        <button className="tap w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-xl">⚙️</button>
      </div>

      <div className="flex-1 overflow-y-auto no-sb pb-28">

        {/* ── User Card ── */}
        <div className="px-5 py-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-violet-400 flex items-center justify-center text-3xl text-white font-bold flex-shrink-0">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-extrabold text-lg">Ali Hassan</span>
              <span className="pill bg-accent text-white text-[10px] px-2 py-0.5">Pro</span>
            </div>
            <p className="text-muted text-sm mt-0.5">ali.hassan@email.com</p>
          </div>
        </div>

        {/* ── Go Premium Banner ── */}
        <div className="mx-5 mb-5">
          <button className="tap w-full flex items-center justify-between p-4 rounded-3xl bg-gradient-to-r from-accent to-violet-500 glow-purple">
            <div>
              <div className="text-white font-bold text-sm">Go Premium</div>
              <div className="text-white/60 text-xs mt-0.5">Unlock premium apps, faster performance and more.</div>
            </div>
            <span className="text-white text-xl font-bold ml-3">→</span>
          </button>
        </div>

        {/* ── Menu Items ── */}
        <div className="px-5 flex flex-col gap-2">
          {menuItems.map(item => (
            <button key={item.label} onClick={item.action}
              className="tap flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-card border border-border hover:border-white/20 transition-colors">
              <span className="text-xl w-7 text-center flex-shrink-0">{item.icon}</span>
              <span className="flex-1 text-white font-semibold text-sm text-left">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-bold bg-accent text-white px-2 py-0.5 rounded-full">{item.badge}</span>
              )}
              <span className="text-muted text-sm">›</span>
            </button>
          ))}
        </div>

        {/* ── Feature Badges ── */}
        <div className="mx-5 mt-6 grid grid-cols-2 gap-3">
          {[
            { icon: '⚡', title: 'Instant Access', sub: 'No downloads needed' },
            { icon: '🚀', title: 'Light & Fast',   sub: 'Optimized for speed' },
            { icon: '🔒', title: 'Secure & Private',sub: 'Your data is protected' },
            { icon: '💾', title: 'Save Storage',   sub: 'No need to install' },
          ].map(b => (
            <div key={b.title} className="bg-card border border-border rounded-2xl p-3 flex flex-col gap-1.5">
              <span className="text-2xl">{b.icon}</span>
              <div className="text-white text-xs font-bold leading-tight">{b.title}</div>
              <div className="text-muted text-[10px] leading-tight">{b.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
