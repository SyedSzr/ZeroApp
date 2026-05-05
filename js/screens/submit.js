// ── SUBMIT SCREEN ───────────────────────────────────────────────────────────
function SubmitScreen() {
  const { supabase, liveCats, goBack } = useApp();
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
    const payload = {
      name: fd.get('name'),
      url: fd.get('url'),
      description: fd.get('description'),
      homeCategory: fd.get('category'),
      rating: 4.5 + (Math.random() * 0.5), // Realistic random starting rating
      emoji: '🌐', // Default web emoji
      reviews: '1',
    };

    try {
      const { error: sbErr } = await supabase.from('apps').insert(payload);
      if (sbErr) throw sbErr;
      
      setSuccess(true);
      // Give feedback then go back
      setTimeout(() => goBack(), 2000);
    } catch (err) {
      console.error('Submit failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
      
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
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
                className="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">Website URL</label>
              <input 
                required
                name="url" 
                type="url" 
                placeholder="https://example.com"
                className="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              />
            </div>
          </div>

          {/* Classification */}
          <div>
            <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">Primary Category</label>
            <select 
              required
              name="category"
              className="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none appearance-none transition-all"
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
              rows="4"
              placeholder="Tell us what this app does..."
              className="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-none"
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
                <span>SUBMITTING...</span>
              </>
            ) : (
              <>
                <span>ADD APP TO ZEROAPP</span>
                <span className="text-xl">🚀</span>
              </>
            )}
          </button>
          <p className="text-center text-muted text-[10px] mt-4 uppercase tracking-widest font-black opacity-40">
            Secure Submission via Supabase
          </p>
        </div>
      </form>
    </div>
  );
}
