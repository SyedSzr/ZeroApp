// ── PROFILE SCREEN ────────────────────────────────────────────────────────────
const { useState } = React;

function ProfileScreen() {
  const { favorites, savedApps, folders, createFolder, moveAppToFolder, removeAppFromFolder, deleteFolder, toggleSaveApp, go, openDetail, user, supabase, signOut, userProfile, updateProfileName } = useApp();
  
  const [mySubmissions, setMySubmissions] = useState([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  
  React.useEffect(() => {
    if (user && supabase) {
      const fetchSubs = async () => {
        const { data: apps } = await supabase.from('apps').select('*').eq('user_id', user.id);
        const { data: games } = await supabase.from('games').select('*').eq('user_id', user.id);
        setMySubmissions([...(apps||[]), ...(games||[])]);
      };
      fetchSubs();
    }
  }, [user, supabase]);

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedAppsForFolder, setSelectedAppsForFolder] = useState([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeFolderView, setActiveFolderView] = useState(null); // folder id or null
  const [movingAppId, setMovingAppId] = useState(null);

  const menuItems = [
    { icon: '⭐', label: 'Favorites',     badge: null,  action: () => {} },
    { icon: '⚙️', label: 'Settings',      badge: null,  action: () => {} },
    { icon: '❓', label: 'Help & Support', badge: null, action: () => {} },
    { icon: 'ℹ️', label: 'About ZeroApp', badge: null,  action: () => {} },
  ];

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim(), selectedAppsForFolder);
      setNewFolderName('');
      setSelectedAppsForFolder([]);
      setShowFolderModal(false);
    }
  };

  // Drag and Drop (Desktop)
  const handleDragStart = (e, appId) => {
    e.dataTransfer.setData('appId', appId);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDrop = (e, folderId) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('appId');
    if (appId) moveAppToFolder(appId, folderId);
  };

  // Tap-to-Move (Mobile Friendly)
  const onAppTap = (app) => {
    if (isEditing) {
      setMovingAppId(movingAppId === app.id ? null : app.id);
    } else {
      openDetail(app);
    }
  };

  const onFolderTap = (folderId) => {
    if (isEditing && movingAppId) {
      moveAppToFolder(movingAppId, folderId);
      setMovingAppId(null);
    } else {
      setActiveFolderView(folderId);
    }
  };

  // Only show apps that are NOT inside any folder in the main grid
  const appsInAnyFolder = folders.flatMap(f => f.appIds);
  const unassignedApps = savedApps.filter(app => !appsInAnyFolder.includes(app.id));

  // Active folder data
  const activeFolder = activeFolderView ? folders.find(f => f.id === activeFolderView) : null;
  const activeFolderApps = activeFolder ? savedApps.filter(app => activeFolder.appIds.includes(app.id)) : [];

  return (
    <div className="slide-up flex flex-col h-full bg-bg relative">

      {/* ── Header ── */}
      <div className="pt-safe px-5 flex items-start justify-between py-4 border-b border-border bg-surface flex-shrink-0">
        <h1 className="text-white font-extrabold text-xl mt-1">Profile</h1>
        <div className="flex flex-col items-center gap-2">
          <button className="tap w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-xl">⚙️</button>
          {!user && (
            <button onClick={() => go('auth')} className="tap bg-accent text-white text-[13px] font-bold px-3.5 py-1.5 rounded-full shadow-[0_0_20px_rgba(124,106,247,0.4)] whitespace-nowrap">
              Sign In
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-sb pb-28">

        {/* ── User Card ── */}
        {user ? (
          <div className="px-5 py-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-violet-400 flex items-center justify-center text-3xl text-white font-bold flex-shrink-0">
              {userProfile?.display_name ? userProfile.display_name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
            </div>
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input type="text" autoFocus value={editNameValue} onChange={e => setEditNameValue(e.target.value)} className="bg-surface border border-border text-white text-sm rounded-lg px-2 py-1 w-28 outline-none focus:border-accent" placeholder="Display Name" />
                  <button onClick={() => { if(editNameValue.trim()) updateProfileName(editNameValue.trim()); setIsEditingName(false); }} className="text-accent text-xs font-bold px-2 py-1 bg-accent/10 rounded-md">Save</button>
                  <button onClick={() => setIsEditingName(false)} className="text-muted text-xs hover:text-white px-1">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-white font-extrabold text-lg truncate max-w-[150px]">{userProfile?.display_name || user.email.split('@')[0]}</span>
                  <button onClick={() => { setEditNameValue(userProfile?.display_name || ''); setIsEditingName(true); }} className="text-muted hover:text-white text-xs p-1">✎</button>
                  <span className="pill bg-accent text-white text-[10px] px-2 py-0.5">Pro</span>
                </div>
              )}
              <p className="text-muted text-sm mt-0.5 truncate max-w-[200px]">{user.email}</p>
            </div>
            <button onClick={signOut} className="tap px-3 py-1.5 bg-red-500/10 text-red-500 rounded-full text-xs font-bold border border-red-500/20">Sign Out</button>
          </div>
        ) : (
          <div className="px-5 py-5 flex items-center justify-between">
            <div>
              <h2 className="text-white font-extrabold text-lg">Guest User</h2>
              <p className="text-muted text-sm">Sign in to sync your data</p>
            </div>
          </div>
        )}

        {/* ── My Submissions (My Games) ── */}
        <div className="px-5 mt-2 mb-8">
          <h2 className="text-white text-lg font-bold mb-4">My Submissions</h2>
          
          {!user ? (
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center">
              <span className="text-4xl mb-3">🔒</span>
              <div className="text-white font-bold text-sm mb-1">Login Required</div>
              <div className="text-muted text-xs mb-4">Sign in to view and track your submitted games and apps.</div>
              <button onClick={() => go('auth')} className="tap bg-accent text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(124,106,247,0.4)]">
                Login / Sign Up
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {mySubmissions.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center">
                  <span className="text-3xl mb-2">🚀</span>
                  <div className="text-white font-bold text-sm">No submissions yet</div>
                  <div className="text-muted text-xs mt-1">Click the + button below to submit your first game!</div>
                </div>
              ) : (
                mySubmissions.map(sub => (
                  <div key={sub.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {sub.icon_url || sub.featured_image ? <img src={sub.icon_url || sub.featured_image} className="w-full h-full object-cover" /> : <span className="text-xl">{sub.emoji || '🎮'}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-sm truncate">{sub.name}</div>
                      {sub.status === 'rejected' && sub.rejection_comment && (
                        <div className="text-red-400 text-[10px] mt-0.5 leading-tight line-clamp-2">{sub.rejection_comment}</div>
                      )}
                    </div>
                    <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      sub.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                      sub.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                      'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}>
                      {sub.status || 'pending'}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Menu Items (Horizontal) ── */}
        <div className="px-5 mb-6 flex gap-3 overflow-x-auto no-sb">
          {menuItems.map(item => (
            <button key={item.label} onClick={item.action}
              className="tap flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border hover:border-white/20 transition-colors">
              <span>{item.icon}</span>
              <span className="text-white font-semibold text-sm">{item.label}</span>
            </button>
          ))}
        </div>

        {/* ── My Apps Section ── */}
        <div className="px-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-bold flex items-center gap-2">
              My Apps
              <button onClick={() => setIsEditing(!isEditing)} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isEditing ? 'bg-accent/20 border-accent text-accent' : 'bg-transparent border-white/20 text-white/50'}`}>
                {isEditing ? 'Done' : 'Edit'}
              </button>
            </h2>
            <button onClick={() => setShowFolderModal(true)} className="tap text-accent text-sm font-bold bg-accent/10 px-3 py-1.5 rounded-full">
              + Folder
            </button>
          </div>

          {/* Folders Grid */}
          {folders.length > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-3">
              {folders.map(folder => (
                <div key={folder.id} className="relative group">
                  <div 
                    onClick={() => onFolderTap(folder.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, folder.id)}
                    className={`bg-card border ${isEditing ? 'border-dashed border-white/20' : 'border-border'} ${movingAppId ? 'hover:border-accent animate-pulse' : ''} rounded-2xl p-4 flex items-center gap-3 transition-colors cursor-pointer`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-xl">📁</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-sm truncate">{folder.name}</div>
                      <div className="text-muted text-xs">{folder.appIds.length} Apps</div>
                    </div>
                  </div>
                  {isEditing && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }} 
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 border-2 border-bg flex items-center justify-center text-white text-[10px] font-bold z-10 shadow-lg"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Saved Apps Grid */}
          {savedApps.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center">
               <span className="text-4xl mb-3">📱</span>
               <div className="text-white font-bold text-sm">No Apps Saved</div>
               <div className="text-muted text-xs mt-1">Save apps from the Feed or Explore to see them here.</div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-x-3 gap-y-5">
              {unassignedApps.map(app => (
                <div key={app.id} className="relative group flex flex-col items-center">
                  <button 
                    onClick={() => onAppTap(app)} 
                    draggable={isEditing ? "false" : "true"}
                    onDragStart={(e) => handleDragStart(e, app.id)}
                    className={`tap w-full aspect-square rounded-2xl bg-surface border flex items-center justify-center mb-2 overflow-hidden transition-all ${
                      movingAppId === app.id ? 'border-accent glow-purple scale-110' : 'border-border'
                    } ${isEditing && movingAppId !== app.id ? 'jiggle' : ''}`}
                  >
                    <AppLogo app={app} size="md" />
                  </button>
                  <div className="w-full text-center px-0.5">
                    <div className="text-white text-[10px] font-bold truncate leading-tight">{app.name}</div>
                  </div>
                  {isEditing && (
                    <button onClick={() => toggleSaveApp(app)} className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 border-2 border-bg flex items-center justify-center text-white text-[10px] font-bold z-10">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Active Folder Overlay ── */}
      {activeFolderView && activeFolder && (
        <div className="absolute inset-0 z-40 flex flex-col bg-bg slide-up">
          <div className="pt-safe px-5 flex items-center justify-between py-4 border-b border-border bg-surface flex-shrink-0">
            <button onClick={() => setActiveFolderView(null)} className="tap text-white font-bold text-base">← Back</button>
            <h2 className="text-white font-extrabold text-xl">{activeFolder.name}</h2>
            <button onClick={() => setIsEditing(!isEditing)} className={`text-[12px] font-bold px-3 py-1 rounded-full border ${isEditing ? 'bg-accent/20 border-accent text-accent' : 'bg-transparent border-white/20 text-white/50'}`}>
              {isEditing ? 'Done' : 'Edit'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6">
            {activeFolderApps.length === 0 ? (
              <div className="text-center text-muted text-sm mt-10">This folder is empty. Drag apps here to add them!</div>
            ) : (
              <div className="grid grid-cols-4 gap-x-3 gap-y-5">
                {activeFolderApps.map(app => (
                  <div key={app.id} className="relative group flex flex-col items-center">
                    <button onClick={() => onAppTap(app)} className={`tap w-full aspect-square rounded-2xl bg-surface border flex items-center justify-center mb-2 overflow-hidden transition-all ${
                      movingAppId === app.id ? 'border-accent glow-purple scale-110' : 'border-border'
                    } ${isEditing && movingAppId !== app.id ? 'jiggle' : ''}`}>
                      <AppLogo app={app} size="md" />
                    </button>
                    <div className="w-full text-center px-0.5">
                      <div className="text-white text-[10px] font-bold truncate leading-tight">{app.name}</div>
                    </div>
                    {isEditing && (
                      <button onClick={() => removeAppFromFolder(app.id, activeFolder.id)} className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 border-2 border-bg flex items-center justify-center text-white text-[10px] font-bold z-10">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create Folder Modal ── */}
      {showFolderModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFolderModal(false)}></div>
          <div className="bg-surface border border-border rounded-3xl w-full max-w-[340px] p-6 relative z-10 shadow-2xl slide-up flex flex-col max-h-[80vh]">
            <h3 className="text-white font-bold text-lg mb-4 text-center">New Folder</h3>
            <input 
              type="text" 
              placeholder="Folder Name" 
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent mb-4 flex-shrink-0"
              autoFocus
            />
            
            {savedApps.length > 0 && (
              <div className="flex-1 overflow-y-auto mb-4 border border-border rounded-xl bg-bg p-2 space-y-1">
                <div className="text-muted text-[10px] font-bold px-2 py-1 uppercase tracking-wider">Select Apps to include:</div>
                {savedApps.map(app => {
                  const isSelected = selectedAppsForFolder.includes(app.id);
                  return (
                    <div key={app.id} 
                         onClick={() => setSelectedAppsForFolder(prev => isSelected ? prev.filter(id => id !== app.id) : [...prev, app.id])}
                         className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-accent border-accent' : 'border-border'}`}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                      <AppLogo app={app} size="xs" />
                      <span className="text-white text-xs font-semibold">{app.name}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3 mt-auto">
              <button onClick={() => setShowFolderModal(false)} className="flex-1 py-3 rounded-xl bg-card border border-border text-white font-semibold text-sm">Cancel</button>
              <button onClick={handleCreateFolder} className="flex-1 py-3 rounded-xl bg-accent text-white font-bold text-sm shadow-[0_0_15px_rgba(107,78,255,0.4)]">Create</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="profile" />
    </div>
  );
}
