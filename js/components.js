// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────

// ── AppIcon: emoji fallback + big rounded square ──────────────────────────────
function AppIcon({ app, size = 'md' }) {
  const cls = {
    xs: 'w-9  h-9  rounded-xl  text-xl',
    sm: 'w-11 h-11 rounded-xl  text-2xl',
    md: 'w-14 h-14 rounded-2xl text-3xl',
    lg: 'w-20 h-20 rounded-3xl text-5xl',
  }[size];
  return (
    <div className={`${cls} bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0`}>
      {app.emoji}
    </div>
  );
}

// ── AppCard: 2-column card used in Explore ────────────────────────────────────
function AppCard({ app, onPress }) {
  return (
    <button onClick={() => onPress(app)}
      className="tap w-full flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-card border border-border hover:border-white/20 transition-colors">
      <AppIcon app={app} size="md" />
      <div className="w-full text-center">
        <div className="text-white text-xs font-semibold leading-tight truncate">{app.name}</div>
        <div className="text-muted text-[10px] mt-0.5 truncate">{app.category}</div>
      </div>
    </button>
  );
}

// ── ListAppRow: used in Search, Recent ───────────────────────────────────────
function ListAppRow({ app, onPress, rightSlot, subtitle }) {
  return (
    <button onClick={() => onPress(app)}
      className="tap w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border hover:border-white/20 transition-colors">
      <AppIcon app={app} size="sm" />
      <div className="flex-1 min-w-0 text-left">
        <div className="text-white text-sm font-semibold truncate">{app.name}</div>
        <div className="text-muted text-xs mt-0.5 truncate">{subtitle || app.category}</div>
      </div>
      {rightSlot || <span className="text-muted text-sm">›</span>}
    </button>
  );
}

// ── FilterPill ────────────────────────────────────────────────────────────────
function FilterPill({ label, active, onPress }) {
  return (
    <button onClick={() => onPress(label)}
      className={`pill tap flex-shrink-0 ${active
        ? 'bg-accent text-white shadow-[0_0_12px_rgba(124,106,247,.5)]'
        : 'bg-card border border-border text-muted hover:border-white/20'}`}>
      {label}
    </button>
  );
}

// ── BottomNav ─────────────────────────────────────────────────────────────────
function BottomNav({ active }) {
  const { goHome, go } = useApp();
  const items = [
    { id: 'home',      label: 'Home',      icon: HomeIcon,      action: goHome },
    { id: 'explore',   label: 'Explore',   icon: ExploreIcon,   action: () => go('search') },
    { id: 'plus',      label: '',          icon: null,          action: () => {} },
    { id: 'workspace', label: 'Workspace', icon: WorkspaceIcon, action: () => go('workspace') },
    { id: 'profile',   label: 'Profile',   icon: ProfileIcon,   action: () => go('profile') },
  ];
  return (
    <nav className="pb-safe absolute bottom-0 left-0 right-0 flex items-end justify-around bg-surface/95 backdrop-blur-xl border-t border-border px-1 pt-2" style={{zIndex:50}}>
      {items.map(it => {
        if (it.id === 'plus') return (
          <button key="plus" onClick={it.action}
            className="tap -mt-5 w-14 h-14 rounded-full bg-accent glow-purple flex items-center justify-center text-white text-2xl font-light shadow-xl">
            +
          </button>
        );
        const isActive = active === it.id;
        return (
          <button key={it.id} onClick={it.action}
            className={`flex flex-col items-center gap-1 px-3 pb-1.5 pt-1 rounded-xl transition-colors ${isActive ? 'text-accent' : 'text-muted'}`}>
            <it.icon active={isActive} />
            <span className="text-[10px] font-semibold">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function HomeIcon({ active }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#7c6af7' : '#5a5a7a'}>
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>;
}
function ExploreIcon({ active }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#7c6af7' : '#5a5a7a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>;
}
function WorkspaceIcon({ active }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#7c6af7' : '#5a5a7a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>;
}
function ProfileIcon({ active }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#7c6af7' : '#5a5a7a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>;
}

// ── BackHeader ────────────────────────────────────────────────────────────────
function BackHeader({ title, right }) {
  const { goBack } = useApp();
  return (
    <div className="pt-safe flex items-center gap-3 px-4 py-3 border-b border-border bg-surface/80 backdrop-blur-xl flex-shrink-0" style={{zIndex:40}}>
      <button onClick={goBack} className="tap w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-white text-lg">←</button>
      {title && <span className="flex-1 text-white font-bold text-base truncate">{title}</span>}
      {right}
    </div>
  );
}

// ── StarRating ────────────────────────────────────────────────────────────────
function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {'★★★★★'.split('').map((s, i) => (
        <span key={i} className={i < Math.round(rating) ? 'text-amber-400' : 'text-white/20'} style={{fontSize:13}}>{s}</span>
      ))}
      <span className="text-white/70 text-xs ml-1">{rating}</span>
    </div>
  );
}
