// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────

// ── ZeroOS Multi-tasking System ──────────────────────────────────────────────

function TaskLayer() {
  var { tasks, activeTaskId, minimizeTask, closeTask } = useApp();
  
  if (tasks.length === 0) return null;

  return (
    <div className="absolute inset-0 z-[100] pointer-events-none">
      {tasks.map(task => {
        const isActive = task.id === activeTaskId && task.status === 'active';
        return (
          <div key={task.id} 
               className={`absolute inset-0 bg-bg transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] pointer-events-auto ${isActive ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 scale-95'}`}
               style={{ zIndex: isActive ? 50 : 0 }}>
            
            {/* App Content */}
            <iframe src={task.app.url} className="w-full h-full border-none" allow="autoplay; fullscreen" />

            {/* Floating Control Hub */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 p-2 rounded-3xl shadow-2xl">
               <button onClick={() => minimizeTask(task.id)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center tap">
                  <span className="text-xl">🏠</span>
               </button>
               <button onClick={() => closeTask(task.id)} className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center tap">
                  <span className="text-xl text-red-500">×</span>
               </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FloatingBubble({ task, index, onDragStart, onDragEnd, targetPos }) {
  var { switchTask } = useApp();
  const [pos, setPos] = React.useState(targetPos || { x: 10, y: 150 + (index * 80) });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragRef = React.useRef({ startX: 0, startY: 0, startPos: { x: 0, y: 0 } });

  // Sync position when not dragging to allow auto-stacking
  React.useEffect(() => {
    if (!isDragging && targetPos) {
      setPos(targetPos);
    }
  }, [targetPos, isDragging]);

  const handleStart = (e) => {
    const touch = e.touches ? e.touches[0] : e;
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startPos: { ...pos }
    };
    setIsDragging(true);
    onDragStart(task.id);
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - dragRef.current.startX;
    const dy = touch.clientY - dragRef.current.startY;
    
    setPos({
      x: dragRef.current.startPos.x + dx,
      y: dragRef.current.startPos.y + dy
    });
  };

  const handleEnd = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const screenWidth = window.innerWidth;
    const centerX = pos.x + 30; 
    const side = centerX < screenWidth / 2 ? 'L' : 'R';
    
    onDragEnd(task.id, pos.x + 30, pos.y + 30, side);
  };

  return (
    <div 
      className={`fixed z-[90] w-[60px] h-[60px] transition-transform ${isDragging ? 'scale-110 z-[100]' : 'duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]'}`}
      style={{ left: pos.x, top: pos.y, touchAction: 'none' }}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onClick={() => !isDragging && switchTask(task.id)}
    >
      <div className="w-full h-full rounded-[22px] bg-card border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden active:scale-90 transition-transform">
         <AppLogo app={task.app} size="xs" />
         <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent border border-card shadow-sm"></div>
      </div>
      <div className="absolute -bottom-4 left-0 right-0 text-center">
         <span className="text-white text-[7px] font-black uppercase tracking-tighter opacity-40 truncate px-1 block">{task.app.name}</span>
      </div>
    </div>
  );
}

function TaskDock() {
  var { tasks, activeTaskId, closeTask, t } = useApp();
  const [draggingId, setDraggingId] = React.useState(null);
  const [taskSides, setTaskSides] = React.useState({}); // { taskId: 'L' | 'R' }

  if (tasks.length === 0 || activeTaskId) return null;

  const handleDragStart = (id) => setDraggingId(id);
  const handleDragEnd = (id, x, y, side) => {
    setDraggingId(null);
    const screenHeight = window.innerHeight;
    const screenWidth = window.innerWidth;
    const distToBottom = screenHeight - y;
    const distToCenter = Math.abs((screenWidth / 2) - x);

    if (distToBottom < 150 && distToCenter < 100) {
      closeTask(id);
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    } else {
      setTaskSides(prev => ({ ...prev, [id]: side }));
    }
  };
  
  // Calculate auto-stacking positions
  const leftStack = [];
  const rightStack = [];
  
  const positionedTasks = tasks.map((task, i) => {
    const side = taskSides[task.id] || (i % 2 === 0 ? 'L' : 'R');
    const stack = side === 'L' ? leftStack : rightStack;
    const yIndex = stack.length;
    stack.push(task.id);

    const screenWidth = window.innerWidth;
    const targetX = side === 'L' ? 10 : screenWidth - 70;
    const targetY = 120 + (yIndex * 75);
    
    return { task, targetPos: { x: targetX, y: targetY } };
  });

  return (
    <>
      {positionedTasks.map(({ task, targetPos }) => (
        <FloatingBubble 
          key={task.id} 
          task={task} 
          targetPos={targetPos}
          onDragStart={handleDragStart} 
          onDragEnd={handleDragEnd}
        />
      ))}

      {/* Close Zone */}
      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[85] flex flex-col items-center gap-2 transition-all duration-300 ${draggingId ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
         <div className="w-16 h-16 rounded-full border-2 border-dashed bg-red-500/10 border-red-500/30 flex items-center justify-center">
            <span className="text-2xl text-red-500">×</span>
         </div>
         <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">{t('close_app')}</span>
      </div>
    </>
  );
}

// ── AppLogo: real brand logo with emoji fallback ──────────────────────────────
function AppLogo({ app, size = 'md' }) {
  const px = { xs:48, sm:62, md:86, lg:115 }[size] || 86;
  const radius = { xs:'rounded-xl', sm:'rounded-2xl', md:'rounded-[28px]', lg:'rounded-[38px]' }[size];
  const fontSize = { xs:'text-2xl', sm:'text-4xl', md:'text-5xl', lg:'text-7xl' }[size];

  const primary = app.icon_url || (app.domain ? `https://logo.clearbit.com/${app.domain}` : null);
  
  const [src, setSrc]     = useState(primary);
  const [failed, setFailed] = useState(!primary);

  function handleError() {
    if (src === app.icon_url && app.domain) {
      setSrc(`https://logo.clearbit.com/${app.domain}`);
    } else if (src && src.includes('clearbit') && app.domain) {
      setSrc(`https://www.google.com/s2/favicons?domain=${app.domain}&sz=128`);
    } else {
      setFailed(true);
    }
  }

  if (failed || !src) {
    return (
      <div className={`${radius} flex items-center justify-center flex-shrink-0 ${fontSize}`}
        style={{width:px, height:px}}>
        {app.emoji || '📱'}
      </div>
    );
  }

  return (
    <div className={`${radius} overflow-hidden flex-shrink-0`}
      style={{width:px, height:px, background:'#fff'}}>
      <img
        src={src}
        alt={app.name}
        onError={handleError}
        className="w-full h-full object-cover"
        style={{ padding: (src.includes('clearbit') || src.includes('favicons')) ? (px > 60 ? 10 : 6) : 0 }}
      />
    </div>
  );
}
// keep AppIcon as alias
const AppIcon = AppLogo;

// ── AppCard: 2-column card used in Explore ────────────────────────────────────
function AppCard({ app, onPress }) {
  return (
    <button onClick={() => onPress(app)}
      className="tap w-full flex flex-col items-center gap-3 p-2 transition-all">
      <AppLogo app={app} size="md" />
      <div className="w-full text-center">
        <div className="text-white text-[11px] font-bold leading-tight truncate">{app.name}</div>
        <div className="text-muted text-[9px] mt-0.5 truncate uppercase tracking-widest">{app.category}</div>
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

// ── Category SVG Icons ────────────────────────────────────────────────────────
const CATEGORY_ICONS = {
  ai: ({ g }) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs><linearGradient id="g-ai" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#c084fc"/><stop offset="1" stopColor="#7c3aed"/></linearGradient></defs>
      <rect x="7" y="4" width="14" height="14" rx="3" stroke="url(#g-ai)" strokeWidth="2" fill="none"/>
      <circle cx="10.5" cy="10.5" r="1.5" fill="url(#g-ai)"/>
      <circle cx="17.5" cy="10.5" r="1.5" fill="url(#g-ai)"/>
      <path d="M10 13.5s1 2 4 2 4-2 4-2" stroke="url(#g-ai)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M10 4V2M18 4V2M14 18v4M10 22h8" stroke="url(#g-ai)" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="6" cy="11" r="1.5" fill="url(#g-ai)"/>
      <circle cx="22" cy="11" r="1.5" fill="url(#g-ai)"/>
      <path d="M7.5 11H10M18 11h2.5" stroke="url(#g-ai)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  kids: ({ g }) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs><linearGradient id="g-kids" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#fde68a"/><stop offset="1" stopColor="#f97316"/></linearGradient></defs>
      <circle cx="14" cy="10" r="6" stroke="url(#g-kids)" strokeWidth="2" fill="none"/>
      <circle cx="11" cy="9" r="1" fill="url(#g-kids)"/>
      <circle cx="17" cy="9" r="1" fill="url(#g-kids)"/>
      <path d="M11 12s1 1.5 3 1.5 3-1.5 3-1.5" stroke="url(#g-kids)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M9 16c-2.5 1-4 3-4 5h18c0-2-1.5-4-4-5" stroke="url(#g-kids)" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M11 16l-1 3M17 16l1 3" stroke="url(#g-kids)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  ecommerce: ({ g }) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs><linearGradient id="g-ec" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#fb923c"/><stop offset="1" stopColor="#dc2626"/></linearGradient></defs>
      <path d="M4 4h2.5l2.5 11h12l2-7H9" stroke="url(#g-ec)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="12" cy="23" r="1.8" fill="url(#g-ec)"/>
      <circle cx="20" cy="23" r="1.8" fill="url(#g-ec)"/>
      <path d="M13 10h4M15 8v4" stroke="url(#g-ec)" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  business: ({ g }) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs><linearGradient id="g-biz" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#60a5fa"/><stop offset="1" stopColor="#4338ca"/></linearGradient></defs>
      <rect x="4" y="13" width="20" height="11" rx="2" stroke="url(#g-biz)" strokeWidth="2" fill="none"/>
      <path d="M10 13v-2a4 4 0 0 1 8 0v2" stroke="url(#g-biz)" strokeWidth="2" fill="none"/>
      <path d="M4 19h20" stroke="url(#g-biz)" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="14" cy="19" r="2" fill="url(#g-biz)"/>
    </svg>
  ),
  beauty: ({ g }) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs><linearGradient id="g-bty" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#f472b6"/><stop offset="1" stopColor="#e11d48"/></linearGradient></defs>
      <ellipse cx="14" cy="20" rx="5" ry="3" fill="url(#g-bty)" opacity="0.3"/>
      <rect x="11" y="8" width="6" height="12" rx="3" stroke="url(#g-bty)" strokeWidth="2" fill="none"/>
      <rect x="11" y="4" width="6" height="5" rx="1.5" fill="url(#g-bty)"/>
      <path d="M11 12h6" stroke="url(#g-bty)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  artdesign: ({ g }) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs><linearGradient id="g-art" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#c084fc"/><stop offset="1" stopColor="#db2777"/></linearGradient></defs>
      <circle cx="14" cy="14" r="9" stroke="url(#g-art)" strokeWidth="2" fill="none"/>
      <circle cx="10" cy="12" r="2" fill="url(#g-art)"/>
      <circle cx="17" cy="10" r="1.5" fill="#f472b6"/>
      <circle cx="19" cy="16" r="1.5" fill="#a78bfa"/>
      <circle cx="12" cy="18" r="1.5" fill="#fb923c"/>
      <path d="M14 5v2M14 21v2M5 14h2M21 14h2" stroke="url(#g-art)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  finance: ({ g }) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs><linearGradient id="g-fin" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#34d399"/><stop offset="1" stopColor="#059669"/></linearGradient></defs>
      <rect x="4" y="6" width="20" height="16" rx="3" stroke="url(#g-fin)" strokeWidth="2" fill="none"/>
      <circle cx="14" cy="14" r="4" stroke="url(#g-fin)" strokeWidth="1.8" fill="none"/>
      <path d="M14 11.5v1.3l1.2 1.2" stroke="url(#g-fin)" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="7" cy="14" r="1" fill="url(#g-fin)"/>
      <circle cx="21" cy="14" r="1" fill="url(#g-fin)"/>
    </svg>
  ),
  education: ({ g }) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs><linearGradient id="g-edu" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#818cf8"/><stop offset="1" stopColor="#1d4ed8"/></linearGradient></defs>
      <path d="M14 4L3 10l11 6 11-6-11-6z" stroke="url(#g-edu)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
      <path d="M7 13v6c2 2 4 3 7 3s5-1 7-3v-6" stroke="url(#g-edu)" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M25 10v5" stroke="url(#g-edu)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  entertainment: ({ g }) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs><linearGradient id="g-ent" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#f87171"/><stop offset="1" stopColor="#db2777"/></linearGradient></defs>
      <circle cx="14" cy="14" r="9" stroke="url(#g-ent)" strokeWidth="2" fill="none"/>
      <polygon points="11,10 11,18 20,14" fill="url(#g-ent)"/>
    </svg>
  ),
  tools: ({ g }) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs><linearGradient id="g-tools" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#94a3b8"/><stop offset="1" stopColor="#475569"/></linearGradient></defs>
      <path d="M18 4a4 4 0 0 1 4 4c0 1-.3 2-.9 2.7L8.7 23.1a2 2 0 0 1-2.8-2.8L18.3 7.9A4 4 0 0 1 18 4z" stroke="url(#g-tools)" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M7 6l3 3-4 4-3-3a5 5 0 0 0 4-4z" stroke="url(#g-tools)" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
      <circle cx="21" cy="20" r="3" stroke="url(#g-tools)" strokeWidth="1.8" fill="none"/>
    </svg>
  ),
  health: ({ g }) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs><linearGradient id="g-hlt" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#2dd4bf"/><stop offset="1" stopColor="#0891b2"/></linearGradient></defs>
      <path d="M14 23S5 17 5 11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 12-9 12z" stroke="url(#g-hlt)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M10 11h8M14 7v8" stroke="url(#g-hlt)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  social: ({ g }) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs><linearGradient id="g-soc" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#38bdf8"/><stop offset="1" stopColor="#2563eb"/></linearGradient></defs>
      <circle cx="8" cy="9" r="3" stroke="url(#g-soc)" strokeWidth="2" fill="none"/>
      <circle cx="20" cy="9" r="3" stroke="url(#g-soc)" strokeWidth="2" fill="none"/>
      <circle cx="14" cy="19" r="3" stroke="url(#g-soc)" strokeWidth="2" fill="none"/>
      <path d="M10.5 10.5l4.5 7" stroke="url(#g-soc)" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M17.5 10.5L13 17.5" stroke="url(#g-soc)" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M11 19h-3" stroke="url(#g-soc)" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
};

// ── CategoryPill: modern icon chip for home category row ──────────────────────
function CategoryPill({ cat, active, onPress }) {
  const { t } = useApp();
  const IconComp = CATEGORY_ICONS[cat.id];
  return (
    <button onClick={() => onPress(cat.id)}
      className="tap flex-shrink-0 flex flex-col items-center gap-1.5"
      style={{WebkitTapHighlightColor:'transparent'}}>
      <div
        className="flex items-center justify-center transition-all duration-200"
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          background: active
            ? `linear-gradient(135deg, var(--cat-from, #7c6af7), var(--cat-to, #4f46e5))`
            : '#1c1c28',
          border: active ? '2px solid rgba(255,255,255,0.35)' : '1.5px solid rgba(255,255,255,0.08)',
          boxShadow: active
            ? '0 4px 20px rgba(124,106,247,0.55), 0 0 0 3px rgba(255,255,255,0.12)'
            : '0 2px 8px rgba(0,0,0,0.4)',
          transform: active ? 'scale(1.08)' : 'scale(1)',
          ...cat.cssVars,
        }}>
        {IconComp ? <IconComp /> : <span style={{fontSize:24}}>{cat.emoji}</span>}
      </div>
      <span style={{
        fontSize: 10,
        fontWeight: 600,
        color: active ? '#fff' : '#5a5a7a',
        maxWidth: 56,
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
        transition: 'color 0.2s',
      }}>{t('cat_' + cat.id)}</span>
    </button>
  );
}

// ── AppSquareCard: square card for home category grid (3-col) ─────────────────
function AppSquareCard({ app, onPress }) {
  return (
    <button onClick={() => onPress(app)}
      className="tap flex flex-col items-center gap-2.5 w-full">
      <div className="w-full flex items-center justify-center transition-transform active:scale-95 duration-200">
        <AppLogo app={app} size="md" />
      </div>
      <div className="w-full text-center px-0.5">
        <div className="text-white text-[11px] font-bold truncate leading-tight">{app.name}</div>
        <div className="flex items-center justify-center gap-0.5 mt-1 text-[9px] text-amber-400 font-bold">
          <span>★</span> {app.rating || "4.8"}
        </div>
      </div>
    </button>
  );
}

// ── BottomNav ───────────────────────────────────────────────────────────────────
function BottomNav({ active }) {
  var { go, mainTab, setMainTab, user, t } = useApp();

  function goGames() { setMainTab('games'); go('games'); }
  function goApps()  { setMainTab('apps');  go('apps');  }

  const effectiveActive = active || mainTab;

  const items = [
    { id: 'games',   label: t('games_nav'),   icon: GamesNavIcon,  action: goGames },
    { id: 'apps',    label: t('apps_nav'),    icon: AppsNavIcon,   action: goApps  },
    { id: 'plus',    label: '',               icon: null,          action: () => { if (user) go('submit'); else go('auth'); } },
    { id: 'explore', label: t('explore_nav'), icon: ExploreIcon,   action: () => go('explore', { mode: null, exploreCategory: null }) },
    { id: 'profile', label: t('profile_nav'), icon: ProfileIcon,   action: () => go('profile') },
  ];

  return (
    <nav className="pb-safe absolute bottom-0 left-0 right-0 flex items-end justify-around bg-surface/95 backdrop-blur-xl border-t border-border px-1 pt-2" style={{zIndex:50}}>
      {items.map(it => {
        if (it.id === 'plus') return (
          <button key="plus" onClick={it.action}
            className="tap -mt-5 w-14 h-14 rounded-full glow-purple flex items-center justify-center shadow-xl"
            style={{background:'linear-gradient(135deg,#9b84ff,#7c6af7)'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        );
        const isActive = effectiveActive === it.id;
        return (
          <button key={it.id} onClick={it.action}
            className="flex flex-col items-center gap-1 px-3 pb-1.5 pt-1 rounded-xl transition-colors"
            style={{color: isActive ? '#7c6af7' : '#5a5a7a'}}>
            <it.icon active={isActive} />
            <span className="text-[10px] font-semibold" style={{color: isActive ? '#7c6af7' : '#5a5a7a'}}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── SVG Icons ───────────────────────────────────────────────────────────────────
function GamesNavIcon({ active }) {
  const c = active ? '#7c6af7' : '#5a5a7a';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="13" rx="4" stroke={c} strokeWidth="2"/>
      <path d="M8 12h4M10 10v4" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="16" cy="11" r="1" fill={c}/>
      <circle cx="18" cy="13" r="1" fill={c}/>
      <path d="M7 3l1 3M17 3l-1 3" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function AppsNavIcon({ active }) {
  const c = active ? '#7c6af7' : '#5a5a7a';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="2" stroke={c} strokeWidth="2"/>
      <rect x="14" y="3" width="7" height="7" rx="2" stroke={c} strokeWidth="2"/>
      <rect x="3" y="14" width="7" height="7" rx="2" stroke={c} strokeWidth="2"/>
      <rect x="14" y="14" width="7" height="7" rx="2" stroke={c} strokeWidth="2"/>
    </svg>
  );
}
function ExploreIcon({ active }) {
  const c = active ? '#7c6af7' : '#5a5a7a';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function ProfileIcon({ active }) {
  const c = active ? '#7c6af7' : '#5a5a7a';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

// ── BackHeader ────────────────────────────────────────────────────────────────
function BackHeader({ title, right }) {
  var { goBack } = useApp();
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
function PersonalizedCard({ type, data, t, openDetail }) {
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('all'); // 'all', 'top_rated', 'new'
  
  const results = React.useMemo(() => {
    let list = data;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) || 
        (item.desc && item.desc.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.gameCategory && item.gameCategory.toLowerCase().includes(q))
      );
    }
    
    if (filter === 'top_rated') {
      list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filter === 'new') {
      list = [...list].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
    
    return list.slice(0, 4);
  }, [query, filter, data]);

  return (
    <div className="bg-gradient-to-r from-accent/20 to-purple-900/20 rounded-3xl p-6 border border-accent/20">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-2xl">
          {type === 'app' ? '✨' : '🎮'}
        </div>
        <div className="flex-1">
          <div className="text-white font-bold text-lg">{t('personalize_recommendations')}</div>
          <div className="text-white/60 text-sm">
            {type === 'app' ? 'Tell us what apps you need' : 'Find your next favorite game'}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={type === 'app' ? "E.g. Photo editor, AI..." : "E.g. Action, Racing..."}
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-accent/50 transition-colors"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-xs font-bold">CLEAR</button>
          )}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-accent text-white shadow-lg' : 'bg-white/5 text-muted hover:bg-white/10'}`}>
            All
          </button>
          <button 
            onClick={() => setFilter('top_rated')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === 'top_rated' ? 'bg-accent text-white shadow-lg' : 'bg-white/5 text-muted hover:bg-white/10'}`}>
            Top Rated
          </button>
          <button 
            onClick={() => setFilter('new')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === 'new' ? 'bg-accent text-white shadow-lg' : 'bg-white/5 text-muted hover:bg-white/10'}`}>
            New Arrival
          </button>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {results.map(item => (
              <button key={item.id} onClick={() => openDetail(item)}
                className="tap flex items-center gap-3 p-2.5 bg-black/20 rounded-2xl border border-white/5 hover:border-accent/30 transition-all">
                <AppIcon app={item} size="xs" />
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-white text-[11px] font-bold truncate">{item.name}</div>
                  <div className="text-amber-400 text-[9px] font-bold">★ {item.rating}</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <span className="text-muted text-xs">No matches found. Try another query!</span>
          </div>
        )}
      </div>
    </div>
  );
}
