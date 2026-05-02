-- 1. Adicionar novas colunas na tabela quotes
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS consultant_name TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS consultant_city TEXT;

-- 2. Remover a restrição de que o vendedor só vê as próprias cotações
-- O pedido diz: "Todos os usuários podem visualizar todas as cotações."
DROP POLICY IF EXISTS "Sellers view own quotes" ON quotes;
CREATE POLICY "Sellers view own quotes" ON quotes FOR SELECT USING (TRUE);

-- 3. Fazer o mesmo para clientes, para que as cotações dos outros não quebrem ao buscar dados do cliente
DROP POLICY IF EXISTS "Sellers view own clients" ON clients;
CREATE POLICY "Sellers view own clients" ON clients FOR SELECT USING (TRUE);
