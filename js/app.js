// ── SCREEN WRAPPER WITH SWIPE GESTURE ──────────────────────────────────────────
function ScreenWrapper({ children, isTop, canGoBack, goBack }) {
  const wrapperRef = React.useRef(null);
  const startX = React.useRef(0);
  const startY = React.useRef(0);
  const currentX = React.useRef(0);
  const isSwiping = React.useRef(false);

  const handleTouchStart = (e) => {
    if (!isTop || !canGoBack) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isSwiping.current = false;
    if (wrapperRef.current) {
      wrapperRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e) => {
    if (!isTop || !canGoBack) return;
    const deltaX = e.touches[0].clientX - startX.current;
    const deltaY = e.touches[0].clientY - startY.current;
    
    // Only trigger swipe if horizontal movement is greater than vertical
    // and starting from the left edge (e.g., < 40px)
    if (!isSwiping.current) {
      if (startX.current > 40) return;
      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 5) {
        isSwiping.current = true;
      }
    }

    if (isSwiping.current && deltaX > 0) {
      // Don't call preventDefault() here as it might cause passive listener issues
      currentX.current = deltaX;
      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `translateX(${deltaX}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    
    if (wrapperRef.current) {
      wrapperRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
      if (currentX.current > window.innerWidth / 3) {
        // Go back
        wrapperRef.current.style.transform = `translateX(100%)`;
        setTimeout(() => {
          goBack();
        }, 300);
      } else {
        // Snap back
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
  const { history, goBack } = useApp();

  const getScreenComponent = (frame) => {
    const props = frame.params || {};
    switch (frame.id) {
      case 'apps':      return <AppsScreen {...props} />;
      case 'games':     return <GamesScreen {...props} />;
      case 'home':      return <AppsScreen {...props} />;
      case 'explore':   return <ExploreScreen {...props} />;
      case 'detail':    return <AppDetailScreen {...props} />;
      case 'viewer':    return <AppViewerScreen {...props} />;
      case 'search':    return <SearchScreen {...props} />;
      case 'recent':    return <RecentScreen {...props} />;
      case 'profile':   return <ProfileScreen {...props} />;
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
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
