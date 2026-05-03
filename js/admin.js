// ── SUPABASE CONFIG ───────────────────────────────────────────────────────────
const SB_URL = 'https://sjotifqahfcylcooaqxm.supabase.co';
const SB_KEY = 'sb_publishable_3h4-HTzlMANQA-T2FMaavQ_uso2rIGj';

const supabase = window.supabase.createClient(SB_URL, SB_KEY);

// ── STATE ──────────────────────────────────────────────────────────────────────
let allItems = [];
let editingId = null;

// ── INITIALIZATION ─────────────────────────────────────────────────────────────
async function init() {
  fetchCatalog();
  setupEventListeners();
}

async function fetchCatalog() {
  const { data: apps, error: err1 } = await supabase.from('apps').select('*');
  const { data: games, error: err2 } = await supabase.from('games').select('*');

  if (err1 || err2) {
    console.error('Fetch error:', err1 || err2);
    return;
  }

  // Combine for the dashboard table
  const appsWithMeta = apps.map(a => ({ ...a, type: 'apps' }));
  const gamesWithMeta = games.map(g => ({ ...g, type: 'games' }));
  
  allItems = [...appsWithMeta, ...gamesWithMeta].sort((a, b) => b.created_at.localeCompare(a.created_at));
  
  renderTable();
  updateStats(apps.length, games.length);
}

function updateStats(appCount, gameCount) {
  document.getElementById('stat-apps').textContent = appCount;
  document.getElementById('stat-games').textContent = gameCount;
}

function renderTable() {
  const list = document.getElementById('catalog-list');
  list.innerHTML = allItems.map(item => `
    <tr class="border-b border-white/5 hover:bg-white/5 transition-colors group">
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
        <span class="text-[10px] font-bold uppercase tracking-wider text-muted">${item.type === 'apps' ? '📱 App' : '🎮 Game'}</span>
      </td>
      <td class="px-8 py-4">
        <span class="pill bg-accent/10 text-accent text-[10px] px-2 py-1 font-bold uppercase">${item.category}</span>
      </td>
      <td class="px-8 py-4 text-white font-bold text-sm">${item.rating}</td>
      <td class="px-8 py-4 text-right">
        <button onclick="editItem('${item.id}', '${item.type}')" class="text-muted hover:text-white transition-colors mr-3 text-sm font-bold">Edit</button>
        <button onclick="deleteItem('${item.id}', '${item.type}')" class="text-red-500/50 hover:text-red-500 transition-colors text-sm font-bold">Delete</button>
      </td>
    </tr>
  `).join('');
}

// ── ACTIONS ────────────────────────────────────────────────────────────────────
async function handleFormSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const type = fd.get('type');
  
  const payload = {
    id: fd.get('id'),
    name: fd.get('name'),
    category: fd.get('category'),
    emoji: fd.get('emoji'),
    url: fd.get('url'),
    rating: parseFloat(fd.get('rating')),
    reviews: fd.get('reviews'),
  };

  const { error } = await supabase.from(type).upsert(payload);
  
  if (error) {
    alert('Error saving: ' + error.message);
  } else {
    closeModal();
    fetchCatalog();
  }
}

async function deleteItem(id, type) {
  if (!confirm('Are you sure you want to delete this?')) return;
  const { error } = await supabase.from(type).delete().eq('id', id);
  if (error) alert('Error deleting: ' + error.message);
  else fetchCatalog();
}

function editItem(id, type) {
  const item = allItems.find(it => it.id === id && it.type === type);
  if (!item) return;
  
  editingId = id;
  const form = document.getElementById('app-form');
  form.id.value = item.id;
  form.name.value = item.name;
  form.category.value = item.category;
  form.emoji.value = item.emoji;
  form.url.value = item.url;
  form.rating.value = item.rating;
  form.reviews.value = item.reviews;
  form.type.value = item.type;
  
  document.getElementById('modal-title').textContent = 'Edit Item';
  openModal();
}

// ── UI HELPERS ─────────────────────────────────────────────────────────────────
function openModal() { document.getElementById('modal').classList.remove('hidden'); }
function closeModal() { 
  document.getElementById('modal').classList.add('hidden'); 
  document.getElementById('app-form').reset();
  document.getElementById('modal-title').textContent = 'Add New Item';
  editingId = null;
}

function setupEventListeners() {
  document.getElementById('add-btn').onclick = openModal;
  document.getElementById('app-form').onsubmit = handleFormSubmit;
}

// Start
init();
