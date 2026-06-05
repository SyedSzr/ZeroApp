// ── SCREEN WRAPPER WITH SWIPE GESTURE ──────────────────────────────────────────
function ScreenWrapper({ children, isTop, canGoBack, goBack }) {
  const wrapperRef = React.useRef(null);
  const startX = React.useRef(0);
  const startY = React.useRef(0);
  const currentX = React.useRef(0);
  const swipeSide = React.useRef(null); // 'left' | 'right' | null

  const handleTouchStart = (e) => {
    if (!isTop || !canGoBack) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swipeSide.current = null;
    if (wrapperRef.current) {
      wrapperRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e) => {
    if (!isTop || !canGoBack) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const deltaX = x - startX.current;
    const deltaY = y - startY.current;
    const width = window.innerWidth;
    
    if (!swipeSide.current) {
      if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (startX.current < 50 && deltaX > 0) {
          swipeSide.current = 'left';
          if (navigator.vibrate) navigator.vibrate(10); // Subtle haptic start
        } else if (startX.current > width - 50 && deltaX < 0) {
          swipeSide.current = 'right';
          if (navigator.vibrate) navigator.vibrate(10); // Subtle haptic start
        }
      }
    }

    if (swipeSide.current) {
      currentX.current = deltaX;
      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `translateX(${deltaX}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!swipeSide.current) return;
    const side = swipeSide.current;
    swipeSide.current = null;
    
    if (wrapperRef.current) {
      wrapperRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
      const width = window.innerWidth;
      const threshold = width / 4;
      
      const triggered = (side === 'left' && currentX.current > threshold) || 
                        (side === 'right' && currentX.current < -threshold);

      if (triggered) {
        if (navigator.vibrate) navigator.vibrate(200); // 0.2s vibration as requested
        wrapperRef.current.style.transform = side === 'left' ? `translateX(100%)` : `translateX(-100%)`;
        setTimeout(() => {
          goBack();
        }, 300);
      } else {
        wrapperRef.current.style.transform = `translateX(0px)`;
      }
    }
    currentX.current = 0;
  };

  return (
    <div 
      ref={wrapperRef}
      className={`absolute inset-0 w-full h-full bg-bg shadow-2xl slide-right-fast ${!isTop ? 'pointer-events-none' : ''}`}
      style={{ zIndex: isTop ? 10 : 0 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
function AppShell() {
  var { history, goBack } = useApp();

  const getScreenComponent = (frame) => {
    const props = frame.params || {};
    switch (frame.id) {
      case 'apps':      return <GamesDiscoveryView {...props} />;
      case 'games':     return <GamesScreen {...props} />;
      case 'home':      return <GamesDiscoveryView {...props} />;
      case 'explore':   return <ExploreScreen {...props} />;
      case 'detail':    return <AppDetailScreen {...props} />;
      case 'viewer':    return <AppViewerScreen {...props} />;
      case 'search':    return <SearchScreen {...props} />;
      case 'recent':    return <RecentScreen {...props} />;
      case 'profile':   return <ProfileScreen {...props} />;
      case 'submit':    return <SubmitScreen {...props} />;
      case 'auth':      return <AuthScreen {...props} />;
      case 'settings':  return <SettingsScreen {...props} />;
      case 'help':      return <HelpSupportScreen {...props} />;
      case 'about':     return <AboutScreen {...props} />;
      default:          return <AppsScreen {...props} />;
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden" style={{ maxWidth: 480, margin: '0 auto' }}>
      {history.map((frame, index) => (
        <ScreenWrapper 
          key={frame.key} 
          isTop={index === history.length - 1} 
          canGoBack={index > 0} 
          goBack={goBack}
        >
          {getScreenComponent(frame)}
        </ScreenWrapper>
      ))}

      <TaskLayer />
      <TaskDock />
      
      {['apps', 'games', 'explore', 'profile'].includes(history[history.length-1].id) && (
        <BottomNav active={history[history.length-1].id} />
      )}
    </div>
  );
}

function App() {
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleError = (e) => setError(e.error || e.reason || e.message);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-bg p-8 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-white text-lg font-bold mb-2">Something went wrong</h2>
        <p className="text-muted text-xs mb-6">{error.toString()}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-accent text-white rounded-xl text-sm font-bold">Reload App</button>
      </div>
    );
  }

  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
