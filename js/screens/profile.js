// ── PROFILE SCREEN ────────────────────────────────────────────────────────────
var { useState } = React;

function ProfileScreen() {
  var { savedApps, folders, createFolder, moveAppToFolder, removeAppFromFolder, deleteFolder, toggleSaveApp, go, openDetail, user, supabase, signOut, userProfile, updateProfileName, t, uploadAvatar, logActivity, launchApp } = useApp();
  
  const [isUploading, setIsUploading] = useState(false);
  
  const [mySubmissions, setMySubmissions] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  
  React.useEffect(() => {
    if (user && supabase) {
      const fetchSubs = async () => {
        var { data: apps } = await supabase.from('apps').select('*').eq('user_id', user.id);
        var { data: games } = await supabase.from('games').select('*').eq('user_id', user.id);
        setMySubmissions([...(apps||[]), ...(games||[])]);
      };
      fetchSubs();
    }
  }, [user, supabase]);

  const onAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const { publicUrl, error } = await uploadAvatar(file);
    setIsUploading(false);
    if (!error) {
      logActivity('avatar_update', null, { url: publicUrl });
    }
  };

  const personalStats = [
    { label: t('my_apps'), count: savedApps.length, icon: '📦' },
    { label: t('new_folder'), count: folders.length, icon: '📁' },
    { label: t('my_submissions'), count: mySubmissions.length, icon: '🚀' },
  ];

  const { liveApps, liveGames } = useApp();
  const platformStats = [
    { label: t('apps'), count: liveApps.length, icon: '📱' },
    { label: t('games_nav'), count: liveGames.length, icon: '🎮' },
    { label: 'Users', count: '10K+', icon: '👥' },
  ];

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedAppsForFolder, setSelectedAppsForFolder] = useState([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeFolderView, setActiveFolderView] = useState(null); // folder id or null
  const [movingAppId, setMovingAppId] = useState(null);

  const menuItems = [
    { icon: '⚙️', label: t('settings'),      badge: null,  action: () => go('settings') },
    { icon: '❓', label: t('help'),           badge: null, action: () => go('help') },
    { icon: 'ℹ️', label: t('about'),          badge: null,  action: () => go('about') },
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
      if (app.gameCategory) {
        launchApp(app);
      } else {
        openDetail(app);
      }
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
        <h1 className="text-white font-extrabold text-xl mt-1">{t('profile')}</h1>
        <div className="flex flex-col items-center gap-2">
          <button onClick={() => go('settings')} className="tap w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-xl">⚙️</button>
          {!user && (
            <button onClick={() => go('auth')} className="tap bg-accent text-white text-[13px] font-bold px-3.5 py-1.5 rounded-full shadow-[0_0_20px_rgba(124,106,247,0.4)] whitespace-nowrap">
              {t('sign_in')}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-sb pb-28">

        {/* ── User Card ── */}
        {user ? (
          <div className="px-5 py-5 flex items-center gap-4">
            <div 
              onClick={() => document.getElementById('avatar-input').click()}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-violet-400 flex items-center justify-center text-3xl text-white font-bold flex-shrink-0 relative overflow-hidden tap cursor-pointer border-2 border-accent/20 group">
              {isUploading ? (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : null}
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} className="w-full h-full object-cover" />
              ) : (
                <span>{userProfile?.display_name ? userProfile.display_name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}</span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] uppercase font-black tracking-tighter">Edit</div>
            </div>
            <input type="file" id="avatar-input" className="hidden" accept="image/*" onChange={onAvatarChange} />
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input type="text" autoFocus value={editNameValue} onChange={e => setEditNameValue(e.target.value)} className="bg-surface border border-border text-white text-sm rounded-lg px-2 py-1 w-28 outline-none focus:border-accent" placeholder={t('display_name')} />
                  <button onClick={() => { if(editNameValue.trim()) updateProfileName(editNameValue.trim()); setIsEditingName(false); }} className="text-accent text-xs font-bold px-2 py-1 bg-accent/10 rounded-md">{t('save')}</button>
                  <button onClick={() => setIsEditingName(false)} className="text-muted text-xs hover:text-white px-1">{t('cancel')}</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-white font-extrabold text-lg truncate max-w-[150px]">{userProfile?.display_name || user.email.split('@')[0]}</span>
                  <button onClick={() => { setEditNameValue(userProfile?.display_name || ''); setIsEditingName(true); }} className="text-muted hover:text-white text-xs p-1">✎</button>
                  <span className="pill bg-accent text-white text-[10px] px-2 py-0.5">Pro</span>
                </div>
              )}
              <p className="text-muted text-sm mt-0.5 truncate max-w-[200px]">{user.email}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <button 
                  onClick={() => go('store')}
                  className="tap inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-full text-xs font-black shadow-sm"
                >
                  <ZCoinIcon size={14} /> {userProfile?.zcoins ?? 0} ZCoins
                </button>
                <button 
                  onClick={() => go('gamer-profile')}
                  className="tap inline-flex items-center gap-1.5 px-3 py-1 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/20 rounded-full text-xs font-black shadow-sm"
                >
                  🎮 Gamer Profile
                </button>
              </div>
            </div>
            <button onClick={signOut} className="tap px-3 py-1.5 bg-red-500/10 text-red-500 rounded-full text-xs font-bold border border-red-500/20">{t('sign_out')}</button>
          </div>
        ) : (
          <div className="px-5 py-5 flex items-center justify-between">
            <div>
              <h2 className="text-white font-extrabold text-lg">Guest User</h2>
              <p className="text-muted text-sm">Sign in to sync your data</p>
              <div className="mt-1.5 flex items-center gap-2">
                <button 
                  onClick={() => go('store')}
                  className="tap inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-full text-xs font-black shadow-sm"
                >
                  <ZCoinIcon size={14} /> {userProfile?.zcoins ?? 0} ZCoins
                </button>
                <button 
                  onClick={() => go('gamer-profile')}
                  className="tap inline-flex items-center gap-1.5 px-3 py-1 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/20 rounded-full text-xs font-black shadow-sm"
                >
                  🎮 Gamer Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Quick Stats ── */}
        <div className="px-5 grid grid-cols-3 gap-3 mb-6">
          {(user ? personalStats : platformStats).map(s => (
            <div key={s.label} className="bg-card border border-border p-3 rounded-2xl text-center shadow-sm">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-white font-black text-sm">{s.count}</div>
              <div className="text-muted text-[9px] uppercase tracking-tighter font-bold">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── My Submissions (My Games) ── */}
        <div className="px-5 mt-2 mb-8">
          <h2 className="text-white text-lg font-bold mb-4">{t('my_submissions')}</h2>
          
          {!user ? (
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center">
              <span className="text-4xl mb-3">🔒</span>
              <div className="text-white font-bold text-sm mb-1">{t('login_required')}</div>
              <div className="text-muted text-xs mb-4">{t('login_sub')}</div>
              <button onClick={() => go('auth')} className="tap bg-accent text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(124,106,247,0.4)]">
                {t('login_signup')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {mySubmissions.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center">
                  <span className="text-3xl mb-2">🚀</span>
                  <div className="text-white font-bold text-sm">{t('no_submissions')}</div>
                  <div className="text-muted text-xs mt-1">{t('no_submissions_sub')}</div>
                </div>
              ) : (
                mySubmissions.map(sub => (
                  <div 
                    key={sub.id} 
                    onClick={() => setSelectedSub(sub)}
                    className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-white/10 transition-all active:scale-[0.99] tap"
                  >
                    <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {sub.icon_url || sub.featured_image ? <img src={sub.icon_url || sub.featured_image} className="w-full h-full object-cover" /> : <span className="text-xl">{sub.emoji || '🎮'}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-sm truncate">{sub.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-muted text-[10px] uppercase tracking-widest">{sub.region || 'Global'}</span>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            const newRegion = prompt('Enter Region (Global, PK, US, UK, AE):', sub.region || 'Global');
                            if (newRegion && newRegion !== sub.region) {
                              const { error } = await supabase.from(sub.gameCategory ? 'games' : 'apps').update({ region: newRegion }).eq('id', sub.id);
                              if (!error) window.location.reload();
                            }
                          }}
                          className="text-accent text-[9px] font-bold hover:underline">
                          Change
                        </button>
                      </div>
                      {(sub.status === 'rejected' || sub.status === 'deleted') && sub.rejection_comment && (
                        <div className="text-red-400 text-[10px] mt-0.5 leading-tight line-clamp-2">{sub.rejection_comment}</div>
                      )}
                    </div>
                    <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      sub.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                      sub.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                      sub.status === 'deleted' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
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
              {t('my_apps')}
              <button onClick={() => setIsEditing(!isEditing)} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isEditing ? 'bg-accent/20 border-accent text-accent' : 'bg-transparent border-white/20 text-white/50'}`}>
                {isEditing ? t('done') : t('edit')}
              </button>
            </h2>
            <button onClick={() => setShowFolderModal(true)} className="tap text-accent text-sm font-bold bg-accent/10 px-3 py-1.5 rounded-full">
              + {t('new_folder').split(' ')[1]}
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
                      <div className="text-muted text-xs">{folder.appIds.length} {t('apps_count')}</div>
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
               <div className="text-white font-bold text-sm">{t('no_apps_saved')}</div>
               <div className="text-muted text-xs mt-1">{t('no_apps_saved_sub')}</div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-x-3 gap-y-5">
              {unassignedApps.map(app => (
                <div key={app.id} className="relative group flex flex-col items-center">
                  <div 
                    onClick={() => onAppTap(app)} 
                    draggable={isEditing ? "false" : "true"}
                    onDragStart={(e) => handleDragStart(e, app.id)}
                    className={`tap w-full aspect-square rounded-2xl bg-surface border flex items-center justify-center mb-2 overflow-hidden transition-all cursor-pointer relative ${
                      movingAppId === app.id ? 'border-accent glow-purple scale-110' : 'border-border'
                    } ${isEditing && movingAppId !== app.id ? 'jiggle' : ''}`}
                  >
                    <AppLogo app={app} size="md" />
                    {!isEditing && app.gameCategory && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); openDetail(app); }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white text-[11px] font-bold hover:bg-black transition-all tap z-10"
                        title="View Details"
                      >
                        ›
                      </button>
                    )}
                  </div>
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
            <button onClick={() => setActiveFolderView(null)} className="tap text-white font-bold text-base">← {t('back')}</button>
            <h2 className="text-white font-extrabold text-xl">{activeFolder.name}</h2>
            <button onClick={() => setIsEditing(!isEditing)} className={`text-[12px] font-bold px-3 py-1 rounded-full border ${isEditing ? 'bg-accent/20 border-accent text-accent' : 'bg-transparent border-white/20 text-white/50'}`}>
              {isEditing ? t('done') : t('edit')}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6">
            {activeFolderApps.length === 0 ? (
              <div className="text-center text-muted text-sm mt-10">{t('folder_empty')}</div>
            ) : (
              <div className="grid grid-cols-4 gap-x-3 gap-y-5">
                {activeFolderApps.map(app => (
                  <div key={app.id} className="relative group flex flex-col items-center">
                    <div 
                      onClick={() => onAppTap(app)} 
                      className={`tap w-full aspect-square rounded-2xl bg-surface border flex items-center justify-center mb-2 overflow-hidden transition-all cursor-pointer relative ${
                        movingAppId === app.id ? 'border-accent glow-purple scale-110' : 'border-border'
                      } ${isEditing && movingAppId !== app.id ? 'jiggle' : ''}`}
                    >
                      <AppLogo app={app} size="md" />
                      {!isEditing && app.gameCategory && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); openDetail(app); }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white text-[11px] font-bold hover:bg-black transition-all tap z-10"
                          title="View Details"
                        >
                          ›
                        </button>
                      )}
                    </div>
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
            <h3 className="text-white font-bold text-lg mb-4 text-center">{t('new_folder')}</h3>
            <input 
              type="text" 
              placeholder={t('folder_name')} 
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent mb-4 flex-shrink-0"
              autoFocus
            />
            
            {savedApps.length > 0 && (
              <div className="flex-1 overflow-y-auto mb-4 border border-border rounded-xl bg-bg p-2 space-y-1">
                <div className="text-muted text-[10px] font-bold px-2 py-1 uppercase tracking-wider">{t('select_apps')}</div>
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
              <button onClick={() => setShowFolderModal(false)} className="flex-1 py-3 rounded-xl bg-card border border-border text-white font-semibold text-sm">{t('cancel')}</button>
              <button onClick={handleCreateFolder} className="flex-1 py-3 rounded-xl bg-accent text-white font-bold text-sm shadow-[0_0_15px_rgba(107,78,255,0.4)]">{t('create')}</button>
            </div>
          </div>
        </div>
      )}
      {/* ── Submission Details Modal ── */}
      {selectedSub && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedSub(null)}></div>
          <div className="bg-surface border border-border rounded-3xl w-full max-w-[340px] p-6 relative z-10 shadow-2xl slide-up flex flex-col">
            <h3 className="text-white font-bold text-lg mb-2 text-center">Submission Status</h3>
            
            <div className="flex flex-col items-center text-center my-4">
              <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center text-3xl mb-3 overflow-hidden">
                {selectedSub.icon_url || selectedSub.featured_image ? (
                  <img src={selectedSub.icon_url || selectedSub.featured_image} className="w-full h-full object-cover" />
                ) : (
                  <span>{selectedSub.emoji || '🌐'}</span>
                )}
              </div>
              <h4 className="text-white font-extrabold text-base leading-tight">{selectedSub.name}</h4>
              <p className="text-muted text-xs mt-1 truncate max-w-[200px]">{selectedSub.url}</p>
            </div>

            <div className="space-y-4 my-2">
              <div className="flex items-center justify-between text-xs border-b border-border/50 pb-2">
                <span className="text-muted">Status</span>
                <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${
                  selectedSub.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                  selectedSub.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                  selectedSub.status === 'deleted' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                  'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {selectedSub.status || 'pending'}
                </span>
              </div>

              {(selectedSub.status === 'rejected' || selectedSub.status === 'deleted') && selectedSub.rejection_comment && (
                <div className="bg-card border border-border rounded-xl p-3.5">
                  <div className="text-muted text-[9px] font-black uppercase tracking-wider mb-1.5">
                    {selectedSub.status === 'deleted' ? 'Deletion Reason' : 'Rejection Reason'}
                  </div>
                  <p className="text-red-200/90 text-xs leading-relaxed font-medium">
                    {selectedSub.rejection_comment}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              {selectedSub.status === 'rejected' ? (
                <>
                  <button 
                    onClick={() => setSelectedSub(null)} 
                    className="flex-1 py-3 rounded-xl bg-card border border-border text-white font-semibold text-sm"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      const subToEdit = selectedSub;
                      setSelectedSub(null);
                      go('submit', { editItem: subToEdit });
                    }} 
                    className="flex-1 py-3 rounded-xl bg-accent text-white font-bold text-sm shadow-[0_0_15px_rgba(107,78,255,0.4)]"
                  >
                    Resubmit
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setSelectedSub(null)} 
                  className="w-full py-3 rounded-xl bg-card border border-border text-white font-semibold text-sm"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── SETTINGS SCREEN (Already largely localized) ──────────────────────────────────
// I will just ensure "Privacy Policy" and "Terms of Service" are localized now.

function SettingsScreen() {
  var { user, signOut, goBack, userProfile, updateProfileName, t, lang, setLang, theme, setTheme, userRegion, setUserRegion, notificationsEnabled, toggleNotifications } = useApp();
  const [showNameModal, setShowNameModal] = React.useState(false);
  const [newName, setNewName] = React.useState(userProfile?.display_name || '');

  const handleEditName = () => {
    setShowNameModal(true);
  };

  const handleSaveName = () => {
    if (newName.trim()) {
      updateProfileName(newName.trim());
      setShowNameModal(false);
    }
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'zh', label: '中文 (Chinese)' },
    { code: 'de', label: 'Deutsch' },
    { code: 'ur', label: 'اردو (Urdu)' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
    { code: 'ar', label: 'العربية (Arabic)' }
  ];

  const sections = [
    {
      title: t('profile_settings'),
      items: [
        { label: t('display_name'), value: userProfile?.display_name || 'Not set', action: handleEditName },
        { label: t('email'), value: user?.email || 'Guest', action: null },
      ]
    },
    {
      title: t('app_preferences'),
      items: [
        { 
          label: t('dark_mode'), 
          value: theme === 'dark' ? 'Dark' : 'Bright', 
          action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
          isToggle: true,
          toggleState: theme === 'dark'
        },
        { 
          label: t('notifications'), 
          value: notificationsEnabled ? 'Enabled' : 'Disabled', 
          action: toggleNotifications,
          isToggle: true,
          toggleState: notificationsEnabled
        },
        { 
          label: t('language'), 
          value: languages.find(l => l.code === lang)?.label || 'English', 
          isDropdown: true,
          dropdownOptions: languages,
          currentValue: lang,
          action: (e) => setLang(e.target.value)
        },
        { 
          label: t('region'), 
          value: 'Global', 
          isDropdown: true,
          dropdownOptions: [
            { code: 'Global', label: 'Global' },
            { code: 'PK', label: 'Pakistan' },
            { code: 'US', label: 'USA' },
            { code: 'UK', label: 'UK' },
            { code: 'AE', label: 'UAE' }
          ],
          currentValue: userRegion,
          action: (e) => setUserRegion(e.target.value)
        },
      ]
    },
    {
      title: t('account'),
      items: [
        { label: t('privacy_policy'), value: '', action: () => {} },
        { label: t('terms_service'), value: '', action: () => {} },
      ]
    }
  ];

  return (
    <div className="slide-right flex flex-col h-full bg-bg relative">
      <BackHeader title={t('settings')} />
      
      <div className="flex-1 overflow-y-auto no-sb p-5">
        <div className="space-y-8">
          {sections.map(section => (
            <div key={section.title}>
              <h3 className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1">{section.title}</h3>
              <div className="bg-card border border-border rounded-[24px] overflow-hidden">
                {section.items.map((item, i) => (
                  <div key={item.label} className={`w-full flex items-center justify-between px-5 py-4 text-left ${i !== section.items.length - 1 ? 'border-b border-border' : ''}`}>
                    <span className="text-white text-sm font-semibold">{item.label}</span>
                    <div className="flex items-center gap-2">
                      {item.isToggle ? (
                         <button onClick={item.action} className="tap flex items-center gap-2">
                            <span className="text-muted text-xs uppercase font-bold tracking-tighter">{item.value}</span>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${item.toggleState ? 'bg-accent' : 'bg-border'}`}>
                               <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${item.toggleState ? 'translate-x-5' : ''}`} />
                            </div>
                         </button>
                      ) : item.isDropdown ? (
                        <select 
                          value={item.currentValue} 
                          onChange={item.action}
                          className="bg-card border border-border rounded-lg text-muted text-[10px] font-bold px-2 py-1 focus:outline-none cursor-pointer"
                        >
                          {item.dropdownOptions.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                        </select>
                      ) : (
                        <button onClick={item.action} disabled={!item.action} className={`flex items-center gap-2 ${item.action ? 'tap' : 'cursor-default'}`}>
                          <span className="text-muted text-xs">{item.value}</span>
                          {item.action && <span className="text-muted text-lg">›</span>}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {user && (
            <div className="pt-4">
              <button onClick={signOut} className="tap w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-sm">
                {t('sign_out')}
              </button>
            </div>
          )}

          <div className="text-center pt-8 pb-12">
            <p className="text-muted text-[10px] font-bold uppercase tracking-widest">{t('version')} 1.0.0</p>
            <p className="text-muted/40 text-[9px] mt-1">© 2026 ZeroApp Systems</p>
          </div>
        </div>
      </div>

      {/* ── Name Modal ── */}
      {showNameModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNameModal(false)}></div>
          <div className="bg-surface border border-border rounded-3xl w-full max-w-[340px] p-6 relative z-10 shadow-2xl slide-up">
            <h3 className="text-white font-bold text-lg mb-4 text-center">{t('display_name')}</h3>
            <input 
              type="text" 
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent mb-6"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowNameModal(false)} className="flex-1 py-3 rounded-xl bg-card border border-border text-white font-semibold text-sm">{t('cancel')}</button>
              <button onClick={handleSaveName} className="flex-1 py-3 rounded-xl bg-accent text-white font-bold text-sm shadow-[0_0_15px_rgba(107,78,255,0.4)]">{t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── HELP & SUPPORT SCREEN ───────────────────────────────────────────────────
function HelpSupportScreen() {
  var { goBack, t } = useApp();

  const faqs = [
    { q: t('faq_1_q'), a: t('faq_1_a') },
    { q: t('faq_2_q'), a: t('faq_2_a') },
    { q: t('faq_3_q'), a: t('faq_3_a') },
    { q: t('faq_4_q'), a: t('faq_4_a') }
  ];

  return (
    <div className="slide-right flex flex-col h-full bg-bg">
      <BackHeader title={t('help')} />
      
      <div className="flex-1 overflow-y-auto no-sb p-5">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-accent/10 rounded-[40px] flex items-center justify-center text-4xl mx-auto mb-4 border border-accent/20 shadow-2xl">🤝</div>
          <h2 className="text-white text-xl font-black">{t('faq_title')}</h2>
          <p className="text-muted text-sm mt-1">{t('faq_sub')}</p>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-muted text-[10px] font-black uppercase tracking-widest mb-3 ml-1">{t('faq')}</h3>
            <div className="space-y-3">
              {faqs.map(faq => (
                <div key={faq.q} className="bg-card border border-border rounded-2xl p-4">
                  <h4 className="text-white text-sm font-bold mb-2">{faq.q}</h4>
                  <p className="text-muted text-xs leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-muted text-[10px] font-black uppercase tracking-widest mb-3 ml-1">{t('contact_us')}</h3>
            <div className="bg-card border border-border rounded-[24px] overflow-hidden">
              <button className="w-full flex items-center justify-between px-5 py-4 text-left border-b border-border tap">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📧</span>
                  <span className="text-white text-sm font-semibold">{t('email_support')}</span>
                </div>
                <span className="text-muted text-lg">›</span>
              </button>
              <button className="w-full flex items-center justify-between px-5 py-4 text-left tap">
                <div className="flex items-center gap-3">
                  <span className="text-lg">💬</span>
                  <span className="text-white text-sm font-semibold">{t('live_chat')}</span>
                </div>
                <span className="text-muted text-lg">›</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ABOUT SCREEN ────────────────────────────────────────────────────────────
function AboutScreen() {
  var { goBack, t } = useApp();

  return (
    <div className="slide-right flex flex-col h-full bg-bg">
      <BackHeader title={t('about')} />
      
      <div className="flex-1 overflow-y-auto no-sb p-5">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-accent to-violet-500 rounded-[40px] flex items-center justify-center text-5xl mx-auto mb-6 shadow-2xl glow-purple border border-white/20">⚡</div>
          <h1 className="text-white text-3xl font-black tracking-tighter">ZeroApp</h1>
          <p className="text-muted text-sm mt-1 font-bold uppercase tracking-widest opacity-60">Version 1.0.0 (Stable)</p>
        </div>

        <div className="space-y-8 px-2">
          <div>
            <h3 className="text-white text-lg font-bold mb-3">{t('vision')}</h3>
            <p className="text-muted text-sm leading-relaxed">
              {t('vision_desc')}
            </p>
          </div>

          <div>
            <h3 className="text-white text-lg font-bold mb-3">{t('key_features')}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-accent text-xl">🚀</span>
                <div>
                  <div className="text-white text-sm font-bold">{t('zero_install')}</div>
                  <div className="text-muted text-xs mt-0.5">{t('zero_install_desc')}</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent text-xl">📱</span>
                <div>
                  <div className="text-white text-sm font-bold">{t('multi_tasking')}</div>
                  <div className="text-muted text-xs mt-0.5">{t('multi_tasking_desc')}</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent text-xl">☁️</span>
                <div>
                  <div className="text-white text-sm font-bold">{t('cloud_sync')}</div>
                  <div className="text-muted text-xs mt-0.5">{t('cloud_sync_desc')}</div>
                </div>
              </li>
            </ul>
          </div>

          <div className="pt-8 border-t border-border">
            <h3 className="text-white text-lg font-bold mb-4 text-center">{t('stay_connected')}</h3>
            <div className="flex justify-center gap-6">
              <button className="tap w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-xl">🌐</button>
              <button className="tap w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-xl">🐦</button>
              <button className="tap w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-xl">🐙</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ProfileScreen = ProfileScreen;
window.SettingsScreen = SettingsScreen;
window.HelpSupportScreen = HelpSupportScreen;
window.AboutScreen = AboutScreen;
