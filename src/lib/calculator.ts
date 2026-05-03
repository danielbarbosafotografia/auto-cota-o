import type { PricingRule, Addon } from '../types';

export type CalculationResult = {
  fipeValue: number;
  fipePercentage: number;
  fipeComponentValue: number; // The "Base calculada" part (FIPE * % or fixed base)
  fixedBaseValue: number;     // Any other fixed part if needed
  boletoValue: number;        // Always 13.50
  trackerValue: number;       // 50.00 if mandatory or selected
  glassValue: number;         // 15.90 specifically for Importado <= 30k
  optionalAddonsValue: number;
  finalMonthlyValue: number;
  participationValue: number;
  categoryName: string;
  glassPercentage: number;
  categoryType: 'NACIONAL' | 'IMPORTADO' | 'ESPECIAL' | 'OUTROS';
};

export const calculateQuote = (
  fipeValue: number,
  rule: PricingRule,
  selectedAddons: Addon[],
  categoryName: string
): CalculationResult => {
  const cat = categoryName.toUpperCase();
  let categoryType: 'NACIONAL' | 'IMPORTADO' | 'ESPECIAL' | 'OUTROS' = 'OUTROS';
  
  if (cat.includes('NACIONAL') && !cat.includes('IMPORTAD')) categoryType = 'NACIONAL';
  else if (cat.includes('IMPORTAD')) categoryType = 'IMPORTADO';
  else if (cat.includes('ESPECIAL')) categoryType = 'ESPECIAL';

  let fipePercentage = Number(rule.percentage_above_limit);
  let fipeComponentValue = 0;
  let glassValue = 0;
  let glassPercentage = 60; // Default for Nacional
  const boletoValue = 13.50;

  if (categoryType === 'NACIONAL') {
    if (fipeValue > 30000) {
      fipePercentage = 0.0025;
      fipeComponentValue = fipeValue * fipePercentage;
    } else {
      fipePercentage = 0;
      fipeComponentValue = 75.00; // 88.50 - 13.50
    }
    glassPercentage = 60;
  } else if (categoryType === 'IMPORTADO') {
    if (fipeValue > 30000) {
      fipePercentage = 0.0035;
      fipeComponentValue = fipeValue * fipePercentage;
    } else {
      fipePercentage = 0;
      fipeComponentValue = 105.00; // Part of 134.40
      glassValue = 15.90; // Part of 134.40
    }
    glassPercentage = 50;
  } else {
    // Especial or others use the rule percentage
    fipeComponentValue = fipeValue * fipePercentage;
    glassPercentage = 50;
  }

  // 3. Identify specific addons
  let trackerValue = 0;
  if (rule.tracker_required) {
    trackerValue = 50.00;
  } else {
    const trackerAddon = selectedAddons.find(a => a.name.toLowerCase() === 'rastreador');
    if (trackerAddon) trackerValue = Number(trackerAddon.price);
  }

  // 4. Calculate Other Optional Addons
  const optionalAddonsValue = selectedAddons.reduce((acc, addon) => {
    const name = addon.name.toLowerCase();
    // Don't count boleto and tracker twice as they are handled above
    if (name === 'boleto' || name === 'taxa administrativa') return acc;
    if (name === 'rastreador') return acc;
    return acc + Number(addon.price);
  }, 0);

  // 5. Final Monthly Value
  const finalMonthlyValue = fipeComponentValue + boletoValue + glassValue + trackerValue + optionalAddonsValue;

  // 6. Calculate Participation Value
  let participationValue = 0;
  if (fipeValue <= rule.participation_limit) {
    participationValue = Number(rule.participation_fixed);
  } else {
    if (rule.participation_percentage_above_limit > 0) {
      participationValue = fipeValue * Number(rule.participation_percentage_above_limit);
    } else {
      participationValue = Number(rule.participation_fixed);
    }
  }

  return {
    fipeValue,
    fipePercentage,
    fipeComponentValue,
    fixedBaseValue: 0,
    boletoValue,
    trackerValue,
    glassValue,
    optionalAddonsValue,
    finalMonthlyValue,
    participationValue,
    categoryName,
    glassPercentage,
    categoryType
  };
};
