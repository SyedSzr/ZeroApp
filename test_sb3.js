const { createClient } = require('@supabase/supabase-js');
const SB_URL = 'https://sjotifqahfcylcooaqxm.supabase.co';
const SB_KEY = 'sb_publishable_3h4-HTzlMANQA-T2FMaavQ_uso2rIGj';

const supabase = createClient(SB_URL, SB_KEY);

async function test() {
  const { data, error } = await supabase.from('apps').select('*').limit(1);
  console.log(data);
}

test();
