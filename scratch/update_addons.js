import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const newAddons = [
  { 
    name: 'Alagamento', 
    price: 15.90, 
    description: 'Proteção adicional para seu veículo.' 
  },
  { 
    name: 'Guincho de 1000 km', 
    price: 19.90, 
    description: 'Proteção adicional para seu veículo.' 
  },
  { 
    name: 'Terceiros até R$ 300.000,00', 
    price: 19.90, 
    description: 'Proteção adicional para seu veículo.' 
  },
  { 
    name: '100% vidros/farol/retrovisor/lanterna nacional', 
    price: 19.90, 
    description: 'Proteção adicional para seu veículo.' 
  },
  { 
    name: 'Indenização 100% FIPE (veículos com leilão ou sinistro)', 
    price: 39.90, 
    description: 'Proteção adicional para seu veículo.' 
  },
  { 
    name: 'Cobertura 100% para todos os vidros, retrovisores, faróis e lanternas (somente nacionais)', 
    price: 19.90, 
    description: 'Proteção adicional para seu veículo.' 
  }
];

async function updateAddons() {
  console.log('Iniciando atualização de addons...');
  
  for (const addon of newAddons) {
    // Tenta encontrar pelo nome para atualizar ou insere se não existir
    const { data: existing } = await supabase
      .from('addons')
      .select('id')
      .eq('name', addon.name)
      .single();

    if (existing) {
      console.log(`Atualizando: ${addon.name}`);
      await supabase.from('addons').update(addon).eq('id', existing.id);
    } else {
      console.log(`Inserindo: ${addon.name}`);
      await supabase.from('addons').insert(addon);
    }
  }
  
  console.log('Atualização concluída!');
}

updateAddons();
