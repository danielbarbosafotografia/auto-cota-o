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

const detectCategoryType = (categoryName: string): CategoryType => {
  const cat = categoryName.toUpperCase();
  if (cat.includes('ESPECIAL')) return 'ESPECIAL';
  if (cat.includes('CAMINHONETE') && cat.includes('IMPORTAD')) return 'CAMINHONETE_IMPORTADA';
  if (cat.includes('CAMINHONETE')) return 'CAMINHONETE_NACIONAL';
  if (cat.includes('IMPORTAD')) return 'IMPORTADO';
  if (cat.includes('NACIONAL')) return 'NACIONAL';
  return 'OUTROS';
};

export const calculateQuote = (
  fipeValue: number,
  rule: PricingRule,
  selectedAddons: Addon[],
  categoryName: string,
  hasLeilaoSinistro = false
): CalculationResult => {
  const categoryType = detectCategoryType(categoryName);

  let fipePercentage: number;
  let fixedAddon: number;
  let glassValue: number;
  let glassPercentage: number;

  switch (categoryType) {
    case 'NACIONAL':
      fipePercentage = 0.0025;
      fixedAddon = 13.50;
      glassValue = 0;
      glassPercentage = 0;
      break;
    case 'IMPORTADO':
      fipePercentage = 0.0035;
      fixedAddon = 13.50;
      glassValue = 0;
      glassPercentage = 0;
      break;
    case 'CAMINHONETE_NACIONAL':
      fipePercentage = 0.0025;
      fixedAddon = 13.50;
      glassValue = 0;
      glassPercentage = 0;
      break;
    case 'CAMINHONETE_IMPORTADA':
      fipePercentage = 0.0035;
      fixedAddon = 13.50;
      glassValue = 0;
      glassPercentage = 0;
      break;
    case 'ESPECIAL':
      fipePercentage = 0.0045;
      fixedAddon = 3.50;
      glassValue = 0;
      glassPercentage = 0;
      break;
    default:
      fipePercentage = Number(rule.percentage_above_limit);
      fixedAddon = 13.50;
      glassValue = 0;
      glassPercentage = 0;
  }

  const baseValue = fipeValue * fipePercentage;
  const leilaoSinistroValue = hasLeilaoSinistro ? 39.90 : 0;

  let trackerValue = 0;
  if (rule.tracker_required) {
    trackerValue = 50.00;
  } else {
    const trackerAddon = selectedAddons.find(a => a.name.toLowerCase().includes('rastreador'));
    if (trackerAddon) trackerValue = Number(trackerAddon.price);
  }

  const optionalAddonsValue = selectedAddons.reduce((acc, addon) => {
    const name = addon.name.toLowerCase();
    if (name.includes('taxa administrativa') || name.includes('rastreador')) return acc;
    return acc + Number(addon.price);
  }, 0);

  const finalMonthlyValue = baseValue + fixedAddon + glassValue + trackerValue + leilaoSinistroValue + optionalAddonsValue;

  let participationValue = 0;
  if (fipeValue <= rule.participation_limit) {
    participationValue = Number(rule.participation_fixed);
  } else if (rule.participation_percentage_above_limit > 0) {
    participationValue = fipeValue * Number(rule.participation_percentage_above_limit);
  } else {
    participationValue = Number(rule.participation_fixed);
  }

  return {
    fipeValue,
    fipePercentage,
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
    categoryType,
  };
};
