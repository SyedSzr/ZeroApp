// ── SUPABASE CONFIG ───────────────────────────────────────────────────────────
const SB_URL = 'https://sjotifqahfcylcooaqxm.supabase.co';
const SB_KEY = 'sb_publishable_3h4-HTzlMANQA-T2FMaavQ_uso2rIGj';

const supabase = window.supabase.createClient(SB_URL, SB_KEY);

// ── STATE ──────────────────────────────────────────────────────────────────────
let currentRoute = 'dashboard';
let data = { apps: [], games: [], categories: [], settings: {} };
let editingId = null;

// ── INITIALIZATION ─────────────────────────────────────────────────────────────
async function init() {
  await fetchAllData();
  setRoute('dashboard');
  setupRealtime();
  setupEventListeners();
}

async function fetchAllData() {
  const syncEl = document.getElementById('sync-status');
  try {
    const [resApps, resGames, resCats, resSettings] = await Promise.all([
      supabase.from('apps').select('*'),
      supabase.from('games').select('*'),
      supabase.from('categories').select('*'),
      supabase.from('settings').select('*')
    ]);

    if (resApps.error) throw resApps.error;
    if (resGames.error) throw resGames.error;
    if (resCats.error) throw resCats.error;

    data.apps = resApps.data || [];
    data.games = resGames.data || [];
    data.categories = resCats.data || [];
    
    const sMap = {};
    (resSettings.data || []).forEach(s => sMap[s.key] = s.value);
    data.settings = sMap;

    renderCurrentView();
    showSyncStatus('Connected', 'bg-emerald-500');
  } catch (err) {
    console.error('Fetch error:', err);
    showSyncStatus('Error: Check RLS', 'bg-red-500');
    // Still render with local data if possible or show empty state
    renderCurrentView();
  }
}

function showSyncStatus(msg, colorClass) {
  const el = document.getElementById('sync-status');
  el.className = `flex items-center gap-2 px-3 py-1.5 rounded-full ${colorClass}/10 border ${colorClass}/20 ${colorClass.replace('bg-','text-')} text-xs font-bold transition-all`;
  el.innerHTML = `<span class="w-2 h-2 rounded-full ${colorClass} animate-pulse"></span> ${msg}`;
  el.style.opacity = '1';
}

// ── ROUTING ────────────────────────────────────────────────────────────────────
function setRoute(route) {
  currentRoute = route;
  
  // Update UI Sidebar
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('tab-active', el.dataset.route === route);
  });

  // Update Header
  const header = document.getElementById('route-header');
  const addBtn = document.getElementById('main-add-btn');
  
  addBtn.classList.remove('hidden');
  addBtn.onclick = () => openItemModal();

  switch(route) {
    case 'dashboard':
      header.innerHTML = `<h2 class="text-white font-bold text-lg">Command Center</h2><p class="text-muted text-xs">Overview of your platform</p>`;
      addBtn.classList.add('hidden');
      break;
    case 'apps':
      header.innerHTML = `<h2 class="text-white font-bold text-lg">App Catalog</h2><p class="text-muted text-xs">Manage ${data.apps.length} native-style apps</p>`;
      break;
    case 'games':
      header.innerHTML = `<h2 class="text-white font-bold text-lg">Game Feed</h2><p class="text-muted text-xs">Manage ${data.games.length} immersive games</p>`;
      break;
    case 'categories':
      header.innerHTML = `<h2 class="text-white font-bold text-lg">Classification</h2><p class="text-muted text-xs">Define app and game groups</p>`;
      addBtn.onclick = () => openCatModal();
      break;
    case 'settings':
      header.innerHTML = `<h2 class="text-white font-bold text-lg">System Configuration</h2><p class="text-muted text-xs">Global platform parameters</p>`;
      addBtn.classList.add('hidden');
      break;
  }

  renderCurrentView();
}

// ── VIEW RENDERING ─────────────────────────────────────────────────────────────
function renderCurrentView() {
  const container = document.getElementById('view-container');
  
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
          <button onclick="seedSupabase()" class="w-full py-4 bg-accent text-white font-black rounded-2xl shadow-lg glow-purple active:scale-95 transition-all">
             RUN FULL SYNC (data.js → Supabase)
          </button>
        </div>
      </div>
    `;
  } else if (currentRoute === 'apps' || currentRoute === 'games') {
    const list = currentRoute === 'apps' ? data.apps : data.games;
    container.innerHTML = `
      <div class="glass rounded-[32px] overflow-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="text-muted text-[11px] font-black uppercase tracking-widest border-b border-white/5">
              <th class="px-8 py-4">Item</th>
              <th class="px-8 py-4">Category</th>
              <th class="px-8 py-4">Rating</th>
              <th class="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(item => `
              <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td class="px-8 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-bg flex items-center justify-center text-xl">${item.emoji}</div>
                    <div>
                      <p class="text-white font-bold text-sm">${item.name}</p>
                      <p class="text-muted text-[10px] truncate max-w-[150px]">${item.url}</p>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-4">
                  <span class="pill bg-accent/10 text-accent text-[10px] px-2 py-1 font-bold uppercase">${item.homeCategory || item.gameCategory}</span>
                </td>
                <td class="px-8 py-4 text-white font-bold text-sm">${item.rating}</td>
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
            <div class="flex gap-2">
              <button onclick="editCategory('${cat.id}')" class="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-white transition-all">Edit</button>
              <button onclick="deleteCategory('${cat.id}')" class="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-[10px] font-bold uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-all">Delete</button>
            </div>
          </div>
        `).join('')}
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
                <option value="on" ${data.settings.maintenance === 'on' ? 'selected' : ''}>Under Maintenance (Admin Only)</option>
              </select>
           </div>
           <div>
              <label class="block text-muted text-[10px] font-black uppercase tracking-widest mb-3">System Greeting (Override)</label>
              <input type="text" name="greeting_override" value="${data.settings.greeting_override || ''}" placeholder="Leave empty for auto-greeting" class="w-full px-5 py-4 rounded-2xl bg-card border border-border text-white text-sm" />
           </div>
           <button type="submit" class="w-full py-5 bg-accent text-white font-black rounded-3xl shadow-lg glow-purple active:scale-95 transition-all">
              SAVE GLOBAL CONFIGURATION
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
  const type = currentRoute; // 'apps' or 'games'
  
  const payload = {
    id: fd.get('id'),
    name: fd.get('name'),
    emoji: fd.get('emoji'),
    url: fd.get('url'),
    rating: parseFloat(fd.get('rating')),
    reviews: fd.get('reviews'),
    description: fd.get('description'),
  };

  if (type === 'apps') payload.homeCategory = fd.get('category_select');
  else payload.gameCategory = fd.get('category_select');

  const { error } = await supabase.from(type).upsert(payload);
  if (error) alert('Error: ' + error.message);
  else closeModal('item-modal');
}

async function handleCatSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = {
    id: fd.get('id'),
    label: fd.get('label'),
    emoji: fd.get('emoji'),
    type: fd.get('type'),
    grad: fd.get('grad'),
  };
  const { error } = await supabase.from('categories').upsert(payload);
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
  const { error } = await supabase.from('settings').upsert(updates);
  if (error) alert('Error saving settings: ' + error.message);
  else alert('Settings saved successfully!');
}

async function deleteItem(id, type) {
  if (confirm('Delete this item?')) await supabase.from(type).delete().eq('id', id);
}

async function deleteCategory(id) {
  if (confirm('Delete category? (This won\'t delete apps in it)')) await supabase.from('categories').delete().eq('id', id);
}

// ── MODALS ─────────────────────────────────────────────────────────────────────
function openItemModal(item = null) {
  const form = document.getElementById('item-form');
  const select = document.getElementById('item-category-select');
  
  // Filter categories by type (app vs game)
  const catType = currentRoute === 'apps' ? 'app' : 'game';
  const filteredCats = data.categories.filter(c => c.type === catType);
  
  select.innerHTML = filteredCats.map(c => `<option value="${c.id}">${c.emoji} ${c.label}</option>`).join('');
  
  if (item) {
    editingId = item.id;
    form.id.value = item.id;
    form.name.value = item.name;
    form.emoji.value = item.emoji;
    form.url.value = item.url;
    form.rating.value = item.rating;
    form.reviews.value = item.reviews;
    form.description.value = item.description || '';
    select.value = item.homeCategory || item.gameCategory;
    document.getElementById('item-modal-title').innerText = 'Edit Item';
  } else {
    editingId = null;
    form.reset();
    document.getElementById('item-modal-title').innerText = 'Add New ' + (currentRoute === 'apps' ? 'App' : 'Game');
  }
  
  document.getElementById('item-modal').classList.remove('hidden');
}

function openCatModal(cat = null) {
  const form = document.getElementById('cat-form');
  if (cat) {
    form.id.value = cat.id;
    form.label.value = cat.label;
    form.emoji.value = cat.emoji;
    form.type.value = cat.type;
    form.grad.value = cat.grad;
  } else {
    form.reset();
  }
  document.getElementById('cat-modal').classList.remove('hidden');
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// ── UI HELPERS ─────────────────────────────────────────────────────────────────
function showSyncStatus() {
  const el = document.getElementById('sync-status');
  el.style.opacity = '1';
  setTimeout(() => el.style.opacity = '0.5', 2000);
}

function setupEventListeners() {
  document.getElementById('item-form').onsubmit = handleItemSubmit;
  document.getElementById('cat-form').onsubmit = handleCatSubmit;
}

// ── SEED LOGIC ─────────────────────────────────────────────────────────────────
async function seedSupabase() {
  if (!confirm('This will overwrite cloud data with local data.js contents. Proceed?')) return;
  console.log('🚀 Seeding everything...');
  
  try {
    // 1. Categories
    const catsToPush = [
      ...HOME_CATEGORIES.map(c => ({ ...c, type: 'app' })),
      ...GAME_CATEGORIES.map(c => ({ ...c, type: 'game' }))
    ];
    await supabase.from('categories').upsert(catsToPush);
    
    // 2. Apps
    await supabase.from('apps').upsert(APPS);
    
    // 3. Games
    await supabase.from('games').upsert(GAMES);
    
    alert('✅ SEED SUCCESSFUL! Everything is now in the cloud.');
  } catch (err) {
    alert('❌ Seed failed: ' + err.message);
  }
}

// Global exposure
window.editItem = (id, type) => {
  const list = type === 'apps' ? data.apps : data.games;
  openItemModal(list.find(it => it.id === id));
};
window.editCategory = (id) => openCatModal(data.categories.find(c => c.id === id));

// Launch
init();
