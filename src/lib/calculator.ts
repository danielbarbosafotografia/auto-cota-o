import type { PricingRule, Addon } from '../types';

export type CalculationResult = {
  baseMonthlyValue: number;
  addonsTotal: number;
  finalMonthlyValue: number;
  participationValue: number;
  categoryName: string;
};

export const calculateQuote = (
  fipeValue: number,
  rule: PricingRule,
  selectedAddons: Addon[],
  categoryName: string
): CalculationResult => {
  let baseMonthlyValue = 0;
  let participationValue = 0;

  // 1. Calculate Base Monthly Value
  if (fipeValue <= rule.fipe_limit) {
    baseMonthlyValue = Number(rule.fixed_price);
  } else {
    // If there's a percentage for above limit
    if (rule.percentage_above_limit > 0) {
      baseMonthlyValue = fipeValue * Number(rule.percentage_above_limit);
    } else {
      // If no percentage, use fixed (some categories might be flat or logic varies)
      baseMonthlyValue = Number(rule.fixed_price);
    }
  }

  // 2. Calculate Participation Value
  if (fipeValue <= rule.participation_limit) {
    participationValue = Number(rule.participation_fixed);
  } else {
    if (rule.participation_percentage_above_limit > 0) {
      participationValue = fipeValue * Number(rule.participation_percentage_above_limit);
    } else {
      participationValue = Number(rule.participation_fixed);
    }
  }

  // 3. Addons
  let addonsTotal = selectedAddons.reduce((acc, addon) => acc + Number(addon.price), 0);

  // 4. Tracker logic
  // Check if Tracker (R$ 50) is mandatory and NOT already selected
  const hasTrackerAddon = selectedAddons.find(a => a.name.toLowerCase().includes('rastreador'));
  if (rule.tracker_required && !hasTrackerAddon) {
    // We should ideally ensure the addon exists in the DB, but for now we add the price
    addonsTotal += 50.00;
  }

  const finalMonthlyValue = baseMonthlyValue + addonsTotal;

  return {
    baseMonthlyValue,
    addonsTotal,
    finalMonthlyValue,
    participationValue,
    categoryName,
  };
};
