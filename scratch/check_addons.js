import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkAddons() {
  const { data, error } = await supabase.from('addons').select('*');
  if (error) {
    console.error('Erro:', error);
  } else {
    console.log(`Total de addons: ${data.length}`);
    console.log('Addons atuais:', JSON.stringify(data, null, 2));
  }
}

checkAddons();
