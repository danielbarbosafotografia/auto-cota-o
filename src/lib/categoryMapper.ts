// Utility to infer category based on Brand and Model from FIPE
// This implements the business rules from the Auto Excelência images.

interface CategoryMatch {
  keywords: string[];
  category: string; // Must match one of the names in vehicle_categories
  status?: 'active' | 'consult' | 'restricted';
}

const BRAND_RULES: Record<string, CategoryMatch[]> = {
  'HONDA': [
    { keywords: ['CIVIC', 'CITY', 'FIT'], category: 'NACIONAL' },
    { keywords: ['CR-V', 'HR-V'], category: 'CAMINHONETE IMPORTADA' },
    { keywords: ['ACCORD'], category: 'NACIONAL', status: 'restricted' }, // NÃO FAZ
  ],
  'HYUNDAI': [
    { keywords: ['HB20'], category: 'NACIONAL' },
    { keywords: ['CRETA'], category: 'CAMINHONETE NACIONAL' },
    { keywords: ['IX35'], category: 'CAMINHONETE IMPORTADA' },
    { keywords: ['AZERA', 'ELANTRA', 'SONATA'], category: 'IMPORTADO', status: 'consult' },
    { keywords: ['SANTA FÉ', 'I30', 'TUCSON', 'VELOSTER'], category: 'IMPORTADO', status: 'restricted' }, // NÃO FAZ
  ],
  'TOYOTA': [
    { keywords: ['COROLLA', 'ETIOS', 'YARIS', 'FIELDER'], category: 'NACIONAL' },
    { keywords: ['SW4', 'HILUX', 'PRIUS', 'CAMRY'], category: 'IMPORTADO', status: 'restricted' }, // NÃO FAZ
  ],
  'VOLKSWAGEN': [
    { keywords: ['GOL', 'FOX', 'CROSSFOX', 'GOLF', 'SPACEFOX', 'UP', 'VIRTUS', 'VOYAGE', 'POLO'], category: 'NACIONAL' },
    { keywords: ['SAVEIRO'], category: 'UTILITÁRIO' },
    { keywords: ['GOLF GTI', 'JETTA', 'AMAROK', 'T-CROSS', 'TAOS', 'TIGUAN'], category: 'CAMINHONETE ESPECIAL' },
    { keywords: ['TOUAREG', 'BORA'], category: 'IMPORTADO', status: 'restricted' },
  ],
  'CHEVROLET': [
    { keywords: ['ONIX', 'PRISMA', 'CELTA', 'CORSA', 'CLASSIC', 'COBALT', 'CRUZE', 'MERIVA', 'SPIN', 'VECTRA', 'ASTRA', 'AGILE'], category: 'NACIONAL' },
    { keywords: ['MONTANA'], category: 'UTILITÁRIO' },
    { keywords: ['S10', 'TRACKER', 'CAPTIVA'], category: 'CAMINHONETE IMPORTADA' },
    { keywords: ['CAMARO', 'SONIC', 'ZAFIRA', 'KADET', 'BLAZER', 'OMEGA', 'MALIBU'], category: 'IMPORTADO', status: 'restricted' },
  ],
  'FIAT': [
    { keywords: ['UNO', 'MOBI', 'ARGO', 'CRONOS', 'PALIO', 'SIENA', 'PUNTO', 'PULSE', 'DOBLO'], category: 'NACIONAL' },
    { keywords: ['STRADA', 'FIORINO'], category: 'UTILITÁRIO' },
    { keywords: ['TORO'], category: 'CAMINHONETE NACIONAL' },
    { keywords: ['FREEMONT'], category: 'CAMINHONETE ESPECIAL' },
    { keywords: ['STILO', 'LINEA', 'MAREA', 'BRAVA', 'BRAVO'], category: 'IMPORTADO', status: 'restricted' },
  ]
};

export const inferCategory = (brand: string, model: string, type: string): { categoryName: string | null, status: 'active' | 'consult' | 'restricted' } => {
  const b = brand.toUpperCase();
  const m = model.toUpperCase();

  // Handle Motorcycles
  if (type === 'motos') {
    if (m.includes('CARENADA')) return { categoryName: 'MOTO', status: 'restricted' };
    return { categoryName: 'MOTO', status: 'active' };
  }

  // Handle Trucks
  if (type === 'caminhoes') {
    return { categoryName: '7000 KG', status: 'active' };
  }

  // Check specific brand rules
  const rules = BRAND_RULES[b] || [];
  for (const rule of rules) {
    if (rule.keywords.some(kw => m.includes(kw))) {
      return { 
        categoryName: rule.category, 
        status: rule.status || 'active' 
      };
    }
  }

  // Fallback defaults if no rule matched
  if (m.includes('PICK-UP') || m.includes('PICKUP') || m.includes('CABINE DUPLA')) {
    return { categoryName: 'CAMINHONETE NACIONAL', status: 'consult' };
  }

  // Default to Nacional but mark as consult so the agent knows to verify
  return { categoryName: 'NACIONAL', status: 'consult' };
};
