// ── ZCOIN STORE SCREEN ────────────────────────────────────────────────────────
var { useState } = React;

function StoreScreen() {
  const { userProfile, updateZCoins, goBack, t } = useApp();
  const [purchasing, setPurchasing] = useState(null); // selected bundle or null
  const [successBundle, setSuccessBundle] = useState(null); // completed bundle or null

  const currentBalance = userProfile?.zcoins ?? 0;

  const bundles = [
    { 
      id: 'starter', 
      name: 'Starter Pack', 
      coins: 10, 
      price: '$1.00', 
      badge: '1 Upload',
      icon: 'zcoin-1'
    },
    { 
      id: 'dev', 
      name: 'Developer Pack', 
      coins: 20, 
      price: '$2.00', 
      badge: '2 Uploads',
      icon: 'zcoin-2',
      popular: true
    },
    { 
      id: 'super', 
      name: 'Super Bundle', 
      coins: 50, 
      price: '$5.00', 
      badge: 'Best Value (+10% Bonus)',
      icon: '💎',
      value: true
    },
    { 
      id: 'pro', 
      name: 'Pro Pack', 
      coins: 100, 
      price: '$10.00', 
      badge: 'Pro Choice (+20% Bonus)',
      icon: '👑'
    }
  ];

  const handlePurchase = (bundle) => {
    setPurchasing(bundle);
    setTimeout(() => {
      // Simulate successful payment validation
      const finalBalance = currentBalance + bundle.coins;
      updateZCoins(finalBalance);
      setPurchasing(null);
      setSuccessBundle(bundle);
    }, 1500);
  };

  return (
    <div className="slide-right flex flex-col h-full bg-bg relative">
      <BackHeader title={t('zcoin_store') || 'ZCoin Store'} />

      <div className="flex-1 overflow-y-auto no-sb p-5 pb-32">
        {/* Balance Card */}
        <div className="bg-card border border-border rounded-[28px] p-6 mb-8 text-center relative overflow-hidden group shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent pointer-events-none" />
          <div className="text-4xl mb-2 animate-bounce"><ZCoinIcon size={48} /></div>
          <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1">
            {t('your_balance') || 'Your Balance'}
          </p>
          <h2 className="text-white text-3xl font-black tracking-tight">{currentBalance} ZCoins</h2>
          <p className="text-muted/60 text-[10px] mt-2 font-medium">Use ZCoins to upload applications. 10 ZCoins per app submission.</p>
        </div>

        {/* Store Title */}
        <h3 className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-4 ml-1">Choose ZCoin Bundle</h3>

        {/* Bundles Grid */}
        <div className="grid grid-cols-2 gap-4">
          {bundles.map(bundle => (
            <div 
              key={bundle.id} 
              className={`bg-card border rounded-[28px] p-5 flex flex-col items-center justify-between text-center relative transition-all duration-300 hover:border-accent/40 ${
                bundle.popular ? 'border-accent shadow-[0_0_15px_rgba(124,106,247,0.15)] scale-[1.02]' : 'border-border'
              }`}
            >
              {bundle.popular && (
                <span className="absolute -top-2.5 bg-accent text-white text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-bg shadow-lg">
                  Popular
                </span>
              )}
              {bundle.value && (
                <span className="absolute -top-2.5 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-bg shadow-lg">
                  Best Value
                </span>
              )}

              <div className="text-3xl my-2">{bundle.icon === 'zcoin-1' ? <ZCoinIcon size={36} /> : bundle.icon === 'zcoin-2' ? <div className="flex gap-1 justify-center"><ZCoinIcon size={28} /><ZCoinIcon size={28} /></div> : bundle.icon}</div>
              <h4 className="text-white text-sm font-bold truncate max-w-full leading-tight">{bundle.name}</h4>
              <p className="text-accent text-lg font-black mt-1.5">{bundle.coins} ZCoins</p>
              
              {bundle.badge && (
                <span className="text-muted text-[9px] font-bold mt-1 bg-surface border border-border px-2 py-0.5 rounded-full whitespace-nowrap">
                  {bundle.badge}
                </span>
              )}

              <button 
                onClick={() => handlePurchase(bundle)}
                className="tap w-full mt-4 py-2.5 bg-accent hover:bg-accent/80 text-white font-extrabold text-xs rounded-xl transition-all"
              >
                Buy for {bundle.price}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Purchasing Overlay */}
      {purchasing && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-surface border border-border rounded-3xl w-full max-w-[300px] p-6 text-center shadow-2xl flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-3 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
            <h4 className="text-white font-bold text-sm mb-1">Processing Payment...</h4>
            <p className="text-muted text-[10px] uppercase font-bold tracking-widest">Secure Checkout via Gateway</p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successBundle && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-surface border border-border rounded-3xl w-full max-w-[320px] p-6 text-center shadow-2xl flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-[28px] bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl mb-4 animate-bounce">
              ✓
            </div>
            <h4 className="text-white font-black text-base mb-1">Purchase Successful!</h4>
            <p className="text-muted text-xs px-2 leading-relaxed">
              Successfully credited **{successBundle.coins} ZCoins** to your account balance.
            </p>
            <button 
              onClick={() => setSuccessBundle(null)}
              className="tap w-full mt-6 py-3 bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20"
            >
              Excellent
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

window.StoreScreen = StoreScreen;
