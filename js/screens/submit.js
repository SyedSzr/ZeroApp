// ── SUBMIT SCREEN ───────────────────────────────────────────────────────────
function SubmitScreen() {
  const context = useApp();
  if (!context) return null;
  const { supabase, liveCats, goBack } = context;

  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError]     = React.useState(null);

  const appCategories = liveCats.filter(c => c.type === 'app');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    const fd = new FormData(e.target);
    const name = fd.get('name');
    
    // Generate a unique ID (slug style) to avoid constraint violations
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(7);

    try {
      const payload = {
        id,
        name,
        url: fd.get('url'),
        description: fd.get('description'),
        long_description: fd.get('long_description'),
        tags: fd.get('tags') ? fd.get('tags').split(',').map(t => t.trim()).filter(Boolean) : [],
        homeCategory: fd.get('category'),
        rating: 4.5 + (Math.random() * 0.5),
        emoji: '🌐',
        reviews: '1',
        screenshots: [],
      };

      // 1. Handle Icon Upload
      const iconFile = document.getElementById('icon-input')?.files[0];
      if (iconFile) {
        payload.icon_url = await uploadToSupabase(iconFile, 'icons');
      }

      // 2. Handle Screenshots Upload
      const screenFiles = document.getElementById('screens-input')?.files;
      if (screenFiles && screenFiles.length > 0) {
        const urls = [];
        for (let i = 0; i < screenFiles.length; i++) {
          const url = await uploadToSupabase(screenFiles[i], 'screenshots');
          urls.push(url);
        }
        payload.screenshots = urls;
      }

      const { error: sbErr } = await supabase.from('apps').insert(payload);
      if (sbErr) throw sbErr;
      
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
    
    const { data, error } = await supabase.storage
      .from('media')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
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
          Your app has been added to our catalog. <br/>
          Redirecting you back...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg slide-right-fast">
      <BackHeader title="Submit Web App" />
      
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 no-sb">
        <header className="mb-2">
          <h1 className="text-white text-xl font-black mb-1">Add to Catalog</h1>
          <p className="text-muted text-xs">Contribute a new web app to the community.</p>
        </header>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-6">
          {/* App Identity */}
          <div className="space-y-4">
            <div>
              <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">App Name</label>
              <input 
                required
                name="name" 
                type="text" 
                placeholder="e.g. My Awesome App"
                className="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm focus:border-accent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">Website URL</label>
              <input 
                required
                name="url" 
                type="url" 
                placeholder="https://example.com"
                className="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm focus:border-accent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">Tags (Comma separated)</label>
              <input 
                name="tags" 
                type="text" 
                placeholder="e.g. productivity, ai, tools"
                className="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm focus:border-accent outline-none transition-all"
              />
            </div>
          </div>

          {/* Media Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">App Icon</label>
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
                   <img id="icon-preview" className="w-full h-full object-cover hidden" />
                   <div id="icon-placeholder" className="flex flex-col items-center">
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
                   <span id="screens-count" className="text-[10px] text-muted font-bold text-center px-2">UPLOAD SCREENS</span>
                </label>
              </div>
            </div>
          </div>

          {/* Classification */}
          <div>
            <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">Primary Category</label>
            <select 
              required
              name="category"
              className="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm focus:border-accent outline-none appearance-none transition-all"
            >
              <option value="">Select a category</option>
              {appCategories.map(cat => (
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
              placeholder="A quick one-liner about the app..."
              className="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm focus:border-accent outline-none transition-all resize-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">Long Description</label>
            <textarea 
              name="long_description" 
              rows="6"
              placeholder="Detailed app info, features, and how to use it..."
              className="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm focus:border-accent outline-none transition-all resize-none"
            ></textarea>
          </div>
        </div>

        <div className="pt-4">
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
                <span>ADD APP TO ZEROAPP</span>
                <span className="text-xl">🚀</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
