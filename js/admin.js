// ── SUPABASE CONFIG ───────────────────────────────────────────────────────────
const SB_URL = 'https://sjotifqahfcylcooaqxm.supabase.co';
const SB_KEY = 'sb_publishable_3h4-HTzlMANQA-T2FMaavQ_uso2rIGj';

const sb = window.supabase.createClient(SB_URL, SB_KEY);

// ── STATE ──────────────────────────────────────────────────────────────────────
let currentRoute = 'dashboard';
let data = { apps: [], games: [], categories: [], settings: {}, profiles: [] };
let editingId = null;
let selectedUserId = null;
let filterCategory = null;
let filterStatus = 'all'; // 'all', 'pending', 'approved', 'rejected'

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
    const [resApps, resGames, resCats, resSettings] = await Promise.all([
      sb.from('apps').select('*'),
      sb.from('games').select('*'),
      sb.from('categories').select('*'),
      sb.from('settings').select('*')
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
        ${renderStatCard('Categories', data.categories.length, '🏷️', 'Active groups')}
        ${renderStatCard('System Status', 'Online', '⚡', 'Supabase Connected')}
      </div>
      <div class="grid grid-cols-2 gap-8">
        <div class="glass p-8 rounded-[32px]">
          <h3 class="text-white font-bold mb-4">Quick Actions</h3>
          <div class="space-y-3">
             <button onclick="setRoute('apps')" class="w-full py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-left text-sm transition-all border border-white/5">Manage Applications</button>
             <button onclick="setRoute('games')" class="w-full py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-left text-sm transition-all border border-white/5">Manage Games Feed</button>
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
  } else if (currentRoute === 'apps' || currentRoute === 'games') {
    let list = currentRoute === 'apps' ? data.apps : data.games;
    
    if (filterCategory) {
      list = list.filter(item => (item.homeCategory === filterCategory || item.gameCategory === filterCategory));
    }
    if (filterStatus !== 'all') {
      list = list.filter(item => item.status === filterStatus);
    }

    const pendingCount = (currentRoute === 'apps' ? data.apps : data.games).filter(i => i.status === 'pending').length;

    container.innerHTML = `
      <div class="flex flex-col gap-6 mb-6">
        <div class="flex items-center gap-4 bg-card border border-border p-2 rounded-2xl w-fit">
          <button onclick="setStatusFilter('all')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}">All Items</button>
          <button onclick="setStatusFilter('pending')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${filterStatus === 'pending' ? 'bg-amber-500/20 text-amber-500' : 'text-muted hover:text-white'}">
            Pending Approval
            ${pendingCount > 0 ? `<span class="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">${pendingCount}</span>` : ''}
          </button>
          <button onclick="setStatusFilter('approved')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-500' : 'text-muted hover:text-white'}">Approved</button>
          <button onclick="setStatusFilter('rejected')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === 'rejected' ? 'bg-red-500/20 text-red-500' : 'text-muted hover:text-white'}">Rejected</button>
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

async function deleteItem(id, type) { if (confirm('Delete item?')) await sb.from(type).delete().eq('id', id); }
async function deleteCategory(id) { if (confirm('Delete category?')) await sb.from('categories').delete().eq('id', id); }

// ── MODALS ─────────────────────────────────────────────────────────────────────
function openItemModal(item = null) {
  editingId = item ? item.id : null;
  const form = document.getElementById('item-form');
  const select = document.getElementById('item-category-select');
  const catType = currentRoute === 'apps' ? 'app' : 'game';
  const filteredCats = data.categories.filter(c => c.type === catType);
  if (select) select.innerHTML = filteredCats.map(c => `<option value="${c.id}">${c.emoji} ${c.label}</option>`).join('');
  
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

function setStatusFilter(s) {
  filterStatus = s;
  renderCurrentView();
}

function renderStatusBadge(status) {
  if (status === 'pending') return `<span class="pill bg-amber-500/10 text-amber-500 text-[9px] px-2 py-0.5 font-black uppercase border border-amber-500/20">Pending Review</span>`;
  if (status === 'approved') return `<span class="pill bg-emerald-500/10 text-emerald-500 text-[9px] px-2 py-0.5 font-black uppercase border border-emerald-500/20">Approved</span>`;
  if (status === 'rejected') return `<span class="pill bg-red-500/10 text-red-500 text-[9px] px-2 py-0.5 font-black uppercase border border-red-500/20">Rejected</span>`;
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
    const { error } = await sb.from(currentRoute).update({ status: 'approved' }).eq('id', editingId);
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
    const { error } = await sb.from(currentRoute).update({ 
      status: 'rejected', 
      rejection_comment: comment 
    }).eq('id', editingId);
    if (error) throw error;
    closeModal('item-modal');
    fetchAllData();
  } catch (err) { alert(err.message); }
}

// ── EXPOSE TO WINDOW ───────────────────────────────────────────────────────────
window.setRoute = setRoute;
window.init = init;
window.testConnection = testConnection;
window.editItem = (id, type) => { const list = type === 'apps' ? data.apps : data.games; openItemModal(list.find(it => it.id === id)); };
window.editCategory = (id) => openCatModal(data.categories.find(c => c.id === id));
window.deleteItem = deleteItem;
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
