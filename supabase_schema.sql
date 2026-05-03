-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Limpar banco antes de recriar para evitar erros de duplicidade
DROP TABLE IF EXISTS quote_addons CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS addons CASCADE;
DROP TABLE IF EXISTS pricing_rules CASCADE;
DROP TABLE IF EXISTS vehicle_models CASCADE;
DROP TABLE IF EXISTS vehicle_brands CASCADE;
DROP TABLE IF EXISTS vehicle_categories CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS vehicle_status CASCADE;


-- PROFILES
CREATE TYPE user_role AS ENUM ('admin', 'seller');

CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role DEFAULT 'seller' NOT NULL,
  whatsapp TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CLIENTS
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  whatsapp TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VEHICLE CATEGORIES
CREATE TABLE vehicle_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VEHICLE BRANDS
CREATE TABLE vehicle_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VEHICLE MODELS
CREATE TYPE vehicle_status AS ENUM ('active', 'consult', 'restricted');

CREATE TABLE vehicle_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES vehicle_brands(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES vehicle_categories(id) ON DELETE SET NULL,
  status vehicle_status DEFAULT 'active' NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand_id, name)
);

-- PRICING RULES
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES vehicle_categories(id) ON DELETE CASCADE NOT NULL,
  fipe_limit NUMERIC(15, 2) NOT NULL,
  fixed_price NUMERIC(15, 2) NOT NULL,
  percentage_above_limit NUMERIC(5, 4) NOT NULL, -- e.g., 0.0070 for 0.70%
  participation_limit NUMERIC(15, 2),
  participation_fixed NUMERIC(15, 2),
  participation_percentage_above_limit NUMERIC(5, 4),
  tracker_required BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ADDONS
CREATE TABLE addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(15, 2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  applicable_category TEXT, -- Optional: 'Moto', 'Nacional', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QUOTES
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_whatsapp TEXT,
  plate TEXT,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year TEXT NOT NULL,
  fipe_code TEXT,
  fipe_value NUMERIC(15, 2) NOT NULL,
  category_id UUID REFERENCES vehicle_categories(id),
  category_name TEXT NOT NULL,
  base_monthly_value NUMERIC(15, 2) NOT NULL,
  addons_total NUMERIC(15, 2) DEFAULT 0,
  final_monthly_value NUMERIC(15, 2) NOT NULL,
  participation_value NUMERIC(15, 2),
  inspection_fee NUMERIC(15, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  public_slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QUOTE ADDONS
CREATE TABLE quote_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  addon_id UUID REFERENCES addons(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC(15, 2) NOT NULL
);

-- RLS POLICIES

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_addons ENABLE ROW LEVEL SECURITY;

-- FUNCTION TO CHECK ADMIN (Prevents infinite recursion on profiles table)
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Profiles: Users can read their own, Admin can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can view all profiles" ON profiles FOR SELECT USING (is_admin());

-- Clients: Sellers see their own, Admin sees all
CREATE POLICY "Sellers view own clients" ON clients FOR SELECT USING (seller_id = auth.uid());
CREATE POLICY "Sellers manage own clients" ON clients FOR INSERT WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Admin manage all clients" ON clients FOR ALL USING (is_admin());

-- Quotes: Sellers see their own, Admin sees all, Public can see via slug (for proposal page)
CREATE POLICY "Sellers view own quotes" ON quotes FOR SELECT USING (seller_id = auth.uid());
CREATE POLICY "Sellers manage own quotes" ON quotes FOR INSERT WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Admin manage all quotes" ON quotes FOR ALL USING (is_admin());
CREATE POLICY "Sellers delete own quotes" ON quotes FOR DELETE USING (seller_id = auth.uid());
CREATE POLICY "Public view quotes via slug" ON quotes FOR SELECT USING (TRUE);

-- Quote Addons: Public can read, authenticated can manage
CREATE POLICY "Public read quote_addons" ON quote_addons FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated manage quote_addons" ON quote_addons FOR ALL USING (auth.uid() IS NOT NULL);

-- Metadata (Brands, Models, Categories, Rules, Addons): Publicly readable, Admin manageable
CREATE POLICY "Public read metadata" ON vehicle_brands FOR SELECT USING (TRUE);
CREATE POLICY "Public read metadata" ON vehicle_models FOR SELECT USING (TRUE);
CREATE POLICY "Public read metadata" ON vehicle_categories FOR SELECT USING (TRUE);
CREATE POLICY "Public read metadata" ON pricing_rules FOR SELECT USING (TRUE);
CREATE POLICY "Public read metadata" ON addons FOR SELECT USING (TRUE);

CREATE POLICY "Admin manage metadata" ON vehicle_brands FOR ALL USING (is_admin());
CREATE POLICY "Admin manage metadata" ON vehicle_models FOR ALL USING (is_admin());
CREATE POLICY "Admin manage metadata" ON vehicle_categories FOR ALL USING (is_admin());
CREATE POLICY "Admin manage metadata" ON pricing_rules FOR ALL USING (is_admin());
CREATE POLICY "Admin manage metadata" ON addons FOR ALL USING (is_admin());

-- SEED DATA

INSERT INTO vehicle_categories (name, description) VALUES 
('MOTO', 'Motocicletas'),
('NACIONAL', 'Veículos nacionais'),
('IMPORTADO', 'Veículos importados'),
('UTILITÁRIO', 'Veículos utilitários'),
('ESPECIAL 1', 'Veículos especiais grupo 1'),
('ESPECIAL 2', 'Veículos especiais grupo 2'),
('CAMINHONETE NACIONAL', 'Caminhonetes nacionais'),
('CAMINHONETE IMPORTADA', 'Caminhonetes importadas'),
('CAMINHONETE ESPECIAL', 'Caminhonetes especiais'),
('7000 KG', 'Veículos pesados até 7000kg');

-- Pricing Rules Seed
INSERT INTO pricing_rules (category_id, fipe_limit, fixed_price, percentage_above_limit, participation_limit, participation_fixed, participation_percentage_above_limit, tracker_required)
SELECT id, 10000, 69.00, 0.0070, 10000, 900.00, 0.09, false FROM vehicle_categories WHERE name = 'MOTO';

INSERT INTO pricing_rules (category_id, fipe_limit, fixed_price, percentage_above_limit, participation_limit, participation_fixed, participation_percentage_above_limit, tracker_required)
SELECT id, 30000, 69.00, 0.0025, 30000, 2100.00, 0.07, false FROM vehicle_categories WHERE name = 'NACIONAL';

INSERT INTO pricing_rules (category_id, fipe_limit, fixed_price, percentage_above_limit, participation_limit, participation_fixed, participation_percentage_above_limit, tracker_required)
SELECT id, 30000, 105.00, 0.0035, 30000, 2400.00, 0.08, false FROM vehicle_categories WHERE name = 'IMPORTADO';

INSERT INTO pricing_rules (category_id, fipe_limit, fixed_price, percentage_above_limit, participation_limit, participation_fixed, participation_percentage_above_limit, tracker_required)
SELECT id, 30000, 69.00, 0.0023, 30000, 2100.00, 0.07, false FROM vehicle_categories WHERE name = 'UTILITÁRIO';

INSERT INTO pricing_rules (category_id, fipe_limit, fixed_price, percentage_above_limit, participation_limit, participation_fixed, participation_percentage_above_limit, tracker_required)
SELECT id, 40000, 180.00, 0.0045, 40000, 4000.00, 0.10, false FROM vehicle_categories WHERE name = 'ESPECIAL 1';

INSERT INTO pricing_rules (category_id, fipe_limit, fixed_price, percentage_above_limit, participation_limit, participation_fixed, participation_percentage_above_limit, tracker_required)
SELECT id, 40000, 160.00, 0.0040, 40000, 4000.00, 0.10, false FROM vehicle_categories WHERE name = 'ESPECIAL 2';

INSERT INTO pricing_rules (category_id, fipe_limit, fixed_price, percentage_above_limit, participation_limit, participation_fixed, participation_percentage_above_limit, tracker_required)
SELECT id, 60000, 150.00, 0.0025, 60000, 4800.00, 0.08, false FROM vehicle_categories WHERE name = 'CAMINHONETE NACIONAL';

INSERT INTO pricing_rules (category_id, fipe_limit, fixed_price, percentage_above_limit, participation_limit, participation_fixed, participation_percentage_above_limit, tracker_required)
SELECT id, 60000, 210.00, 0.0035, 60000, 5400.00, 0.09, false FROM vehicle_categories WHERE name = 'CAMINHONETE IMPORTADA';

INSERT INTO pricing_rules (category_id, fipe_limit, fixed_price, percentage_above_limit, participation_limit, participation_fixed, participation_percentage_above_limit, tracker_required)
SELECT id, 60000, 270.00, 0.0045, 60000, 6000.00, 0.10, false FROM vehicle_categories WHERE name = 'CAMINHONETE ESPECIAL';

INSERT INTO pricing_rules (category_id, fipe_limit, fixed_price, percentage_above_limit, participation_limit, participation_fixed, participation_percentage_above_limit, tracker_required)
SELECT id, 50000, 175.00, 0.0, 30000, 3000.00, 0.10, true FROM vehicle_categories WHERE name = '7000 KG';

INSERT INTO addons (name, price) VALUES 
('Boleto', 13.50),
('Rastreador', 50.00),
('Carro assistencial 7 dias', 9.90),
('Carro assistencial 15 dias', 15.90),
('Diárias excedentes', 80.00),
('50% vidros/farol/retrovisor importado', 15.90),
('50% vidros/farol/retrovisor especial', 29.90),
('100% vidros/farol/retrovisor/lanterna nacional', 19.90),
('100% vidros/farol/retrovisor/lanterna importado', 20.00),
('Caminhonete vidros nacional', 19.90),
('Caminhonete vidros importada', 29.90),
('Alagamento', 15.90),
('1000 km guincho', 19.90),
('Terceiros até R$ 300.000,00', 19.90);
