import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ffkurwkjhwagxgnznlvy.supabase.co',
  'sb_publishable_qCobH5qR2ef7f1yjl38xjQ_n5ccVm3D'
);

async function listAddons() {
  const { data, error } = await supabase.from('addons').select('*');
  if (error) {
    console.error('Erro ao buscar addons:', error);
  } else {
    console.log('Addons atuais no banco:');
    console.log(JSON.stringify(data, null, 2));
  }
}

listAddons();
