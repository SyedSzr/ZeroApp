// ── SUPABASE CONFIG ───────────────────────────────────────────────────────────
const SB_URL = 'https://sjotifqahfcylcooaqxm.supabase.co';
const SB_KEY = 'sb_publishable_3h4-HTzlMANQA-T2FMaavQ_uso2rIGj';

const sb = window.supabase.createClient(SB_URL, SB_KEY);

// ── STATE ──────────────────────────────────────────────────────────────────────
let currentRoute = 'dashboard';
let data = { apps: [], games: [], categories: [], settings: {}, profiles: [], promotions: [] };
let editingId = null;
let editingType = null;
let editingPromoId = null;
let selectedUserId = null;
let filterCategory = null;
let filterStatus = 'all'; // 'all', 'pending', 'approved', 'rejected'
let filterRegion = 'all'; 
let filterSearchQuery = '';

const EMOJI_LIST = [
  '🤖','🎮','👶','🛒','💼','💄','🎨','💰','📚','🎬','🔧','🏃','💬','🧩','⚔️','♟️','🕹️','📝','🎲','⚽','🗺️','🖼️','🧠',
  '🧒','🦉','🐱','🧸','🔡','📦','🏪','🎁','🔨','🛍️','💳','📋','📹','🔷','🎥','📌','✏️','📷','🌅','💅','🌸','🔵','🌀',
  '🖌️','🌈','🏀','🌍','🦎','📈','📊','🪙','🎓','🃏','🔢','📐','🏛️','▶️','🎵','🟣','🔊','❤️','🍅','🐙','📄','🧘','😌',
  '🚴','🥗','🌿','🐦','✈️','🐘','🔥','⚡','✨','🌟','🍀','🍎','🍔','🍕','🍦','🍺','🍹','🏠','🏢','🏥','🏫','🏛️'
];

// ── INITIALIZATION ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.supabase === 'undefined') {
    alert('Critical Error: Supabase SDK failed to load. Please check your internet connection.');
    return;
  }
  init();
});

async function init() {
  try {
    await fetchAllData();
    setRoute('dashboard');
    setupRealtime();
    setupEventListeners();
  } catch (err) {
    console.error('Init failed:', err);
  }
}

async function testConnection(e) {
  const btn = e ? e.currentTarget : event.currentTarget;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span>⏳</span> Testing...';
  
  try {
    const { data, error } = await sb.from('apps').select('id').limit(1);
    if (error) throw error;
    alert('🎉 CONNECTION SUCCESSFUL!\n\nYour Supabase setup is correct. You can now use the Sync Data tool to upload your catalog.');
  } catch (err) {
    console.error('Connection failed:', err);
    alert('❌ CONNECTION FAILED\n\nReason: ' + err.message + '\n\nMake sure you have:\n1. Created the tables in Supabase.\n2. Enabled the RLS policies I provided.');
  } finally {
    btn.innerHTML = originalText;
  }
}

async function fetchAllData() {
  try {
    const [resApps, resGames, resCats, resSettings, resPromos] = await Promise.all([
      sb.from('apps').select('*'),
      sb.from('games').select('*'),
      sb.from('categories').select('*'),
      sb.from('settings').select('*'),
      sb.from('promotions').select('*')
    ]);

    let resProfiles = { data: [] };
    try { resProfiles = await sb.from('profiles').select('*'); } catch(e) {}

    if (resApps.error) throw resApps.error;
    if (resGames.error) throw resGames.error;
    if (resCats.error) throw resCats.error;

    data.apps = resApps.data || [];
    data.games = resGames.data || [];
    data.categories = resCats.data || [];
    data.profiles = resProfiles.data || [];
    data.promotions = (resPromos && resPromos.data) || [];
    
    const sMap = {};
    (resSettings.data || []).forEach(s => sMap[s.key] = s.value);
    data.settings = sMap;

    renderCurrentView();
    showSyncStatus('Connected', 'bg-emerald-500');
  } catch (err) {
    console.error('Fetch error:', err);
    showSyncStatus('Error: Check RLS', 'bg-red-500');
    renderCurrentView();
  }
}

function setupRealtime() {
  sb.channel('admin_sync')
    .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchAllData())
    .subscribe();
}

function showSyncStatus(msg, colorClass) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.className = `flex items-center gap-2 px-3 py-1.5 rounded-full ${colorClass}/10 border ${colorClass}/20 ${colorClass.replace('bg-','text-')} text-xs font-bold transition-all`;
  el.innerHTML = `<span class="w-2 h-2 rounded-full ${colorClass} animate-pulse"></span> ${msg}`;
  el.style.opacity = '1';
}

function setRoute(route) {
  currentRoute = route;
  filterSearchQuery = '';
  if (route !== 'apps' && route !== 'games') {
    filterCategory = null; 
    filterStatus = 'all';
  }
  
  // Update UI Sidebar
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('tab-active', el.dataset.route === route);
  });

  const header = document.getElementById('route-header');
  const addBtn = document.getElementById('main-add-btn');
  
  if (addBtn) {
    addBtn.classList.remove('hidden');
    addBtn.onclick = () => openItemModal();
  }

  switch(route) {
    case 'dashboard':
      if (header) header.innerHTML = `<h2 class="text-white font-bold text-lg">Command Center</h2><p class="text-muted text-xs">Overview of your platform</p>`;
      if (addBtn) addBtn.classList.add('hidden');
      break;
    case 'apps':
      if (header) header.innerHTML = `<h2 class="text-white font-bold text-lg">App Catalog</h2><p class="text-muted text-xs">Manage ${data.apps.length} apps</p>`;
      break;
    case 'games':
      if (header) header.innerHTML = `<h2 class="text-white font-bold text-lg">Game Feed</h2><p class="text-muted text-xs">Manage ${data.games.length} games</p>`;
      break;
    case 'categories':
      if (header) header.innerHTML = `<h2 class="text-white font-bold text-lg">Classification</h2><p class="text-muted text-xs">Define groups</p>`;
      if (addBtn) addBtn.onclick = () => openCatModal();
      break;
    case 'users':
      if (header) header.innerHTML = `<h2 class="text-white font-bold text-lg">User Directory</h2><p class="text-muted text-xs">Manage ${data.profiles.length} users</p>`;
      if (addBtn) addBtn.classList.add('hidden');
      selectedUserId = null;
      break;
    case 'sync':
      if (header) header.innerHTML = `<h2 class="text-white font-bold text-lg">Cloud Migration</h2><p class="text-muted text-xs">Push local data</p>`;
      if (addBtn) addBtn.classList.add('hidden');
      break;
    case 'promotions':
      if (header) header.innerHTML = `<h2 class="text-white font-bold text-lg">Spotlight Manager</h2><p class="text-muted text-xs">Manage ${data.promotions.length} active promotions</p>`;
      if (addBtn) addBtn.onclick = () => openPromoModal();
      break;
    case 'settings':
      if (header) header.innerHTML = `<h2 class="text-white font-bold text-lg">Configuration</h2><p class="text-muted text-xs">Global parameters</p>`;
      if (addBtn) addBtn.classList.add('hidden');
      break;
  }

  renderCurrentView();
}

function clearFilter() {
  filterCategory = null;
  renderCurrentView();
}

function viewCategoryItems(catId, type) {
  filterCategory = catId;
  setRoute(type === 'app' ? 'apps' : 'games');
}

// ── VIEW RENDERING ─────────────────────────────────────────────────────────────
function renderCurrentView() {
  const container = document.getElementById('view-container');
  if (!container) return;
  
  if (currentRoute === 'dashboard') {
    container.innerHTML = `
      <div class="grid grid-cols-4 gap-6 mb-10">
        ${renderStatCard('Total Apps', data.apps.length, '📱', 'Apps in catalog')}
        ${renderStatCard('Live Games', data.games.length, '🎮', 'Games in feed')}
        ${renderStatCard('Active Promos', data.promotions.length, '✨', 'Featured & Trending')}
        ${renderStatCard('System Status', 'Online', '⚡', 'Supabase Connected')}
      </div>
      <div class="grid grid-cols-2 gap-8">
        <div class="glass p-8 rounded-[32px]">
          <h3 class="text-white font-bold mb-4">Quick Actions</h3>
          <div class="space-y-3">
             <button onclick="setRoute('apps')" class="w-full py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-left text-sm transition-all border border-white/5">Manage Applications</button>
             <button onclick="setRoute('games')" class="w-full py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-left text-sm transition-all border border-white/5">Manage Games Feed</button>
             <button onclick="setRoute('promotions')" class="w-full py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-left text-sm transition-all border border-white/5">Spotlight & Promotions</button>
             <button onclick="setRoute('categories')" class="w-full py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-left text-sm transition-all border border-white/5">Edit Categories</button>
          </div>
        </div>
        <div class="glass p-8 rounded-[32px]">
          <h3 class="text-white font-bold mb-4 text-center">Cloud Sync Tool</h3>
          <p class="text-muted text-sm text-center mb-6">Need to push your latest local data to the cloud?</p>
          <button onclick="setRoute('sync')" class="w-full py-4 bg-accent text-white font-black rounded-2xl shadow-lg glow-purple active:scale-95 transition-all">
             GO TO SYNC TOOL
          </button>
        </div>
      </div>
    `;
  } else if (currentRoute === 'promotions') {
    const selectedSection = window._selectedPromoSection || null;
    const activeRegion = window._promoRegion || 'All';

    const REGIONS = [
      { key: 'All',    label: 'All Regions', flag: '🌐' },
      { key: 'Global', label: 'Global',      flag: '🌍' },
      { key: 'PK',     label: 'Pakistan',    flag: '🇵🇰' },
      { key: 'US',     label: 'USA',         flag: '🇺🇸' },
      { key: 'UK',     label: 'UK',          flag: '🇬🇧' },
      { key: 'AE',     label: 'UAE',         flag: '🇦🇪' },
    ];

    const ALL_SECTIONS = [
      { key: 'featured_app',            label: 'Featured App',                  type: 'app',  icon: '⭐' },
      { key: 'recommended_for_you',     label: 'Recommended For You',           type: 'app',  icon: '💡' },
      { key: 'trending',                label: 'Trending',                      type: 'app',  icon: '🔥' },
      { key: 'featured_apps',           label: 'Featured Apps (Small)',         type: 'app',  icon: '📌' },
      { key: 'hot_right_now',           label: 'Hot Right Now',                 type: 'app',  icon: '⚡' },
      { key: 'top_pick_for_you',        label: 'Top Picks For You',             type: 'app',  icon: '🎯' },
      { key: 'editors_picks',           label: "Editor's Picks",               type: 'app',  icon: '✍️' },
      { key: 'popular_apps',            label: 'Popular Apps',                  type: 'app',  icon: '📈' },
      { key: 'new_experience',          label: 'New Experience',                type: 'app',  icon: '🆕' },
      { key: 'super_apps',              label: 'Super Apps',                    type: 'app',  icon: '🚀' },
      { key: 'apps_might_like',         label: 'Apps You Might Like',           type: 'app',  icon: '💭' },
      { key: 'crowd_favorites',         label: 'Crowd Favorites',               type: 'app',  icon: '👥' },
      { key: 'this_month_best',         label: "This Month's Best",             type: 'app',  icon: '🏆' },
      { key: 'featured_game',           label: 'Featured Game',                 type: 'game', icon: '🎮' },
      { key: 'recommended_games',       label: 'Recommended Games',             type: 'game', icon: '💡' },
      { key: 'trending_games',          label: 'Trending Games',                type: 'game', icon: '🔥' },
      { key: 'featured_games',          label: 'Featured Games (Small)',        type: 'game', icon: '📌' },
      { key: 'popular_games',           label: 'Popular Games',                 type: 'game', icon: '📈' },
      { key: 'super_games',             label: 'Super Games',                   type: 'game', icon: '🚀' },
      { key: 'games_might_like',        label: 'Games You Might Like',          type: 'game', icon: '💭' },
      { key: 'personalize_recommendations', label: 'Personalize Recommendations', type: 'both', icon: '🎨' },
    ];

    const now = new Date();

    function renderSectionItems(sec) {
      const promos = data.promotions.filter(p => {
        if (p.category_key !== sec.key) return false;
        if (activeRegion === 'All') return true;
        return (p.region || 'Global') === activeRegion;
      });
      if (promos.length === 0) {
        return `<div class="text-muted text-sm text-center py-8 opacity-50">No items spotlighted in this section yet.</div>`;
      }
      return promos.map(promo => {
        const item = promo.item_type === 'app'
          ? data.apps.find(a => a.id === promo.item_id)
          : data.games.find(g => g.id === promo.item_id);
        if (!item) return '';
        const isExpired = promo.end_date && new Date(promo.end_date) < now;
        const isActive = promo.is_active !== false && !isExpired;
        const startVal = promo.start_date ? promo.start_date.split('T')[0] : '';
        const endVal   = promo.end_date   ? promo.end_date.split('T')[0]   : '';
        return `
          <div class="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 ${isExpired ? 'opacity-40' : ''}">
            <div class="w-12 h-12 rounded-2xl bg-bg flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
              ${item.icon_url ? `<img src="${item.icon_url}" class="w-full h-full object-cover rounded-2xl"/>` : item.emoji || '📱'}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-white font-bold text-sm">${item.name}</span>
                <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${promo.item_type === 'app' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}">${promo.item_type}</span>
                <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}">${isExpired ? 'Expired' : (isActive ? 'Live' : 'Inactive')}</span>
                <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-accent/20 text-accent">${promo.region || 'Global'}</span>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-muted text-[10px]">Start:</span>
                <input type="date" value="${startVal}" 
                  onchange="updatePromoDate('${promo.id}', 'start_date', this.value)"
                  class="text-white text-[10px] font-bold bg-white/5 border border-white/10 rounded-lg px-2 py-1 focus:border-accent outline-none cursor-pointer"/>
                <span class="text-muted text-[10px]">End:</span>
                <input type="date" value="${endVal}" 
                  onchange="updatePromoDate('${promo.id}', 'end_date', this.value)"
                  class="text-white text-[10px] font-bold bg-white/5 border border-white/10 rounded-lg px-2 py-1 focus:border-accent outline-none cursor-pointer"/>
                <button onclick="togglePromoActive('${promo.id}', ${!isActive})"
                  class="text-[9px] font-black uppercase px-2 py-1 rounded-lg ${isActive ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40'} transition-colors">
                  ${isActive ? 'Pause' : 'Activate'}
                </button>
              </div>
            </div>
            <button onclick="deletePromotion('${promo.id}')" 
              class="flex-shrink-0 w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all flex items-center justify-center text-sm font-bold">
              ×
            </button>
          </div>
        `;
      }).join('');
    }

    container.innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-white font-black text-2xl">Spotlight Manager</h2>
          <p class="text-muted text-sm mt-1">Click any section to manage its spotlighted apps & games</p>
        </div>
        <button onclick="openPromoModal()" class="bg-accent hover:bg-accent/80 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-lg glow-purple active:scale-95">
          + New Spotlight
        </button>
      </div>

      <!-- Region Selector -->
      <div class="glass rounded-[20px] p-4 mb-5 flex items-center gap-3 flex-wrap">
        <span class="text-muted text-[10px] font-black uppercase tracking-widest flex-shrink-0">Filter by Region:</span>
        ${REGIONS.map(r => `
          <button onclick="setPromoRegion('${r.key}')"
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeRegion === r.key ? 'bg-accent text-white shadow-lg' : 'bg-white/5 text-muted hover:text-white hover:bg-white/10'}">
            <span>${r.flag}</span>
            <span>${r.label}</span>
            ${activeRegion === r.key ? `<span class="ml-1 text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full">${data.promotions.filter(p => r.key === 'All' || (p.region || 'Global') === r.key).length}</span>` : ''}
          </button>
        `).join('')}
      </div>

      <!-- Section Type Filters -->
      <div class="mb-4 flex gap-2">
        <button onclick="filterPromoType('all')" id="pf-all" class="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-white/10 text-white">All Sections</button>
        <button onclick="filterPromoType('app')" id="pf-app" class="px-4 py-2 rounded-xl text-xs font-bold transition-all text-muted hover:text-white">📱 Apps</button>
        <button onclick="filterPromoType('game')" id="pf-game" class="px-4 py-2 rounded-xl text-xs font-bold transition-all text-muted hover:text-white">🎮 Games</button>
      </div>

      <div id="promo-sections-grid" class="space-y-3">
        ${ALL_SECTIONS.map(sec => {
          const count = data.promotions.filter(p => {
            if (p.category_key !== sec.key) return false;
            if (activeRegion === 'All') return true;
            return (p.region || 'Global') === activeRegion;
          }).length;
          const isOpen = selectedSection === sec.key;
          return `
            <div class="glass rounded-[24px] overflow-hidden section-card" data-type="${sec.type}">
              <button onclick="togglePromoSection('${sec.key}')"
                class="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-white/5 transition-all">
                <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                  style="background:${sec.type === 'game' ? 'rgba(251,146,60,0.15)' : sec.type === 'both' ? 'rgba(139,92,246,0.15)' : 'rgba(124,106,247,0.15)'}">
                  ${sec.icon}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-white font-bold text-sm">${sec.label}</span>
                    <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${sec.type === 'game' ? 'bg-orange-500/20 text-orange-400' : sec.type === 'both' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}">${sec.type}</span>
                  </div>
                  <p class="text-muted text-[10px] mt-0.5">${count > 0 ? `${count} item${count > 1 ? 's' : ''} spotlighted` : 'No items – using default algorithm'}</p>
                </div>
                <div class="flex items-center gap-3 flex-shrink-0">
                  ${count > 0 ? `<span class="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white font-black text-[10px]">${count}</span>` : ''}
                  <button onclick="event.stopPropagation(); openPromoModal(null, '${sec.key}')" 
                    class="text-[9px] font-black uppercase px-3 py-1.5 rounded-lg bg-accent/20 text-accent hover:bg-accent hover:text-white transition-all">
                    + Add
                  </button>
                  <span class="text-muted text-lg transition-transform ${isOpen ? 'rotate-90' : ''}" id="arrow-${sec.key}">›</span>
                </div>
              </button>
              <div id="section-items-${sec.key}" class="${isOpen ? '' : 'hidden'} px-6 pb-5 pt-1 border-t border-white/5 space-y-3">
                ${renderSectionItems(sec)}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else if (currentRoute === 'apps' || currentRoute === 'games') {
    let list = currentRoute === 'apps' ? data.apps : data.games;
    
    if (filterCategory) {
      list = list.filter(item => (item.homeCategory === filterCategory || item.gameCategory === filterCategory));
    }
    if (filterStatus !== 'all') {
      list = list.filter(item => item.status === filterStatus);
    }
    if (filterRegion && filterRegion !== 'all') {
      list = list.filter(item => (item.region || 'Global') === filterRegion);
    }
    if (filterSearchQuery.trim()) {
      const q = filterSearchQuery.toLowerCase().trim();
      list = list.filter(item => 
        (item.name || '').toLowerCase().includes(q) || 
        (item.id || '').toLowerCase().includes(q) ||
        (item.url || '').toLowerCase().includes(q)
      );
    }

    const pendingCount = (currentRoute === 'apps' ? data.apps : data.games).filter(i => i.status === 'pending').length;

    container.innerHTML = `
      <div class="flex flex-col gap-6 mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <!-- Status Filters -->
          <div class="flex items-center gap-4 bg-card border border-border p-2 rounded-2xl w-fit">
            <button onclick="setStatusFilter('all')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}">All Items</button>
            <button onclick="setStatusFilter('pending')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${filterStatus === 'pending' ? 'bg-amber-500/20 text-amber-500' : 'text-muted hover:text-white'}">
              Pending Approval
              ${pendingCount > 0 ? `<span class="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">${pendingCount}</span>` : ''}
            </button>
            <button onclick="setStatusFilter('approved')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-500' : 'text-muted hover:text-white'}">Approved</button>
            <button onclick="setStatusFilter('rejected')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === 'rejected' ? 'bg-red-500/20 text-red-500' : 'text-muted hover:text-white'}">Rejected</button>
          </div>

          <!-- Region Filter -->
          <div class="flex items-center gap-4 bg-card border border-border p-2 rounded-2xl w-fit">
             <span class="text-muted text-[10px] font-black uppercase tracking-widest px-2">Region:</span>
             <select onchange="setRegionFilter(this.value)" class="bg-transparent text-white text-xs font-bold outline-none pr-4">
                <option value="all" ${filterRegion === 'all' ? 'selected' : ''}>All Regions</option>
                <option value="Global" ${filterRegion === 'Global' ? 'selected' : ''}>Global</option>
                <option value="PK" ${filterRegion === 'PK' ? 'selected' : ''}>Pakistan</option>
                <option value="US" ${filterRegion === 'US' ? 'selected' : ''}>USA</option>
                <option value="UK" ${filterRegion === 'UK' ? 'selected' : ''}>UK</option>
             </select>
          </div>

          <!-- Search Bar -->
          <div class="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-2xl flex-1 min-w-[240px]">
            <span class="text-muted text-sm">🔍</span>
            <input 
              id="admin-search-input"
              type="text" 
              value="${filterSearchQuery}" 
              oninput="setSearchFilter(this.value)" 
              placeholder="Search by name, ID or URL..." 
              class="bg-transparent text-white text-xs font-medium outline-none w-full"
            />
            ${filterSearchQuery ? `<button onclick="setSearchFilter('');" class="text-muted hover:text-white font-black text-sm">×</button>` : ''}
          </div>
        </div>

        ${filterCategory ? `
          <div class="flex items-center justify-between px-4 bg-accent/5 p-4 rounded-3xl border border-accent/10">
            <div class="flex items-center gap-3">
               <span class="text-muted text-[10px] font-black uppercase tracking-widest">Filtering by Category:</span>
               <span class="pill bg-accent text-white text-[10px] px-3 py-1 font-black rounded-full shadow-lg glow-purple">
                 ${data.categories.find(c => c.id === filterCategory)?.label || filterCategory}
               </span>
            </div>
            <button onclick="clearFilter()" class="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest flex items-center gap-1 transition-all">
              <span>Clear Category Filter</span>
              <span class="text-sm">×</span>
            </button>
          </div>
        ` : ''}
      </div>

      <div class="glass rounded-[32px] overflow-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="text-muted text-[11px] font-black uppercase tracking-widest border-b border-white/5">
              <th class="px-8 py-4">Item</th>
              <th class="px-8 py-4">Category</th>
              <th class="px-8 py-4">Region</th>
              <th class="px-8 py-4 text-center">Status</th>
              <th class="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(item => `
              <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td class="px-8 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-bg flex items-center justify-center text-xl overflow-hidden">
                      ${item.icon_url ? `<img src="${item.icon_url}" class="w-full h-full object-cover"/>` : item.emoji}
                    </div>
                    <div>
                      <p class="text-white font-bold text-sm">${item.name}</p>
                      <p class="text-muted text-[10px] truncate max-w-[150px]">${item.url}</p>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-4">
                  <span class="pill bg-accent/10 text-accent text-[10px] px-2 py-1 font-bold uppercase">${item.homeCategory || item.gameCategory}</span>
                </td>
                <td class="px-8 py-4 text-white text-xs font-bold">
                  ${item.region || 'Global'}
                </td>
                <td class="px-8 py-4 text-center">
                  ${renderStatusBadge(item.status)}
                </td>
                <td class="px-8 py-4 text-right">
                  <button onclick="editItem('${item.id}', '${currentRoute}')" class="text-muted hover:text-white transition-colors mr-3 text-sm font-bold">Edit</button>
                  <button onclick="deleteItem('${item.id}', '${currentRoute}')" class="text-red-500/50 hover:text-red-500 transition-colors text-sm font-bold">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (currentRoute === 'categories') {
    container.innerHTML = `
      <div class="grid grid-cols-3 gap-6">
        ${data.categories.map(cat => `
          <div class="glass p-6 rounded-3xl relative group">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.grad} flex items-center justify-center text-xl shadow-lg">
                ${cat.emoji}
              </div>
              <div>
                <h4 class="text-white font-bold">${cat.label}</h4>
                <p class="text-[10px] font-black uppercase tracking-widest ${cat.type === 'app' ? 'text-blue-400' : 'text-orange-400'}">${cat.type}s</p>
              </div>
            </div>
            </div>
            <div class="flex gap-2">
              <button onclick="viewCategoryItems('${cat.id}', '${cat.type}')" class="flex-1 py-2.5 rounded-xl bg-accent text-white text-[10px] font-black uppercase tracking-widest shadow-lg glow-purple active:scale-95 transition-all">View Apps</button>
              <button onclick="editCategory('${cat.id}')" class="w-10 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-all flex items-center justify-center text-xs">✎</button>
              <button onclick="deleteCategory('${cat.id}')" class="w-10 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500/60 hover:text-white transition-all flex items-center justify-center text-sm">×</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (currentRoute === 'users') {
    if (selectedUserId) {
       const user = data.profiles.find(p => p.id === selectedUserId) || { id: selectedUserId, email: 'Unknown User' };
       const userApps = data.apps.filter(a => a.user_id === selectedUserId);
       const userGames = data.games.filter(a => a.user_id === selectedUserId);
       const allSubs = [...userApps, ...userGames];
       container.innerHTML = `
         <button onclick="viewUser(null)" class="text-muted hover:text-white text-sm font-bold mb-6 flex items-center gap-2">← Back to Users</button>
         <div class="glass p-8 rounded-[32px] mb-8 flex items-center gap-6">
           <div class="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center text-4xl text-white font-bold">
             ${user.email ? user.email.charAt(0).toUpperCase() : 'U'}
           </div>
           <div>
             <h3 class="text-white font-bold text-2xl">${user.email || 'Unknown User'}</h3>
             <p class="text-muted text-sm mt-1">User ID: ${user.id}</p>
           </div>
           <div class="ml-auto text-right">
             <p class="text-3xl font-black text-white">${allSubs.length}</p>
             <p class="text-muted text-xs uppercase tracking-widest font-bold mt-1">Total Submissions</p>
           </div>
         </div>
         <h4 class="text-white font-bold text-lg mb-4">Submission History</h4>
         <div class="glass rounded-[32px] overflow-hidden">
            <table class="w-full text-left">
              <thead>
                <tr class="text-muted text-[11px] font-black uppercase tracking-widest border-b border-white/5">
                  <th class="px-8 py-4">Item</th>
                  <th class="px-8 py-4">Type</th>
                  <th class="px-8 py-4 text-center">Status</th>
                  <th class="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${allSubs.length === 0 ? `<tr><td colspan="4" class="text-center py-10 text-muted">No submissions found.</td></tr>` : allSubs.map(item => `
                  <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td class="px-8 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-bg flex items-center justify-center text-xl overflow-hidden">
                          ${item.icon_url || item.featured_image ? `<img src="${item.icon_url || item.featured_image}" class="w-full h-full object-cover"/>` : item.emoji || '🎮'}
                        </div>
                        <div>
                          <p class="text-white font-bold text-sm">${item.name}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-8 py-4">
                      <span class="pill bg-accent/10 text-accent text-[10px] px-2 py-1 font-bold uppercase">${item.homeCategory ? 'App' : 'Game'}</span>
                    </td>
                    <td class="px-8 py-4 text-center">
                      ${renderStatusBadge(item.status)}
                    </td>
                    <td class="px-8 py-4 text-right">
                      <button onclick="editItem('${item.id}', '${item.homeCategory ? 'apps' : 'games'}')" class="text-accent hover:text-white transition-colors text-xs font-bold">Review / Edit</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
         </div>
       `;
    } else {
       container.innerHTML = `
         <div class="glass rounded-[32px] overflow-hidden">
           <table class="w-full text-left">
             <thead>
               <tr class="text-muted text-[11px] font-black uppercase tracking-widest border-b border-white/5">
                 <th class="px-8 py-4">User</th>
                 <th class="px-8 py-4">ID</th>
                 <th class="px-8 py-4 text-center">Submissions</th>
                 <th class="px-8 py-4 text-right">Actions</th>
               </tr>
             </thead>
             <tbody>
               ${data.profiles.length === 0 ? `<tr><td colspan="4" class="text-center py-10 text-muted">No profiles found. Make sure the 'profiles' table exists and is populated via Auth.</td></tr>` : data.profiles.map(p => {
                 const subsCount = data.apps.filter(a => a.user_id === p.id).length + data.games.filter(a => a.user_id === p.id).length;
                 return `
                 <tr class="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer" onclick="viewUser('${p.id}')">
                   <td class="px-8 py-4">
                     <div class="flex items-center gap-3">
                       <div class="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center text-xs text-white font-bold">
                         ${p.email ? p.email.charAt(0).toUpperCase() : 'U'}
                       </div>
                       <span class="text-white font-bold text-sm">${p.email || 'Unknown User'}</span>
                     </div>
                   </td>
                   <td class="px-8 py-4 text-muted text-xs">${p.id}</td>
                   <td class="px-8 py-4 text-center">
                     <span class="bg-white/10 text-white text-[10px] px-2.5 py-1 rounded-full font-bold">${subsCount}</span>
                   </td>
                   <td class="px-8 py-4 text-right text-muted">
                     →
                   </td>
                 </tr>
               `}).join('')}
             </tbody>
           </table>
         </div>
       `;
    }
  } else if (currentRoute === 'sync') {
    container.innerHTML = `
      <div class="max-w-2xl mx-auto text-center py-10">
        <div class="w-24 h-24 rounded-[40px] bg-accent/20 flex items-center justify-center text-4xl mx-auto mb-8 shadow-2xl glow-purple">☁️</div>
        <h3 class="text-3xl font-black text-white mb-4">Migrate to Cloud</h3>
        <p class="text-muted text-sm mb-10 px-10">This tool will take all apps from your local <b>data.js</b> and upload them to Supabase.</p>
        
        <div class="glass p-10 rounded-[40px] border-accent/20">
          <button onclick="seedSupabase()" id="sync-btn" class="w-full py-5 bg-accent text-white font-black rounded-3xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-lg">
             START FULL DATA SYNC
          </button>
          <div id="sync-log" class="mt-8 text-left h-48 overflow-y-auto no-sb bg-bg/50 border border-border rounded-2xl p-5 text-[10px] font-mono text-emerald-400 space-y-1 hidden"></div>
        </div>
      </div>
    `;
  } else if (currentRoute === 'settings') {
     container.innerHTML = `
      <div class="max-w-2xl mx-auto glass p-10 rounded-[40px]">
        <h3 class="text-xl font-black mb-8">System Parameters</h3>
        <form id="settings-form" class="space-y-8" onsubmit="saveSettings(event)">
           <div>
              <label class="block text-muted text-[10px] font-black uppercase tracking-widest mb-3">Platform Name</label>
              <input type="text" name="app_name" value="${data.settings.app_name || 'ZeroApp'}" class="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm" />
           </div>
           <div>
              <label class="block text-muted text-[10px] font-black uppercase tracking-widest mb-3">Maintenance Mode</label>
              <select name="maintenance" class="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm">
                <option value="off" ${data.settings.maintenance === 'off' ? 'selected' : ''}>Active / Public</option>
                <option value="on" ${data.settings.maintenance === 'on' ? 'selected' : ''}>Under Maintenance</option>
              </select>
           </div>
           <div>
              <label class="block text-muted text-[10px] font-black uppercase tracking-widest mb-3">System Greeting</label>
              <input type="text" name="greeting_override" value="${data.settings.greeting_override || ''}" class="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm" />
           </div>
           <button type="submit" class="w-full py-5 bg-accent text-white font-black rounded-3xl shadow-lg glow-purple active:scale-95 transition-all">
              SAVE CONFIGURATION
           </button>
        </form>
      </div>
     `;
  }
}

function renderStatCard(label, val, emoji, sub) {
  return `
    <div class="glass p-6 rounded-3xl">
      <div class="flex items-center justify-between mb-4">
        <p class="text-muted text-[10px] font-black uppercase tracking-widest">${label}</p>
        <span class="text-lg">${emoji}</span>
      </div>
      <h3 class="text-3xl font-black text-white">${val}</h3>
      <p class="text-muted text-[10px] font-medium mt-2">${sub}</p>
    </div>
  `;
}

// ── ACTIONS ────────────────────────────────────────────────────────────────────
async function handleItemSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const type = currentRoute;
  const submitBtn = document.getElementById('submit-btn');
  const uploadStatus = document.getElementById('upload-status');
  
  try {
    if (submitBtn) submitBtn.disabled = true;
    if (uploadStatus) uploadStatus.classList.remove('hidden');
    updateUploadProgress('Starting upload...', 5);

    const payload = {
      id: fd.get('id'),
      name: fd.get('name'),
      url: fd.get('url'),
      rating: parseFloat(fd.get('rating')),
      reviews: fd.get('reviews'),
      description: fd.get('description'),
      long_description: fd.get('long_description'),
      tags: fd.get('tags') ? fd.get('tags').split(',').map(t => t.trim()).filter(Boolean) : [],
      is_featured: fd.get('is_featured') === 'on',
    };

    // 1. Handle App Icon
    const iconFile = document.getElementById('icon-input').files[0];
    if (iconFile) {
      updateUploadProgress('Uploading icon...', 20);
      payload.icon_url = await uploadFile(iconFile, 'icons');
    } else if (editingId) {
      const existing = (type === 'apps' ? data.apps : data.games).find(it => it.id === editingId);
      if (existing) payload.icon_url = existing.icon_url;
    }

    // 2. Handle Game Featured Image
    if (type === 'games') {
      const featFile = document.getElementById('featured-input').files[0];
      if (featFile) {
        updateUploadProgress('Uploading featured image...', 50);
        payload.featured_image = await uploadFile(featFile, 'featured');
      } else if (editingId) {
        const existing = data.games.find(it => it.id === editingId);
        if (existing) payload.featured_image = existing.featured_image;
      }
      payload.gameCategory = fd.get('category_select');
    } else {
      payload.homeCategory = fd.get('category_select');
    }

    // 3. Handle Screenshots (Common for both)
    const screenFiles = document.getElementById('screenshots-input').files;
    if (screenFiles.length > 0) {
      updateUploadProgress(`Uploading ${screenFiles.length} screenshots...`, 70);
      const urls = [];
      for (let i = 0; i < screenFiles.length; i++) {
        const url = await uploadFile(screenFiles[i], 'screenshots');
        urls.push(url);
      }
      payload.screenshots = urls;
    } else if (editingId) {
      const list = type === 'apps' ? data.apps : data.games;
      const existing = list.find(it => it.id === editingId);
      if (existing) payload.screenshots = existing.screenshots || [];
    }

    updateUploadProgress('Finalizing...', 90);
    const { error } = await sb.from(type).upsert(payload);
    if (error) throw error;
    
    updateUploadProgress('Success!', 100);
    setTimeout(() => closeModal('item-modal'), 500);
  } catch (err) {
    console.error('Upload failed:', err);
    alert('Failed to save item: ' + err.message);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (uploadStatus) uploadStatus.classList.add('hidden');
  }
}

async function uploadFile(file, folder) {
  const ext = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  
  const { data: uploadData, error: uploadError } = await sb.storage
    .from('media')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = sb.storage
    .from('media')
    .getPublicUrl(fileName);

  return publicUrl;
}

function updateUploadProgress(msg, percent) {
  const msgEl = document.getElementById('upload-msg');
  const percentEl = document.getElementById('upload-percent');
  const barEl = document.getElementById('upload-bar');
  if (msgEl) msgEl.innerText = msg;
  if (percentEl) percentEl.innerText = `${percent}%`;
  if (barEl) barEl.style.width = `${percent}%`;
}

async function handleCatSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = { id: fd.get('id'), label: fd.get('label'), emoji: fd.get('emoji'), type: fd.get('type'), grad: fd.get('grad') };
  const { error } = await sb.from('categories').upsert(payload);
  if (error) alert('Error: ' + error.message);
  else closeModal('cat-modal');
}

async function saveSettings(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const updates = [
    { key: 'app_name', value: fd.get('app_name') },
    { key: 'maintenance', value: fd.get('maintenance') },
    { key: 'greeting_override', value: fd.get('greeting_override') },
  ];
  const { error } = await sb.from('settings').upsert(updates);
  if (error) alert('Error: ' + error.message);
  else alert('Settings saved!');
}

async function deleteItem(id, type) {
  const comment = prompt('Please enter the reason for deletion:');
  if (comment === null) return; // Cancelled
  if (!comment.trim()) {
    alert('Deletion reason is required.');
    return;
  }
  
  // Dynamically resolve type based on data.games to avoid invalid table updates
  const isGame = data.games && data.games.some(g => g.id === id);
  const resolvedType = isGame ? 'games' : 'apps';

  try {
    const { error } = await sb.from(resolvedType).update({
      status: 'deleted',
      rejection_comment: comment.trim()
    }).eq('id', id);
    
    if (error) throw error;
    alert('Item status successfully updated to Deleted!');
    fetchAllData();
  } catch (err) {
    alert('Failed to delete item: ' + err.message);
  }
}
async function deleteCategory(id) { if (confirm('Delete category?')) await sb.from('categories').delete().eq('id', id); }

// ── MODALS ─────────────────────────────────────────────────────────────────────
function openItemModal(item = null) {
  editingId = item ? item.id : null;
  editingType = item ? (item.gameCategory ? 'games' : 'apps') : (currentRoute === 'games' ? 'games' : 'apps');
  const form = document.getElementById('item-form');
  const select = document.getElementById('item-category-select');
  const catType = editingType === 'apps' ? 'app' : 'game';
  const filteredCats = data.categories.filter(c => c.type === catType);
  if (select) select.innerHTML = filteredCats.map(c => `<option value="${c.id}">${c.emoji} ${c.label}</option>`).join('');
  if (form && form.type) form.type.value = editingType;
  
  // Show featured image fields for both apps and games
  const gameFields = document.getElementById('game-only-fields');
  if (gameFields) gameFields.classList.remove('hidden');

  // Reset previews
  const iconPrev = document.getElementById('icon-preview');
  const featPrev = document.getElementById('featured-preview');
  const screensPrev = document.getElementById('screenshots-preview');
  
  if (iconPrev) iconPrev.innerHTML = '<span class="text-muted">🖼️</span>';
  if (featPrev) featPrev.innerHTML = '<span class="text-muted text-[10px]">16:9</span>';
  if (screensPrev) screensPrev.innerHTML = '';

  if (item && form) {
    form.id.value = item.id; 
    form.name.value = item.name; 
    form.url.value = item.url; 
    form.rating.value = item.rating; 
    form.reviews.value = item.reviews;
    form.description.value = item.description || ''; 
    form.long_description.value = item.long_description || '';
    form.tags.value = (item.tags || []).join(', ');
    form.is_featured.checked = !!item.is_featured;
    if (select) select.value = item.homeCategory || item.gameCategory;
    
    if (item.icon_url && iconPrev) iconPrev.innerHTML = `<img src="${item.icon_url}" class="w-full h-full object-cover"/>`;
    if (item.featured_image && featPrev) featPrev.innerHTML = `<img src="${item.featured_image}" class="w-full h-full object-cover"/>`;
    if (item.screenshots && screensPrev) {
      screensPrev.innerHTML = item.screenshots.map(url => `
        <div class="w-16 h-16 rounded-lg bg-card border border-border flex-shrink-0 overflow-hidden">
          <img src="${url}" class="w-full h-full object-cover"/>
        </div>
      `).join('');
    }
  } else if (form) {
    form.reset();
  }
  
  // Approval Workflow Header
  const approvalHeader = document.getElementById('approval-header');
  const rejectBox = document.getElementById('reject-box');
  if (approvalHeader) {
    if (item && item.status !== 'approved') {
      approvalHeader.classList.remove('hidden');
      const box = document.getElementById('status-icon-box');
      const label = document.getElementById('status-label');
      const sub = document.getElementById('status-subtext');
      
      if (item.status === 'pending') {
        approvalHeader.className = 'p-4 rounded-[28px] border mb-6 flex items-center justify-between border-amber-500/20 bg-amber-500/5';
        box.className = 'w-10 h-10 rounded-2xl flex items-center justify-center text-xl bg-amber-500/20 text-amber-500';
        box.innerHTML = '⏳';
        label.innerText = 'Pending Review';
        sub.innerText = 'This item is not yet visible to users.';
      } else if (item.status === 'rejected') {
        approvalHeader.className = 'p-4 rounded-[28px] border mb-6 flex items-center justify-between border-red-500/20 bg-red-500/5';
        box.className = 'w-10 h-10 rounded-2xl flex items-center justify-center text-xl bg-red-500/20 text-red-500';
        box.innerHTML = '❌';
        label.innerText = 'Submission Rejected';
        sub.innerText = item.rejection_comment || 'No comment provided.';
      } else if (item.status === 'deleted') {
        approvalHeader.className = 'p-4 rounded-[28px] border mb-6 flex items-center justify-between border-red-500/20 bg-red-500/5';
        box.className = 'w-10 h-10 rounded-2xl flex items-center justify-center text-xl bg-red-500/20 text-red-500';
        box.innerHTML = '🗑️';
        label.innerText = 'Submission Deleted';
        sub.innerText = item.rejection_comment || 'No comment provided.';
      }

      const approvalButtons = document.getElementById('approval-buttons');
      if (item.status === 'deleted') {
        if (approvalButtons) approvalButtons.classList.add('hidden');
      } else {
        if (approvalButtons) approvalButtons.classList.remove('hidden');
      }
    } else {
      approvalHeader.classList.add('hidden');
    }
  }
  if (rejectBox) rejectBox.classList.add('hidden');

  const modal = document.getElementById('item-modal');
  if (modal) modal.classList.remove('hidden');
}

function previewFile(input, previewId) {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById(previewId).innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover animate-pulse"/>`;
    };
    reader.readAsDataURL(file);
  }
}

function previewScreenshots(input) {
  const container = document.getElementById('screenshots-preview');
  if (!container) return;
  container.innerHTML = '';
  Array.from(input.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement('div');
      div.className = "w-16 h-16 rounded-lg bg-card border border-border flex-shrink-0 overflow-hidden";
      div.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover animate-pulse"/>`;
      container.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

function openCatModal(cat = null) {
  const form = document.getElementById('cat-form');
  if (cat && form) { form.id.value = cat.id; form.label.value = cat.label; form.emoji.value = cat.emoji; form.type.value = cat.type; form.grad.value = cat.grad; }
  else if (form) form.reset();
  const modal = document.getElementById('cat-modal');
  if (modal) modal.classList.remove('hidden');
}
function closeModal(id) { 
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden'); 
}

function setupEventListeners() {
  const itemForm = document.getElementById('item-form');
  if (itemForm) itemForm.onsubmit = handleItemSubmit;
  const catForm = document.getElementById('cat-form');
  if (catForm) catForm.onsubmit = handleCatSubmit;
}

// ── SEED LOGIC ─────────────────────────────────────────────────────────────────
async function seedSupabase() {
  if (!confirm('This will overwrite cloud data. Proceed?')) return;
  const logEl = document.getElementById('sync-log');
  const btn = document.getElementById('sync-btn');
  if (logEl) { logEl.classList.remove('hidden'); logEl.innerHTML = ''; }
  if (btn) { btn.innerText = 'Syncing...'; btn.disabled = true; }
  const log = (msg) => { 
    if (!logEl) return;
    const div = document.createElement('div'); div.innerText = `> ${msg}`; logEl.appendChild(div); logEl.scrollTop = logEl.scrollHeight; 
  };
  try {
    log('📦 Pushing Categories...');
    const cats = [...HOME_CATEGORIES.map(c=>({...c,type:'app'})), ...GAME_CATEGORIES.map(c=>({...c,type:'game'}))];
    const { error: catErr } = await sb.from('categories').upsert(cats);
    if (catErr) throw catErr;
    log('✅ Categories synced.');

    log('📦 Pushing Apps...'); 
    const { error: appErr } = await sb.from('apps').upsert(APPS); 
    if (appErr) throw appErr;
    log('✅ Apps synced.');

    log('📦 Pushing Games...'); 
    const { error: gameErr } = await sb.from('games').upsert(GAMES); 
    if (gameErr) throw gameErr;
    log('✅ Games synced.');

    log('🎉 FULL SYNC COMPLETE!'); alert('✅ SUCCESS!');
  } catch (err) { log('❌ ERROR: ' + err.message); alert('❌ Failed: ' + err.message); }
  finally { if (btn) { btn.innerText = 'START FULL DATA SYNC'; btn.disabled = false; } }
}

function setRegionFilter(region) {
  filterRegion = region;
  renderCurrentView();
}

function setSearchFilter(query) {
  filterSearchQuery = query;
  renderCurrentView();
  
  // Restore focus to input since innerHTML recreation destroys the original DOM element
  const input = document.getElementById('admin-search-input');
  if (input) {
    input.focus();
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }
}

function togglePromoSection(sectionKey) {
  const content = document.getElementById(`section-items-${sectionKey}`);
  const arrow = document.getElementById(`arrow-${sectionKey}`);
  if (!content) return;
  const isHidden = content.classList.contains('hidden');
  document.querySelectorAll('[id^="section-items-"]').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('[id^="arrow-"]').forEach(el => { el.style.transform = 'rotate(0deg)'; });
  if (isHidden) {
    content.classList.remove('hidden');
    if (arrow) arrow.style.transform = 'rotate(90deg)';
    content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    window._selectedPromoSection = sectionKey;
  } else {
    window._selectedPromoSection = null;
  }
}

function filterPromoType(type) {
  document.querySelectorAll('.section-card').forEach(card => {
    const cardType = card.dataset.type;
    card.style.display = (type === 'all' || cardType === type || cardType === 'both') ? '' : 'none';
  });
  ['all', 'app', 'game'].forEach(t => {
    const btn = document.getElementById(`pf-${t}`);
    if (!btn) return;
    if (t === type) {
      btn.classList.add('bg-white/10', 'text-white');
      btn.classList.remove('text-muted');
    } else {
      btn.classList.remove('bg-white/10', 'text-white');
      btn.classList.add('text-muted');
    }
  });
}

async function updatePromoDate(promoId, field, value) {
  try {
    const update = {};
    update[field] = value || null;
    await sb.from('promotions').update(update).eq('id', promoId);
    showSyncStatus('Date updated ✓', 'bg-emerald-500');
  } catch (err) {
    alert('Error updating date: ' + err.message);
  }
}

async function togglePromoActive(promoId, newState) {
  try {
    await sb.from('promotions').update({ is_active: newState }).eq('id', promoId);
    fetchAllData();
  } catch (err) {
    alert('Error toggling status: ' + err.message);
  }
}

function setPromoRegion(region) {
  window._promoRegion = region;
  renderCurrentView();
}

function openPromoModal(promoId = null, presetSection = null) {
  editingPromoId = promoId;
  const promo = typeof promoId === 'string' ? data.promotions.find(p => p.id === promoId) : null;
  
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md';
  modal.id = 'promo-modal';
  
  const appOptions = data.apps.map(a => `<option value="${a.id}" ${promo && promo.item_id === a.id ? 'selected' : ''}>App: ${a.name}</option>`).join('');
  const gameOptions = data.games.map(g => `<option value="${g.id}" ${promo && promo.item_id === g.id ? 'selected' : ''}>Game: ${g.name}</option>`).join('');
  
  const sectionKeys = [
    'featured_app', 'recommended_for_you', 'trending', 'featured_apps', 
    'hot_right_now', 'top_pick_for_you', 'editors_picks', 'popular_apps', 
    'new_experience', 'super_apps', 'apps_might_like', 'personalize_recommendations', 
    'crowd_favorites', 'this_month_best', 'featured_game', 'recommended_games',
    'trending_games', 'featured_games', 'popular_games', 'super_games', 'games_might_like'
  ];
  
  const sectionOptions = sectionKeys.map(k => `<option value="${k}" ${promo && promo.category_key === k ? 'selected' : ''}>${k.replace(/_/g,' ').toUpperCase()}</option>`).join('');

  modal.innerHTML = `
    <div class="glass w-full max-w-xl p-8 rounded-[40px] animate-in slide-up border border-white/10 shadow-2xl relative">
      <button onclick="closePromoModal()" class="absolute top-6 right-6 text-muted hover:text-white transition-colors">×</button>
      <h3 class="text-white text-2xl font-black mb-6">${typeof promoId === 'string' ? 'Edit Promotion' : 'Create Promotion'}</h3>
      <form id="promo-form" class="space-y-6">
        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-muted text-[10px] font-black uppercase tracking-widest mb-2">Target Item</label>
            <select name="item_id" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-accent outline-none">
              <optgroup label="Applications">${appOptions}</optgroup>
              <optgroup label="Games">${gameOptions}</optgroup>
            </select>
          </div>
          <div>
            <label class="block text-muted text-[10px] font-black uppercase tracking-widest mb-2">Display Section</label>
            <select name="category_key" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-accent outline-none">
              ${sectionOptions}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-muted text-[10px] font-black uppercase tracking-widest mb-2">Target Region</label>
            <select name="region" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-accent outline-none">
              <option value="Global" ${promo && promo.region === 'Global' ? 'selected' : ''}>Global</option>
              <option value="PK" ${promo && promo.region === 'PK' ? 'selected' : ''}>Pakistan</option>
              <option value="US" ${promo && promo.region === 'US' ? 'selected' : ''}>USA</option>
              <option value="UK" ${promo && promo.region === 'UK' ? 'selected' : ''}>UK</option>
              <option value="AE" ${promo && promo.region === 'AE' ? 'selected' : ''}>UAE</option>
            </select>
          </div>
          <div>
            <label class="block text-muted text-[10px] font-black uppercase tracking-widest mb-2">Status</label>
            <select name="is_active" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-accent outline-none">
              <option value="true" ${promo && promo.is_active !== false ? 'selected' : ''}>Active</option>
              <option value="false" ${promo && promo.is_active === false ? 'selected' : ''}>Inactive / Scheduled</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-muted text-[10px] font-black uppercase tracking-widest mb-2">Start Date</label>
            <input type="date" name="start_date" value="${promo && promo.start_date ? promo.start_date.split('T')[0] : ''}" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-accent outline-none"/>
          </div>
          <div>
            <label class="block text-muted text-[10px] font-black uppercase tracking-widest mb-2">End Date (Optional)</label>
            <input type="date" name="end_date" value="${promo && promo.end_date ? promo.end_date.split('T')[0] : ''}" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-accent outline-none"/>
          </div>
        </div>

        <button type="submit" class="w-full py-4 bg-accent text-white font-black rounded-2xl shadow-lg glow-purple active:scale-95 transition-all mt-4">
          ${typeof promoId === 'string' ? 'SAVE CHANGES' : 'CREATE SPOTLIGHT'}
        </button>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const form = document.getElementById('promo-form');
  form.onsubmit = handlePromoSubmit;

  // Pre-select section if provided via + Add button
  if (presetSection) {
    const sel = form.querySelector('[name="category_key"]');
    if (sel) sel.value = presetSection;
  }
}

function closePromoModal() {
  const modal = document.getElementById('promo-modal');
  if (modal) modal.remove();
  editingPromoId = null;
}

async function handlePromoSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const itemId = fd.get('item_id');
  const isGame = data.games.some(g => g.id === itemId);
  
  const payload = {
    item_id: itemId,
    item_type: isGame ? 'game' : 'app',
    category_key: fd.get('category_key'),
    region: fd.get('region'),
    start_date: fd.get('start_date') || null,
    end_date: fd.get('end_date') || null,
    is_active: fd.get('is_active') === 'true'
  };

  try {
    if (editingPromoId) {
      await sb.from('promotions').update(payload).eq('id', editingPromoId);
    } else {
      await sb.from('promotions').insert(payload);
    }
    closePromoModal();
    fetchAllData();
  } catch (err) {
    alert('Error saving promotion: ' + err.message);
  }
}

async function deletePromotion(id) {
  if (!confirm('Are you sure you want to remove this promotion?')) return;
  try {
    await sb.from('promotions').delete().eq('id', id);
    fetchAllData();
  } catch (err) {
    alert('Error deleting promotion');
  }
}

function setStatusFilter(s) {
  filterStatus = s;
  renderCurrentView();
}

function renderStatusBadge(status) {
  if (status === 'pending') return `<span class="pill bg-amber-500/10 text-amber-500 text-[9px] px-2 py-0.5 font-black uppercase border border-amber-500/20">Pending Review</span>`;
  if (status === 'approved') return `<span class="pill bg-emerald-500/10 text-emerald-500 text-[9px] px-2 py-0.5 font-black uppercase border border-emerald-500/20">Approved</span>`;
  if (status === 'rejected') return `<span class="pill bg-red-500/10 text-red-500 text-[9px] px-2 py-0.5 font-black uppercase border border-red-500/20">Rejected</span>`;
  if (status === 'deleted') return `<span class="pill bg-red-500/15 text-red-400 text-[9px] px-2 py-0.5 font-black uppercase border border-red-500/30">Deleted</span>`;
  return `<span class="pill bg-white/5 text-muted text-[9px] px-2 py-0.5 font-black uppercase border border-white/10">Draft</span>`;
}

function toggleRejectInput(show) {
  const box = document.getElementById('reject-box');
  if (box) box.classList.toggle('hidden', !show);
}

async function handleQuickApprove() {
  if (!editingId) return;
  if (!confirm('Approve this submission? It will go live immediately.')) return;
  try {
    const { error } = await sb.from(editingType || 'apps').update({ status: 'approved' }).eq('id', editingId);
    if (error) throw error;
    closeModal('item-modal');
    fetchAllData();
  } catch (err) { alert(err.message); }
}

async function handleQuickReject() {
  if (!editingId) return;
  const comment = document.getElementById('rejection-comment').value;
  if (!comment) return alert('Please enter a rejection reason.');
  try {
    const { error } = await sb.from(editingType || 'apps').update({ 
      status: 'rejected', 
      rejection_comment: comment 
    }).eq('id', editingId);
    if (error) throw error;
    closeModal('item-modal');
    fetchAllData();
  } catch (err) { alert(err.message); }
}

async function handleModalDelete() {
  if (!editingId) return;
  const comment = prompt('Please enter the reason for deletion:');
  if (comment === null) return; // Cancelled
  if (!comment.trim()) {
    alert('Deletion reason is required.');
    return;
  }
  try {
    const { error } = await sb.from(editingType || 'apps').update({ 
      status: 'deleted', 
      rejection_comment: comment.trim() 
    }).eq('id', editingId);
    if (error) throw error;
    alert('Item status successfully updated to Deleted!');
    closeModal('item-modal');
    fetchAllData();
  } catch (err) { alert('Failed to delete item: ' + err.message); }
}


// ── EXPOSE TO WINDOW ───────────────────────────────────────────────────────────
window.setRoute = setRoute;
window.init = init;
window.testConnection = testConnection;
window.editItem = (id, type) => { const list = type === 'apps' ? data.apps : data.games; openItemModal(list.find(it => it.id === id)); };
window.editCategory = (id) => openCatModal(data.categories.find(c => c.id === id));
window.deleteItem = deleteItem;
window.handleModalDelete = handleModalDelete;
window.deleteCategory = deleteCategory;
window.seedSupabase = seedSupabase;
window.saveSettings = saveSettings;
window.closeModal = closeModal;
window.openItemModal = openItemModal;
window.openCatModal = openCatModal;
window.previewFile = previewFile;
window.previewScreenshots = previewScreenshots;
window.setStatusFilter = setStatusFilter;
window.handleQuickApprove = handleQuickApprove;
window.handleQuickReject = handleQuickReject;
window.toggleRejectInput = toggleRejectInput;
window.clearFilter = () => { filterCategory = null; renderCurrentView(); };
window.viewUser = (id) => { selectedUserId = id; renderCurrentView(); };
window.editPromotion = openPromoModal;
window.deletePromotion = deletePromotion;
window.closePromoModal = closePromoModal;
window.setRegionFilter = setRegionFilter;
window.setSearchFilter = setSearchFilter;
window.openPromoModal = openPromoModal;
window.togglePromoSection = togglePromoSection;
window.filterPromoType = filterPromoType;
window.updatePromoDate = updatePromoDate;
window.togglePromoActive = togglePromoActive;
window.setPromoRegion = setPromoRegion;
