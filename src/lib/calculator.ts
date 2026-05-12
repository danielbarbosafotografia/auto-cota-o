import type { PricingRule, Addon } from '../types';

export type CategoryType =
  | 'NACIONAL'
  | 'IMPORTADO'
  | 'CAMINHONETE_NACIONAL'
  | 'CAMINHONETE_IMPORTADA'
  | 'ESPECIAL'
  | 'OUTROS';

export type CalculationResult = {
  fipeValue: number;
  fipePercentage: number;
  baseValue: number;           // FIPE * %
  fixedAddon: number;          // taxa administrativa (13.50 ou 3.50 para especial)
  glassValue: number;          // cobertura vidros/faróis/retrovisores inclusa na categoria
  trackerValue: number;
  leilaoSinistroValue: number;
  optionalAddonsValue: number;
  finalMonthlyValue: number;
  participationValue: number;
  categoryName: string;
  glassPercentage: number;
  categoryType: CategoryType;
};



export const calculateQuote = (
  fipeValue: number,
  rule: PricingRule,
  selectedAddons: Addon[],
  categoryName: string,
  hasLeilaoSinistro = false
): CalculationResult => {
  const fipeValueNum = Number(fipeValue);
  const fixedAddon = 13.50; // Taxa administrativa fixa obrigatória

  // 1. Base Value (Proteção Veicular)
  // Segue a regra: Até fipe_limit -> fixed_price; Acima -> fipeValue * percentage_above_limit
  let baseValue: number;
  if (fipeValueNum <= Number(rule.fipe_limit)) {
    baseValue = Number(rule.fixed_price);
  } else {
    baseValue = fipeValueNum * Number(rule.percentage_above_limit);
  }

  // 2. Participation Value (Cota de Participação / Franquia)
  // Segue a regra: Até participation_limit -> participation_fixed; Acima -> fipeValue * participation_percentage_above_limit
  let participationValue: number;
  if (fipeValueNum <= Number(rule.participation_limit)) {
    participationValue = Number(rule.participation_fixed);
  } else {
    participationValue = fipeValueNum * Number(rule.participation_percentage_above_limit);
  }

  const leilaoSinistroValue = hasLeilaoSinistro ? 39.90 : 0;

  let trackerValue = 0;
  // Se a regra exige rastreador (ex: 7000 KG) ou se foi selecionado
  if (rule.tracker_required) {
    trackerValue = 50.00;
  } else {
    const trackerAddon = selectedAddons.find(a => a.name.toLowerCase().includes('rastreador'));
    if (trackerAddon) trackerValue = Number(trackerAddon.price);
  }

  let glassPercentage = 0;
  let glassValue = 0;

  const optionalAddonsValue = selectedAddons.reduce((acc, addon) => {
    const name = addon.name.toLowerCase();
    // Pula se for rastreador (já processado) ou taxa (já inclusa como fixedAddon)
    if (name.includes('taxa administrativa') || name.includes('rastreador') || name.includes('boleto')) return acc;
    
    if (name.includes('vidro') || name.includes('farol') || name.includes('retrovisor') || name.includes('lanterna')) {
      glassPercentage = name.includes('100%') ? 100 : 50;
    }
    return acc + Number(addon.price);
  }, 0);

  const finalMonthlyValue = baseValue + fixedAddon + glassValue + trackerValue + leilaoSinistroValue + optionalAddonsValue;

  return {
    fipeValue: fipeValueNum,
    fipePercentage: fipeValueNum > Number(rule.fipe_limit) ? Number(rule.percentage_above_limit) : 0,
    baseValue,
    fixedAddon,
    glassValue,
    trackerValue,
    leilaoSinistroValue,
    optionalAddonsValue,
    finalMonthlyValue,
    participationValue,
    categoryName,
    glassPercentage,
    categoryType: 'OUTROS', // Mantido para compatibilidade, mas a lógica agora é baseada nos valores da rule
  };
};
