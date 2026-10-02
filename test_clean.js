const { createClient } = require('@supabase/supabase-js');
const SB_URL = 'https://sjotifqahfcylcooaqxm.supabase.co';
const SB_KEY = 'sb_publishable_3h4-HTzlMANQA-T2FMaavQ_uso2rIGj';
const supabase = createClient(SB_URL, SB_KEY);
async function run() {
  await supabase.from('games').delete().eq('id', 'test-game-12345');
  await supabase.from('apps').delete().eq('id', 'test-app-12345');
}
run();
