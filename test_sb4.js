const { createClient } = require('@supabase/supabase-js');
const SB_URL = 'https://sjotifqahfcylcooaqxm.supabase.co';
const SB_KEY = 'sb_publishable_3h4-HTzlMANQA-T2FMaavQ_uso2rIGj';

const supabase = createClient(SB_URL, SB_KEY);

async function test() {
  const payload = {
    id: 'test-game-12345',
    name: 'Test Game',
    description: 'Test',
    long_description: 'Test',
    url: 'https://test.com',
    region: 'Global',
    category: '1',
    homeCategory: '1',
    gameCategory: '1',
    user_id: null,
    status: 'pending',
    tags: []
  };
  const { data, error } = await supabase.from('games').upsert(payload);
  console.log('Insert Error:', error);
}

test();
