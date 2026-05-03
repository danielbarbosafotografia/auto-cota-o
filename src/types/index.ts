export type UserRole = 'admin' | 'seller';

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  whatsapp?: string;
  onboarding_completed: boolean;
  created_at: string;
};

export type Client = {
  id: string;
  seller_id: string;
  name: string;
  whatsapp?: string;
  created_at: string;
};

export type VehicleCategory = {
  id: string;
  name: string;
  description?: string;
};

export type PricingRule = {
  id: string;
  category_id: string;
  fipe_limit: number;
  fixed_price: number;
  percentage_above_limit: number;
  participation_limit: number;
  participation_fixed: number;
  participation_percentage_above_limit: number;
  tracker_required: boolean;
  active: boolean;
};

export type Addon = {
  id: string;
  name: string;
  description?: string;
  price: number;
  active: boolean;
  applicable_category?: string;
};

export type Quote = {
  id: string;
  seller_id: string;
  client_id?: string;
  client_name: string;
  client_whatsapp?: string;
  plate?: string;
  brand: string;
  model: string;
  year: string;
  fipe_code?: string;
  fipe_value: number;
  category_id?: string;
  category_name: string;
  base_monthly_value: number;
  addons_total: number;
  final_monthly_value: number;
  participation_value?: number;
  inspection_fee: number;
  status: string;
  public_slug: string;
  consultant_name?: string;
  consultant_city?: string;
  created_at: string;
};

export type QuoteAddon = {
  id: string;
  quote_id: string;
  addon_id: string;
  name: string;
  price: number;
};

// Dummy export to force value-level module
export const VERSION = '1.0.0';
