// ── SEED SCRIPT ────────────────────────────────────────────────────────────────
// Run this in the browser console of your ZeroApp to push all local data to Supabase.
// Make sure you have your SB_URL and SB_KEY set in js/admin.js first!

async function seedSupabase() {
  console.log('🚀 Starting Supabase Seed...');
  
  if (typeof APPS === 'undefined' || typeof GAMES === 'undefined') {
    console.error('❌ Static data (APPS/GAMES) not found. Make sure data.js is loaded.');
    return;
  }

  // 1. Push Categories
  console.log('📦 Pushing Categories...');
  const catsToPush = [
    ...HOME_CATEGORIES.map(c => ({ ...c, type: 'app' })),
    ...GAME_CATEGORIES.map(c => ({ ...c, type: 'game' }))
  ];
  const { error: catErr } = await supabase.from('categories').upsert(catsToPush);
  if (catErr) console.error('❌ Error pushing categories:', catErr);
  else console.log('✅ Categories synced successfully!');

  // 2. Push Apps
  console.log('📦 Pushing Apps...');
  const { error: appErr } = await supabase.from('apps').upsert(APPS);
  if (appErr) console.error('❌ Error pushing apps:', appErr);
  else console.log('✅ Apps synced successfully!');

  // 3. Push Games
  console.log('📦 Pushing Games...');
  const { error: gameErr } = await supabase.from('games').upsert(GAMES);
  if (gameErr) console.error('❌ Error pushing games:', gameErr);
  else console.log('✅ Games synced successfully!');

  console.log('✨ Seeding Complete!');
}

window.seedSupabase = seedSupabase;
