// ── AUTH SCREENS ─────────────────────────────────────────────────────────────
var { useState } = React;

window.AuthScreen = function AuthScreen() {
  var { signIn, signUp, signInWithGoogle, goBack } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    let res;
    if (isLogin) {
      res = await signIn(email, password);
    } else {
      res = await signUp(email, password);
    }
    
    setLoading(false);
    if (res.error) {
      setError(res.error.message);
    } else {
      goBack(); // Success
    }
  };

  const handleGoogle = async () => {
    await signInWithGoogle();
  };

  return (
    <div className="slide-up flex flex-col h-full bg-bg relative" style={{ zIndex: 100 }}>
      <div className="pt-safe px-5 flex items-center py-4 flex-shrink-0">
        <button onClick={goBack} className="tap text-white font-bold text-base">← Back</button>
      </div>
      
      <div className="flex-1 px-8 flex flex-col justify-center pb-20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-accent to-violet-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-[0_0_30px_rgba(124,106,247,0.5)]">⚡</div>
          <h1 className="text-white font-extrabold text-2xl tracking-tight mb-1">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-muted text-sm">{isLogin ? 'Sign in to sync your apps and games' : 'Join ZeroApp to submit and sync apps'}</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-xs font-semibold px-4 py-2.5 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6">
          <input 
            type="email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
            required 
          />
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
            required 
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm shadow-[0_0_20px_rgba(124,106,247,0.4)] active:scale-95 transition-transform mt-2 disabled:opacity-50">
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="flex items-center gap-4 mb-6 opacity-60">
          <div className="flex-1 h-px bg-white/20"></div>
          <span className="text-white text-xs font-semibold">OR</span>
          <div className="flex-1 h-px bg-white/20"></div>
        </div>

        <button 
          type="button" 
          onClick={handleGoogle}
          className="tap w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 mb-6">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <p className="text-center text-muted text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-accent font-bold tap">
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
