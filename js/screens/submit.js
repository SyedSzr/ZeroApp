// ── SUBMIT SCREEN ───────────────────────────────────────────────────────────
function SubmitScreen(props) {
  const context = useApp();
  if (!context) return null;
  var { supabase, liveCats, goBack, user, userProfile, updateZCoins, go, t } = context;

  const editItem = props?.editItem;
  const isEdit = !!editItem;

  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError]     = React.useState(null);
  const [itemType, setItemType] = React.useState(editItem ? (editItem.gameCategory ? 'game' : 'app') : 'app'); // 'app' or 'game'

  const currentBalance = userProfile?.zcoins ?? 0;
  const canSubmit = isEdit || (currentBalance >= 10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!isEdit && currentBalance < 10) {
      setError(t('insufficient_coins') || 'Insufficient ZCoins! You need 10 ZCoins to upload.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const fd = new FormData(e.target);
    const name = fd.get('name');
    
    // Generate a unique ID (slug style) to avoid constraint violations
    const id = isEdit ? editItem.id : (name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(7));

    try {
      const selectedCat = liveCats.find(c => c.id === fd.get('category'));
      const payload = {
        id,
        user_id: user?.id,
        name,
        url: fd.get('url'),
        description: fd.get('description'),
        long_description: fd.get('long_description'),
        tags: fd.get('tags') ? fd.get('tags').split(',').map(t => t.trim()).filter(Boolean) : [],
        region: fd.get('region') || 'Global',
        rating: isEdit ? editItem.rating : (4.5 + (Math.random() * 0.5)),
        emoji: selectedCat ? selectedCat.emoji : (itemType === 'game' ? '🎮' : '🌐'),
        reviews: isEdit ? editItem.reviews : '1',
        screenshots: isEdit ? (editItem.screenshots || []) : [],
        featured_image: isEdit ? editItem.featured_image : null,
        status: 'pending',
        rejection_comment: null,
        category: selectedCat ? selectedCat.label : '',
      };

      if (itemType === 'game') {
        payload.gameCategory = fd.get('category');
      } else {
        payload.homeCategory = fd.get('category');
      }

      // 1. Handle Icon Upload
      const iconFile = document.getElementById('icon-input')?.files[0];
      if (iconFile) {
        payload.icon_url = await uploadToSupabase(iconFile, 'icons');
      } else if (isEdit) {
        payload.icon_url = editItem.icon_url;
      }

      // 2. Handle Featured Graphic Upload
      const featFile = document.getElementById('feat-input')?.files[0];
      if (featFile) {
        payload.featured_image = await uploadToSupabase(featFile, 'featured');
      }

      // 3. Handle Screenshots Upload
      const screenFiles = document.getElementById('screens-input')?.files;
      if (screenFiles && screenFiles.length > 0) {
        const urls = [];
        for (let i = 0; i < screenFiles.length; i++) {
          const url = await uploadToSupabase(screenFiles[i], 'screenshots');
          urls.push(url);
        }
        payload.screenshots = urls;
      }

      if (isEdit) {
        // If type changed, delete from the old table
        const oldType = editItem.gameCategory ? 'game' : 'app';
        if (oldType !== itemType) {
          await supabase.from(oldType === 'game' ? 'games' : 'apps').delete().eq('id', editItem.id);
        }
      }

      var { error: sbErr } = await supabase.from(itemType === 'game' ? 'games' : 'apps').upsert(payload);
      if (sbErr) throw sbErr;
      
      // Deduct 10 ZCoins only if not editing
      if (!isEdit) {
        await updateZCoins(currentBalance - 10);
      }
      
      setSuccess(true);
      setTimeout(() => goBack(), 2000);
    } catch (err) {
      console.error('Submit failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadToSupabase = async (file, folder) => {
    const ext = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    
    var { data, error } = await supabase.storage
      .from('media')
      .upload(fileName, file);

    if (error) throw error;

    var { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-bg p-8 text-center animate-in">
        <div className="w-24 h-24 rounded-[40px] bg-emerald-500/20 flex items-center justify-center text-5xl mb-6 shadow-2xl shadow-emerald-500/20 border border-emerald-500/30">
          ✨
        </div>
        <h2 className="text-white text-2xl font-black mb-3">Submission Received!</h2>
        <p className="text-muted text-sm leading-relaxed">
          Your {itemType === 'game' ? 'game' : 'app'} has been submitted for review. <br/>
          It will appear live once approved by the admin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg slide-right-fast">
      <BackHeader title={isEdit ? (itemType === 'game' ? 'Resubmit Game' : 'Resubmit Web App') : (itemType === 'game' ? 'Submit Game' : 'Submit Web App')} />
      
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 no-sb">
        <header className="mb-2">
          <h1 className="text-white text-xl font-black mb-1">
            {isEdit ? 'Edit & Resubmit' : (itemType === 'game' ? 'Add Game to Catalog' : 'Add App to Catalog')}
          </h1>
          <p className="text-muted text-xs">
            {itemType === 'game' ? 'Contribute a new web game to the community.' : 'Contribute a new web app to the community.'}
          </p>
        </header>

        {/* Submission Type Selector */}
        <div className="space-y-2">
          <label className="block text-muted text-[10px] font-black uppercase tracking-widest px-1">Submission Type</label>
          <div className="flex p-1 bg-card border border-border rounded-2xl">
            <button
              type="button"
              onClick={() => setItemType('app')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
                itemType === 'app' 
                  ? 'bg-accent text-white shadow-lg shadow-accent/25' 
                  : 'text-muted hover:text-white'
              }`}
            >
              <span>📱</span>
              <span>Web App</span>
            </button>
            <button
              type="button"
              onClick={() => setItemType('game')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
                itemType === 'game' 
                  ? 'bg-accent text-white shadow-lg shadow-accent/25' 
                  : 'text-muted hover:text-white'
              }`}
            >
              <span>🎮</span>
              <span>Game</span>
            </button>
          </div>
        </div>

        {!isEdit && currentBalance < 10 && (
          <div className="p-5 rounded-[24px] bg-amber-500/10 border border-amber-500/20 text-amber-500 flex flex-col items-center text-center gap-3">
            <span className="text-3xl">🪙</span>
            <div className="text-sm font-bold leading-snug">
              {t('insufficient_coins') || 'Insufficient ZCoins! You need 10 ZCoins to upload.'}
            </div>
            <button 
              type="button" 
              onClick={() => go('store')} 
              className="tap px-5 py-2 bg-amber-500 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-500/25"
            >
              {t('buy_coins') || 'Buy ZCoins'}
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Identity */}
          <div className="space-y-4">
            <div>
              <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">
                {itemType === 'game' ? 'Game Name' : 'App Name'}
              </label>
              <input 
                required
                name="name" 
                type="text" 
                defaultValue={editItem?.name || ''}
                placeholder={itemType === 'game' ? 'e.g. Space Invaders' : 'e.g. My Awesome App'}
                className="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm focus:border-accent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">Website URL</label>
              <input 
                required
                name="url" 
                type="url" 
                defaultValue={editItem?.url || ''}
                placeholder="https://example.com"
                className="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm focus:border-accent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">Region</label>
              <select 
                name="region"
                defaultValue={editItem?.region || 'Global'}
                className="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm focus:border-accent outline-none transition-all"
              >
                <option value="Global">All Over the World</option>
                <option value="PK">Pakistan</option>
                <option value="US">USA</option>
                <option value="UK">UK</option>
                <option value="AE">UAE</option>
              </select>
            </div>

            <div>
              <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">Tags (Comma separated)</label>
              <input 
                name="tags" 
                type="text" 
                defaultValue={editItem?.tags ? editItem.tags.join(', ') : ''}
                placeholder={itemType === 'game' ? 'e.g. arcade, puzzle, adventure' : 'e.g. productivity, ai, tools'}
                className="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm focus:border-accent outline-none transition-all"
              />
            </div>
          </div>

          {/* Media Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">
                {itemType === 'game' ? 'Game Icon' : 'App Icon'}
              </label>
              <div className="relative">
                <input 
                  type="file" 
                  id="icon-input"
                  accept="image/*"
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        document.getElementById('icon-preview').src = ev.target.result;
                        document.getElementById('icon-preview').classList.remove('hidden');
                        document.getElementById('icon-placeholder').classList.add('hidden');
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <label htmlFor="icon-input" className="flex flex-col items-center justify-center w-full h-32 rounded-2xl bg-card border-2 border-dashed border-border hover:border-accent transition-all cursor-pointer overflow-hidden">
                   <img id="icon-preview" src={editItem?.icon_url || ''} className={`w-full h-full object-cover ${editItem?.icon_url ? '' : 'hidden'}`} />
                   <div id="icon-placeholder" className={`flex flex-col items-center ${editItem?.icon_url ? 'hidden' : ''}`}>
                     <span className="text-2xl mb-1">🖼️</span>
                     <span className="text-[10px] text-muted font-bold">UPLOAD ICON</span>
                   </div>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">Screenshots</label>
              <div className="relative">
                <input 
                  type="file" 
                  id="screens-input"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const count = e.target.files.length;
                    document.getElementById('screens-count').innerText = count > 0 ? `${count} files selected` : 'UPLOAD SCREENS';
                  }}
                />
                <label htmlFor="screens-input" className="flex flex-col items-center justify-center w-full h-32 rounded-2xl bg-card border-2 border-dashed border-border hover:border-accent transition-all cursor-pointer">
                   <span className="text-2xl mb-1">📸</span>
                   <span id="screens-count" className="text-[10px] text-muted font-bold text-center px-2">
                     {editItem?.screenshots && editItem.screenshots.length > 0 
                       ? `${editItem.screenshots.length} files selected` 
                       : 'UPLOAD SCREENS'}
                   </span>
                </label>
              </div>
            </div>
          </div>

          {/* Featured Graphic */}
          <div>
            <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">Featured Graphic (1024x500)</label>
            <div className="relative">
              <input 
                type="file" 
                id="feat-input"
                accept="image/*"
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      document.getElementById('feat-preview').src = ev.target.result;
                      document.getElementById('feat-preview').classList.remove('hidden');
                      document.getElementById('feat-placeholder').classList.add('hidden');
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <label htmlFor="feat-input" className="flex flex-col items-center justify-center w-full h-40 rounded-3xl bg-card border-2 border-dashed border-border hover:border-accent transition-all cursor-pointer overflow-hidden">
                 <img id="feat-preview" src={editItem?.featured_image || ''} className={`w-full h-full object-cover ${editItem?.featured_image ? '' : 'hidden'}`} />
                 <div id="feat-placeholder" className={`flex flex-col items-center ${editItem?.featured_image ? 'hidden' : ''}`}>
                   <span className="text-3xl mb-1">🎭</span>
                   <span className="text-[10px] text-muted font-bold">UPLOAD FEATURED GRAPHIC (1024x500)</span>
                 </div>
              </label>
            </div>
          </div>

          {/* Classification */}
          <div>
            <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">Primary Category</label>
            <select 
              required
              name="category"
              key={itemType}
              defaultValue={editItem ? (editItem.gameCategory || editItem.homeCategory) : ''}
              className="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm focus:border-accent outline-none appearance-none transition-all cursor-pointer"
            >
              <option value="">Select a category</option>
              {liveCats.filter(c => c.type === itemType).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
              ))}
            </select>
          </div>

          {/* Details */}
          <div>
            <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">Short Description</label>
            <textarea 
              name="description" 
              rows="3"
              defaultValue={editItem?.description || ''}
              placeholder={itemType === 'game' ? 'A quick one-liner about the game...' : 'A quick one-liner about the app...'}
              className="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm focus:border-accent outline-none transition-all resize-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">Long Description</label>
            <textarea 
              name="long_description" 
              rows="6"
              defaultValue={editItem?.long_description || ''}
              placeholder={itemType === 'game' ? 'Detailed game info, controls, and how to play it...' : 'Detailed app info, features, and how to use it...'}
              className="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm focus:border-accent outline-none transition-all resize-none"
            ></textarea>
          </div>
        </div>

        <div className="pt-4">
          {!isEdit && (
            <div className="text-center text-[10px] text-muted font-bold uppercase tracking-wider mb-3">
              {t('cost_to_upload') || 'Cost to upload: 10 ZCoins'} ({t('your_balance') || 'Your Balance'}: {currentBalance} ZCoins)
            </div>
          )}
          {canSubmit ? (
            <button 
              type="submit" 
              disabled={loading}
              className="tap w-full py-5 bg-accent text-white font-black rounded-3xl shadow-xl glow-purple disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>UPLOADING...</span>
                </>
              ) : (
                <>
                  <span>{isEdit ? 'RESUBMIT ITEM' : (itemType === 'game' ? 'ADD GAME TO ZEROAPP' : 'ADD APP TO ZEROAPP')}</span>
                  <span className="text-xl">🚀</span>
                </>
              )}
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => go('store')}
              className="tap w-full py-5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-3xl shadow-xl transition-all flex items-center justify-center gap-3"
            >
              <span>{t('buy_coins') || 'Buy ZCoins'}</span>
              <span className="text-xl">🪙</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
window.SubmitScreen = SubmitScreen;
