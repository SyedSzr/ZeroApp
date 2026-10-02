const { createClient } = require('@supabase/supabase-js');
const SB_URL = 'https://sjotifqahfcylcooaqxm.supabase.co';
const SB_KEY = 'sb_publishable_3h4-HTzlMANQA-T2FMaavQ_uso2rIGj';

const supabase = createClient(SB_URL, SB_KEY);

async function testGame() {
  const payload = {
    id: 'test-game-12345',
    name: 'Test Game',
    description: 'Test',
    long_description: 'Test',
    url: 'https://test.com',
    region: 'Global',
    category: '1',
    user_id: null,
    status: 'pending',
    tags: [],
    gameCategory: '1'
  };
  const { data, error } = await supabase.from('games').upsert(payload);
  console.log('Game Insert Error:', error);
}

async function testApp() {
  const payload = {
    id: 'test-app-12345',
    name: 'Test App',
    description: 'Test',
    long_description: 'Test',
    url: 'https://test.com',
    region: 'Global',
    category: '1',
    user_id: null,
    status: 'pending',
    tags: [],
    homeCategory: '1'
  };
  const { data, error } = await supabase.from('apps').upsert(payload);
  console.log('App Insert Error:', error);
}

async function run() {
  await testGame();
  await testApp();
}

run();
