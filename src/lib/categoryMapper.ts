// Utility to infer category based on Brand, Model and Year from FIPE
// This implements the STRICT business rules from the Auto Excelência operational table.

interface CategoryMatch {
  keywords: string[];
  category: string;
  status?: 'active' | 'consult' | 'restricted';
  yearRange?: { min?: number; max?: number };
}

const BRAND_RULES: Record<string, CategoryMatch[]> = {
  'AUDI': [
    { keywords: ['A1', 'A4'], category: 'IMPORTADO' },
    { keywords: ['A3'], category: 'IMPORTADO', yearRange: { min: 2013 } },
    { keywords: ['TT'], category: 'ESPECIAL 1' },
    { keywords: ['Q3'], category: 'CAMINHONETE ESPECIAL' },
    { keywords: ['A5', 'Q7'], category: 'NÃO FAZ', status: 'restricted' },
  ],
  'KIA': [
    { keywords: ['BONGO'], category: '7 MIL KG' },
    { keywords: ['PICANTO'], category: 'IMPORTADO' },
    { keywords: ['SPORTAGE'], category: 'CAMINHONETE IMPORTADA' },
    { keywords: ['SORENTO', 'SANTA CRUZ'], category: 'CAMINHONETE ESPECIAL' },
    { keywords: ['MOHAVE', 'CARENS', 'CERATO', 'VERA CRUZ', 'SOUL', 'OPTIMA'], category: 'NÃO FAZ', status: 'restricted' },
  ],
  'CITROEN': [
    { keywords: ['C3', 'C3 TENDENCE'], category: 'NACIONAL' },
    { keywords: ['AIRCROSS', 'C3 PICASSO', 'C4 LOUNG', 'C4 CACTUS'], category: 'IMPORTADO' },
    { keywords: ['JUMPER'], category: '7 MIL KG' },
    { keywords: ['C4 GRAN PICASSO', 'C4 PALLAS', 'C4 PICASSO'], category: 'NÃO FAZ', status: 'restricted' },
  ],
  'LIFAN': [
    { keywords: ['X60', '530 TALENTE'], category: 'CAMINHONETE ESPECIAL' },
  ],
  'JEEP': [
    { keywords: ['COMPASS', 'RENEGADE'], category: 'CAMINHONETE IMPORTADA' },
    { keywords: ['CHEROKEE'], category: 'CONSULTAR', status: 'consult' },
  ],
  'MITSUBISHI': [
    { keywords: ['ASX', 'PAJERO'], category: 'CAMINHONETE IMPORTADA' },
    { keywords: ['TR4'], category: 'CAMINHONETE IMPORTADA', yearRange: { min: 2010 } },
    { keywords: ['TR4'], category: 'CAMINHONETE ESPECIAL', yearRange: { max: 2009 } },
    { keywords: ['OUTLANDER'], category: 'CAMINHONETE ESPECIAL' },
    { keywords: ['LANCER'], category: 'IMPORTADO' },
    { keywords: ['L200', 'AIRREK'], category: 'NÃO FAZ', status: 'restricted' },
  ],
  'JAC': [
    { keywords: ['J1', 'J2', 'J3', 'J5', 'J6'], category: 'ESPECIAL 1' },
  ],
  'BMW': [
    { keywords: ['116', '118', '130', '325', '328', '335'], category: 'ESPECIAL 1' },
    { keywords: ['125', '135', '320', '330'], category: 'IMPORTADO' },
    { keywords: ['X1'], category: 'CAMINHONETE IMPORTADA' },
    { keywords: ['X2', 'X3', 'X4', 'X5', 'X6'], category: 'NÃO FAZ', status: 'restricted' },
  ],
  'RENAULT': [
    { keywords: ['CLIO', 'SYMBOL', 'KWID', 'LOGAN', 'SANDERO'], category: 'NACIONAL' },
    { keywords: ['FLUENCE'], category: 'CONSULTAR', status: 'consult' },
    { keywords: ['KANGOO'], category: 'IMPORTADO' },
    { keywords: ['DUSTER', 'CAPTUR', 'OROCH'], category: 'CAMINHONETE NACIONAL' },
    { keywords: ['MASTER'], category: '7 MIL KG' },
    { keywords: ['MEGANE', 'SCENIC'], category: 'NÃO FAZ', status: 'restricted' },
  ],
  'CHEVROLET': [
    { keywords: ['ASTRA', 'AGILE', 'CELTA', 'CLASSIC', 'COBALT', 'CORSA', 'CRUZE', 'MERIVA', 'ONIX', 'PRISMA', 'SPIN', 'VECTRA'], category: 'NACIONAL' },
    { keywords: ['CAPTIVA', 'TRACKER'], category: 'CAMINHONETE IMPORTADA' },
    { keywords: ['MONTANA'], category: 'UTILITÁRIO' },
    { keywords: ['S10'], category: 'CAMINHONETE NACIONAL', yearRange: { min: 2005 } },
    { keywords: ['VECTRA GT'], category: 'IMPORTADO' },
    { keywords: ['SONIC', 'CAMARO', 'ZAFIRA', 'VECTRA 97', 'KADET', 'BLAZER', 'OMEGA', 'MALIBU'], category: 'NÃO FAZ', status: 'restricted' },
  ],
  'SUZUKI': [
    { keywords: ['GRAN E VITARA', 'JIMMY'], category: 'CAMINHONETE IMPORTADA' },
    { keywords: ['SX4'], category: 'IMPORTADO' },
  ],
  'HONDA': [
    { keywords: ['CITY', 'CIVIC', 'FIT'], category: 'NACIONAL' },
    { keywords: ['WR-V'], category: 'IMPORTADO' },
    { keywords: ['CR-V', 'HR-V'], category: 'CAMINHONETE IMPORTADA' },
    { keywords: ['ACCORD'], category: 'NÃO FAZ', status: 'restricted' },
  ],
  'VOLKSWAGEN': [
    { keywords: ['UP', 'VIRTUS', 'VOYAGE', 'POLO', 'CROSSFOX', 'FOX', 'GOL', 'GOLF', 'SPACEFOX'], category: 'NACIONAL' },
    { keywords: ['SAVEIRO'], category: 'UTILITÁRIO' },
    { keywords: ['GOLF GTI', 'JETTA 2.0', 'JETTA TSI'], category: 'IMPORTADO' },
    { keywords: ['JETTA VARIANTE', 'NEW BEETLE', 'PASSAT', 'PASSAT VARIANT', 'GOLF VARIANTE', 'NIVUS'], category: 'ESPECIAL 1' },
    { keywords: ['AMAROK'], category: 'CAMINHONETE NACIONAL' },
    { keywords: ['T-CROSS', 'TIGUAN'], category: 'CAMINHONETE ESPECIAL' },
    { keywords: ['TAOS'], category: 'CAMINHONETE IMPORTADA' },
    { keywords: ['KOMBI'], category: '7 MIL KG' },
    { keywords: ['TOUAREG', 'BORA'], category: 'NÃO FAZ', status: 'restricted' },
  ],
  'MERCEDES-BENZ': [
    { keywords: ['C180', 'C200', 'C250', 'C300'], category: 'CONSULTAR', status: 'consult' },
  ],
  'CHERY': [
    { keywords: ['CELER', 'CIELO', 'FACE'], category: 'ESPECIAL 1' },
    { keywords: ['QQ', 'TIGGO'], category: 'CAMINHONETE ESPECIAL' },
  ],
  'FIAT': [
    { keywords: ['500'], category: 'IMPORTADO' },
    { keywords: ['TORO'], category: 'CAMINHONETE NACIONAL' },
    { keywords: ['DUCATO'], category: '7 MIL KG' },
    { keywords: ['FREEMONT'], category: 'CAMINHONETE ESPECIAL' },
    { keywords: ['IDEA', 'CRONOS', 'DOBLO', 'ARGO', 'GRAN SIENA', 'SIENA', 'UNO', 'MOBI', 'PUNTO', 'PULSE', 'PALIO'], category: 'NACIONAL' },
    { keywords: ['STRADA', 'FIORINO'], category: 'UTILITÁRIO' },
    { keywords: ['STILO', 'LINEA', 'MAREA', 'BRAVA', 'BRAVO'], category: 'NÃO FAZ', status: 'restricted' },
  ],
  'DODGE': [
    { keywords: ['JOURNEY'], category: 'CAMINHONETE ESPECIAL' },
  ],
  'TOYOTA': [
    { keywords: ['COROLLA', 'ETIOS', 'FIELDER'], category: 'NACIONAL' },
    { keywords: ['YARIS'], category: 'IMPORTADO' },
    { keywords: ['SW4', 'HILUX', 'PRIUS', 'CAMRRY'], category: 'NÃO FAZ', status: 'restricted' },
  ],
  'NISSAN': [
    { keywords: ['VERSA', 'TIIDA', 'SENTRA', 'LIVINA', 'MARCH'], category: 'IMPORTADO' },
    { keywords: ['KICKS', 'FRONTIER'], category: 'CAMINHONETE NACIONAL' },
  ],
  'FORD': [
    { keywords: ['FIESTA', 'KA'], category: 'NACIONAL' },
    { keywords: ['NEW FIESTA', 'FOCUS ACIMA 2008'], category: 'IMPORTADO' },
    { keywords: ['ECOSPORT', 'RANGER'], category: 'CAMINHONETE NACIONAL' },
    { keywords: ['COURIER'], category: 'UTILITÁRIO' },
    { keywords: ['FOCUS ATÉ 2008', 'FUSION', 'EDGE'], category: 'ESPECIAL 1' },
    { keywords: ['F1000', 'F250'], category: '7 MIL KG' },
    { keywords: ['FOCUS AUT'], category: 'CONSULTAR', status: 'consult' },
    { keywords: ['LIGA NO BOTÃO', 'FUSION 2006', 'RANGER 2010'], category: 'NÃO FAZ', status: 'restricted' },
  ],
  'PEUGEOT': [
    { keywords: ['206', '207', '208', '2008'], category: 'NACIONAL' },
    { keywords: ['208 GT', '308'], category: 'IMPORTADO' },
    { keywords: ['HOGGAR'], category: 'CAMINHONETE NACIONAL' },
    { keywords: ['3008', '307', '408', '508'], category: 'NÃO FAZ', status: 'restricted' },
  ],
  'HYUNDAI': [
    { keywords: ['HB20'], category: 'NACIONAL' },
    { keywords: ['CRETA'], category: 'CAMINHONETE NACIONAL' },
    { keywords: ['IX35'], category: 'CAMINHONETE IMPORTADA' },
    { keywords: ['AZERA', 'ELANTRA', 'SONATA'], category: 'CONSULTAR', status: 'consult' },
    { keywords: ['SANTA FÉ', 'I30', 'TUCSON', 'VELOSTER'], category: 'NÃO FAZ', status: 'restricted' },
  ],
  'VOLVO': [
    { keywords: ['XC60'], category: 'CAMINHONETE ESPECIAL' },
  ],
};

export const inferCategory = (brand: string, model: string, type: string, year?: number): { categoryName: string | null, status: 'active' | 'consult' | 'restricted' } => {
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
  const brandName = Object.keys(BRAND_RULES).find(key => b.includes(key)) || b;
  const rules = BRAND_RULES[brandName] || [];
  
  for (const rule of rules) {
    if (rule.keywords.some(kw => m.includes(kw))) {
      // Check year range if applicable
      if (rule.yearRange && year) {
        if (rule.yearRange.min && year < rule.yearRange.min) continue;
        if (rule.yearRange.max && year > rule.yearRange.max) continue;
      }
      
      return { 
        categoryName: rule.category === 'NÃO FAZ' || rule.category === 'CONSULTAR' ? null : rule.category, 
        status: rule.status || 'active' 
      };
    }
  }

  // Fallback defaults: The user says "NÃO DEVE DEDUZIR".
  // So if not found, we should probably mark as CONSULTAR or restricted.
  return { categoryName: null, status: 'consult' };
};
