// ── ONBOARDING SPLASH SCREEN ─────────────────────────────────────────────────
// Shows 3 premium pages on first launch only. Uses localStorage 'zero_onboarded'.

function OnboardingScreen({ onComplete }) {
  const [page, setPage] = React.useState(0);
  const [direction, setDirection] = React.useState(1); // 1 = forward, -1 = back
  const [animating, setAnimating] = React.useState(false);
  const touchRef = React.useRef({ startX: 0, startY: 0 });
  const containerRef = React.useRef(null);

  const pages = [
    {
      title: 'Welcome to ZeroApp',
      subtitle: 'Your Web Operating System',
      description: 'Discover, launch, and multitask hundreds of web apps & games — all without installing a single thing.',
      gradient: 'linear-gradient(135deg, #7c6af7 0%, #4f46e5 50%, #2d1b69 100%)',
      accentGlow: 'rgba(124, 106, 247, 0.4)',
      icon: 'rocket',
    },
    {
      title: 'Instant & Powerful',
      subtitle: 'Zero Install. Zero Wait.',
      description: 'Run apps instantly from the cloud. Switch between them with our built-in multitasking system — just like a real OS.',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #1e1b4b 100%)',
      accentGlow: 'rgba(59, 130, 246, 0.4)',
      icon: 'bolt',
    },
    {
      title: 'Ready to Explore?',
      subtitle: 'Your Journey Starts Now',
      description: 'Browse curated categories, discover trending apps, play games, and make ZeroApp your daily driver.',
      gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #4a1d6e 100%)',
      accentGlow: 'rgba(168, 85, 247, 0.4)',
      icon: 'stars',
    }
  ];

  const goTo = (nextPage) => {
    if (animating || nextPage === page) return;
    setDirection(nextPage > page ? 1 : -1);
    setAnimating(true);
    setTimeout(() => {
      setPage(nextPage);
      setAnimating(false);
    }, 50);
  };

  const next = () => {
    if (page < pages.length - 1) goTo(page + 1);
    else finish();
  };

  const prev = () => {
    if (page > 0) goTo(page - 1);
  };

  const finish = () => {
    try { localStorage.setItem('zero_onboarded', 'true'); } catch {}
    onComplete();
  };

  // Touch/swipe handlers
  const handleTouchStart = (e) => {
    touchRef.current.startX = e.touches[0].clientX;
    touchRef.current.startY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    const dy = e.changedTouches[0].clientY - touchRef.current.startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
  };

  const currentPage = pages[page];

  // Render illustration SVGs
  const renderIllustration = (iconType) => {
    switch (iconType) {
      case 'rocket':
        return (
          <svg viewBox="0 0 200 200" style={{width: '100%', height: '100%'}}>
            <defs>
              <linearGradient id="ob-g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
              <linearGradient id="ob-g1b" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c4b5fd" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <filter id="ob-glow1">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* Orbit rings */}
            <ellipse cx="100" cy="100" rx="80" ry="25" fill="none" stroke="rgba(167,139,250,0.15)" strokeWidth="1.5" transform="rotate(-20 100 100)">
              <animateTransform attributeName="transform" type="rotate" from="-20 100 100" to="340 100 100" dur="20s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="100" cy="100" rx="65" ry="20" fill="none" stroke="rgba(124,58,237,0.12)" strokeWidth="1" transform="rotate(30 100 100)">
              <animateTransform attributeName="transform" type="rotate" from="30 100 100" to="-330 100 100" dur="15s" repeatCount="indefinite" />
            </ellipse>
            {/* Floating particles on orbit */}
            <circle r="3" fill="#a78bfa" opacity="0.7">
              <animateMotion dur="20s" repeatCount="indefinite" path="M100,100 m-80,0 a80,25 0 1,1 160,0 a80,25 0 1,1 -160,0" />
            </circle>
            <circle r="2" fill="#c4b5fd" opacity="0.5">
              <animateMotion dur="15s" repeatCount="indefinite" path="M100,100 m-65,0 a65,20 0 1,0 130,0 a65,20 0 1,0 -130,0" />
            </circle>
            {/* Rocket body */}
            <g filter="url(#ob-glow1)">
              <path d="M100 45 C100 45 82 75 82 110 C82 130 90 140 100 145 C110 140 118 130 118 110 C118 75 100 45 100 45Z" fill="url(#ob-g1)" />
              {/* Rocket window */}
              <circle cx="100" cy="95" r="10" fill="#0d0d14" stroke="#c4b5fd" strokeWidth="2" />
              <circle cx="100" cy="95" r="5" fill="rgba(167,139,250,0.3)" />
              {/* Fins */}
              <path d="M82 120 L68 140 L82 135Z" fill="url(#ob-g1b)" />
              <path d="M118 120 L132 140 L118 135Z" fill="url(#ob-g1b)" />
              {/* Nose cone highlight */}
              <path d="M100 48 C95 60 92 75 92 85" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" fill="none" />
            </g>
            {/* Exhaust flame */}
            <g>
              <path d="M93 145 Q100 175 107 145" fill="#f59e0b" opacity="0.9">
                <animate attributeName="d" values="M93 145 Q100 175 107 145;M95 145 Q100 170 105 145;M93 145 Q100 175 107 145" dur="0.4s" repeatCount="indefinite" />
              </path>
              <path d="M96 145 Q100 165 104 145" fill="#fbbf24" opacity="0.8">
                <animate attributeName="d" values="M96 145 Q100 165 104 145;M97 145 Q100 160 103 145;M96 145 Q100 165 104 145" dur="0.3s" repeatCount="indefinite" />
              </path>
            </g>
            {/* Stars */}
            <circle cx="35" cy="50" r="2" fill="white" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.1;0.6" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="160" cy="40" r="1.5" fill="white" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="150" cy="80" r="2" fill="white" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.15;0.5" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="45" cy="130" r="1.5" fill="white" opacity="0.35">
              <animate attributeName="opacity" values="0.35;0.05;0.35" dur="3.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="170" cy="140" r="1" fill="white" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="60" cy="170" r="1.5" fill="white" opacity="0.25">
              <animate attributeName="opacity" values="0.25;0.05;0.25" dur="3s" repeatCount="indefinite" />
            </circle>
          </svg>
        );

      case 'bolt':
        return (
          <svg viewBox="0 0 200 200" style={{width: '100%', height: '100%'}}>
            <defs>
              <linearGradient id="ob-g2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="ob-g2b" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
              <filter id="ob-glow2">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* Background circle/device outline */}
            <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth="2" strokeDasharray="8 6">
              <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="30s" repeatCount="indefinite" />
            </circle>
            <circle cx="100" cy="100" r="45" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="1.5">
              <animateTransform attributeName="transform" type="rotate" from="360 100 100" to="0 100 100" dur="25s" repeatCount="indefinite" />
            </circle>
            {/* Phone outline */}
            <rect x="72" y="55" width="56" height="90" rx="10" fill="rgba(13,13,20,0.8)" stroke="url(#ob-g2)" strokeWidth="2.5" />
            {/* Screen content bars */}
            <rect x="80" y="72" width="28" height="4" rx="2" fill="url(#ob-g2b)" opacity="0.6">
              <animate attributeName="width" values="28;35;28" dur="3s" repeatCount="indefinite" />
            </rect>
            <rect x="80" y="80" width="20" height="3" rx="1.5" fill="rgba(96,165,250,0.3)" />
            <rect x="80" y="87" width="32" height="3" rx="1.5" fill="rgba(96,165,250,0.2)" />
            {/* App grid dots */}
            <circle cx="84" cy="100" r="3.5" fill="url(#ob-g2)" opacity="0.7" />
            <circle cx="96" cy="100" r="3.5" fill="url(#ob-g2b)" opacity="0.5" />
            <circle cx="108" cy="100" r="3.5" fill="url(#ob-g2)" opacity="0.6" />
            <circle cx="120" cy="100" r="3.5" fill="url(#ob-g2b)" opacity="0.4" />
            <circle cx="84" cy="112" r="3.5" fill="url(#ob-g2b)" opacity="0.5" />
            <circle cx="96" cy="112" r="3.5" fill="url(#ob-g2)" opacity="0.65" />
            <circle cx="108" cy="112" r="3.5" fill="url(#ob-g2b)" opacity="0.45" />
            <circle cx="120" cy="112" r="3.5" fill="url(#ob-g2)" opacity="0.55" />
            {/* Home bar */}
            <rect x="90" y="136" width="20" height="3" rx="1.5" fill="rgba(103,232,249,0.4)" />
            {/* Lightning bolt */}
            <g filter="url(#ob-glow2)">
              <polygon points="136,52 120,95 133,95 116,145 148,85 133,85 146,52" fill="url(#ob-g2)">
                <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />
              </polygon>
            </g>
            {/* Speed lines */}
            <line x1="45" y1="80" x2="65" y2="80" stroke="rgba(34,211,238,0.25)" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="x1" values="45;35;45" dur="2s" repeatCount="indefinite" />
            </line>
            <line x1="40" y1="100" x2="62" y2="100" stroke="rgba(59,130,246,0.2)" strokeWidth="1.5" strokeLinecap="round">
              <animate attributeName="x1" values="40;30;40" dur="2.5s" repeatCount="indefinite" />
            </line>
            <line x1="50" y1="120" x2="65" y2="120" stroke="rgba(34,211,238,0.15)" strokeWidth="1.5" strokeLinecap="round">
              <animate attributeName="x1" values="50;42;50" dur="1.8s" repeatCount="indefinite" />
            </line>
            {/* Floating dots */}
            <circle cx="155" cy="65" r="2" fill="#67e8f9" opacity="0.4">
              <animate attributeName="cy" values="65;58;65" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="48" cy="55" r="1.5" fill="#60a5fa" opacity="0.3">
              <animate attributeName="cy" values="55;48;55" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="160" cy="130" r="1.5" fill="#22d3ee" opacity="0.3">
              <animate attributeName="cy" values="130;124;130" dur="3.5s" repeatCount="indefinite" />
            </circle>
          </svg>
        );

      case 'stars':
        return (
          <svg viewBox="0 0 200 200" style={{width: '100%', height: '100%'}}>
            <defs>
              <linearGradient id="ob-g3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="ob-g3b" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e879f9" />
                <stop offset="100%" stopColor="#f472b6" />
              </linearGradient>
              <filter id="ob-glow3">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* Concentric rings */}
            <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(192,132,252,0.1)" strokeWidth="1.5">
              <animate attributeName="r" values="70;75;70" dur="5s" repeatCount="indefinite" />
            </circle>
            <circle cx="100" cy="100" r="50" fill="none" stroke="rgba(236,72,153,0.08)" strokeWidth="1">
              <animate attributeName="r" values="50;54;50" dur="4s" repeatCount="indefinite" />
            </circle>
            {/* Central compass/explore symbol */}
            <g filter="url(#ob-glow3)">
              {/* Main globe */}
              <circle cx="100" cy="100" r="32" fill="none" stroke="url(#ob-g3)" strokeWidth="2.5" />
              <ellipse cx="100" cy="100" rx="32" ry="14" fill="none" stroke="url(#ob-g3b)" strokeWidth="1.5" opacity="0.6" />
              <ellipse cx="100" cy="100" rx="14" ry="32" fill="none" stroke="url(#ob-g3b)" strokeWidth="1.5" opacity="0.4" />
              {/* Meridian line */}
              <line x1="68" y1="100" x2="132" y2="100" stroke="url(#ob-g3)" strokeWidth="1" opacity="0.3" />
              <line x1="100" y1="68" x2="100" y2="132" stroke="url(#ob-g3)" strokeWidth="1" opacity="0.3" />
            </g>
            {/* Orbiting star 1 */}
            <g>
              <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="8s" repeatCount="indefinite" />
              <polygon points="100,40 103,48 111,48 105,53 107,61 100,56 93,61 95,53 89,48 97,48" fill="url(#ob-g3)" opacity="0.9">
                <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2s" repeatCount="indefinite" />
              </polygon>
            </g>
            {/* Orbiting star 2 */}
            <g>
              <animateTransform attributeName="transform" type="rotate" from="120 100 100" to="480 100 100" dur="10s" repeatCount="indefinite" />
              <polygon points="100,45 102,50 107,50 103,53 104,58 100,55 96,58 97,53 93,50 98,50" fill="url(#ob-g3b)" opacity="0.7">
                <animate attributeName="opacity" values="0.7;0.3;0.7" dur="3s" repeatCount="indefinite" />
              </polygon>
            </g>
            {/* Orbiting star 3 */}
            <g>
              <animateTransform attributeName="transform" type="rotate" from="240 100 100" to="600 100 100" dur="12s" repeatCount="indefinite" />
              <polygon points="100,50 102,54 106,54 103,57 104,61 100,58 96,61 97,57 94,54 98,54" fill="#f9a8d4" opacity="0.6">
                <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2.5s" repeatCount="indefinite" />
              </polygon>
            </g>
            {/* Sparkle particles */}
            <circle cx="145" cy="55" r="2.5" fill="#e879f9" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.1;0.5" dur="3s" repeatCount="indefinite" />
              <animate attributeName="r" values="2.5;1.5;2.5" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="55" cy="60" r="2" fill="#f472b6" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.05;0.4" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="50" cy="140" r="1.5" fill="#c084fc" opacity="0.35">
              <animate attributeName="opacity" values="0.35;0.05;0.35" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="155" cy="145" r="2" fill="#f9a8d4" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.05;0.3" dur="3.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="40" cy="95" r="1.5" fill="#e879f9" opacity="0.25">
              <animate attributeName="opacity" values="0.25;0.05;0.25" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="165" cy="100" r="1" fill="#f472b6" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.08;0.3" dur="4.5s" repeatCount="indefinite" />
            </circle>
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: '#0a0a12' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated background gradient overlay */}
      <div
        className="absolute inset-0 transition-all duration-700 ease-out pointer-events-none"
        style={{
          background: currentPage.gradient,
          opacity: 0.15,
        }}
      />

      {/* Floating ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 4 + Math.random() * 6,
              height: 4 + Math.random() * 6,
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              background: currentPage.accentGlow,
              opacity: 0.3 + Math.random() * 0.3,
              animation: `ob-float ${3 + Math.random() * 4}s ease-in-out infinite alternate`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Skip button */}
      {page < pages.length - 1 && (
        <button
          onClick={finish}
          className="absolute top-0 right-0 z-10 ob-text-white-40 text-sm font-semibold transition-colors"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 16px) + 16px)', paddingRight: 20 }}
        >
          Skip
        </button>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)' }}>

        {/* Illustration container */}
        <div
          className="relative transition-all duration-500 ease-out"
          style={{
            width: 220,
            height: 220,
            marginBottom: 32,
            opacity: animating ? 0 : 1,
            transform: animating
              ? `translateX(${direction * -60}px) scale(0.9)`
              : 'translateX(0) scale(1)',
          }}
        >
          {/* Glow behind illustration */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-700"
            style={{
              background: `radial-gradient(circle at center, ${currentPage.accentGlow} 0%, transparent 70%)`,
              transform: 'scale(1.3)',
              filter: 'blur(20px)',
            }}
          />
          <div className="relative z-10">
            {renderIllustration(currentPage.icon)}
          </div>
        </div>

        {/* Text content */}
        <div
          className="text-center max-w-xs transition-all duration-500 ease-out"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating
              ? `translateX(${direction * -40}px)`
              : 'translateX(0)',
          }}
        >
          <h1
            className="text-3xl font-black tracking-tight mb-2"
            style={{
              color: '#ffffff',
            }}
          >
            {currentPage.title}
          </h1>
          <p className="text-sm font-semibold mb-3 tracking-wide uppercase" style={{letterSpacing:'0.08em', color: '#ffffff'}}>
            {currentPage.subtitle}
          </p>
          <p className="text-sm leading-relaxed" style={{color: 'rgba(255,255,255,0.8)'}}>
            {currentPage.description}
          </p>
        </div>
      </div>

      {/* Bottom section: dots + button */}
      <div className="px-8 pb-12 flex flex-col items-center gap-8" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 48px)' }}>

        {/* Page indicators */}
        <div className="flex items-center gap-3">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="transition-all duration-300 ease-out rounded-full"
              style={{
                width: i === page ? 28 : 8,
                height: 8,
                background: i === page ? currentPage.gradient : 'rgba(255,255,255,0.15)',
                boxShadow: i === page ? `0 0 12px ${currentPage.accentGlow}` : 'none',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>

        {/* Action button */}
        <button
          onClick={next}
          className="w-full max-w-xs py-4 rounded-2xl ob-text-white font-bold text-base tracking-wide transition-all duration-300 active:scale-95"
          style={{
            background: currentPage.gradient,
            boxShadow: `0 8px 32px ${currentPage.accentGlow}, 0 2px 8px rgba(0,0,0,0.3)`,
          }}
        >
          {page === pages.length - 1 ? 'Get Started' : 'Continue'}
        </button>
      </div>

      {/* CSS Animation keyframes */}
      <style>{`
        @keyframes ob-float {
          0% { transform: translateY(0px) scale(1); }
          100% { transform: translateY(-20px) scale(1.2); }
        }
        .ob-text-white { color: #ffffff !important; }
        .ob-text-white-40 { color: rgba(255,255,255,0.4) !important; }
        .ob-text-white-40:hover { color: rgba(255,255,255,0.7) !important; }
      `}</style>
    </div>
  );
}
