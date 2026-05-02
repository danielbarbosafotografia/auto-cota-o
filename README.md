# Auto Cotação - Auto Excelência

Sistema profissional de cotação de proteção veicular.

## Tecnologias
- React + TypeScript (Vite)
- TailwindCSS
- Supabase (Banco de dados e Auth)
- Lucide React (Ícones)
- Framer Motion (Animações)

## Como configurar

1. **Supabase**:
   - Crie um novo projeto no [Supabase](https://supabase.com).
   - Execute o conteúdo do arquivo `supabase_schema.sql` no Editor SQL do seu projeto. Isso criará todas as tabelas, permissões de segurança (RLS) e dados iniciais (regras e adicionais).

2. **Variáveis de Ambiente**:
   - Renomeie o arquivo `.env.example` para `.env`.
   - Insira sua `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` encontradas nas configurações de API do seu projeto Supabase.

3. **Instalação**:
   ```bash
   npm install
   ```

4. **Execução**:
   ```bash
   npm run dev
   ```

## Perfis de Usuário
- **Admin**: Gerencia regras, adicionais, vendedores e vê todas as cotações.
- **Vendedor**: Cria cotações, gerencia seus próprios clientes e vê seu histórico.

## Regras de Segurança (RLS)
O sistema já vem configurado com Row Level Security:
- Vendedores só veem seus próprios dados.
- Admins veem tudo.
- As propostas públicas podem ser visualizadas por qualquer pessoa que possua o link (slug único).

## Fluxo de Cotação
1. O vendedor preenche os dados do cliente e veículo.
2. O sistema calcula automaticamente baseado nas regras da categoria selecionada.
3. Adicionais podem ser incluídos manualmente.
4. Uma proposta premium é gerada com link único para envio via WhatsApp.
