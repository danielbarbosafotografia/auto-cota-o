import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ffkurwkjhwagxgnznlvy.supabase.co',
  'sb_publishable_qCobH5qR2ef7f1yjl38xjQ_n5ccVm3D'
);

const exactAddons = [
  { 
    name: 'Alagamento', 
    price: 15.90, 
    description: 'Proteção adicional para seu veículo.',
    active: true
  },
  { 
    name: 'Guincho de 1000 km', 
    price: 19.90, 
    description: 'Proteção adicional para seu veículo.',
    active: true
  },
  { 
    name: 'Terceiros até R$ 300.000,00', 
    price: 19.90, 
    description: 'Proteção adicional para seu veículo.',
    active: true
  },
  { 
    name: '100% vidros/farol/retrovisor/lanterna nacional', 
    price: 19.90, 
    description: 'Proteção adicional para seu veículo.',
    active: true
  },
  { 
    name: 'Indenização 100% FIPE (veículos com leilão ou sinistro)', 
    price: 39.90, 
    description: 'Proteção adicional para seu veículo.',
    active: true
  },
  { 
    name: 'Cobertura 100% para todos os vidros, retrovisores, faróis e lanternas (somente nacionais)', 
    price: 19.90, 
    description: 'Proteção adicional para seu veículo.',
    active: true
  }
];

async function resetAddons() {
  console.log('Limpando tabela de addons...');
  
  // Primeiro, desativa todos os atuais (ou deleta se preferir, mas desativar é mais seguro se houver chaves estrangeiras)
  // Como é um ambiente de dev e queremos exatamente esses, vamos deletar se possível.
  const { error: deleteError } = await supabase
    .from('addons')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos

  if (deleteError) {
    console.log('Aviso: Não foi possível deletar todos (talvez restrição de FK). Desativando em vez disso...');
    await supabase.from('addons').update({ active: false }).neq('id', '0');
  }

  console.log('Inserindo novos addons...');
  const { error: insertError } = await supabase
    .from('addons')
    .insert(exactAddons);

  if (insertError) {
    console.error('Erro ao inserir addons:', insertError);
  } else {
    console.log('Addons resetados com sucesso para a lista exata solicitada!');
  }
}

resetAddons();
