// ── ROOT APP ──────────────────────────────────────────────────────────────────
function AppShell() {
  const { screen } = useApp();

  const screenMap = {
    apps:      <AppsScreen />,
    games:     <GamesScreen />,
    home:      <AppsScreen />,   // backward-compat alias
    explore:   <ExploreScreen />,
    detail:    <AppDetailScreen />,
    viewer:    <AppViewerScreen />,
    workspace: <WorkspaceScreen />,
    search:    <SearchScreen />,
    recent:    <RecentScreen />,
    profile:   <ProfileScreen />,
  };

  return (
    <div className="relative w-full h-full bg-bg overflow-hidden" style={{ maxWidth: 480, margin: '0 auto' }}>
      {screenMap[screen] || <AppsScreen />}
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
