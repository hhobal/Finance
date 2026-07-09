-- =========================================================
-- FINANCE MANAGER — SCHEMA DO BANCO (SUPABASE / POSTGRES)
-- =========================================================
-- Como usar:
-- 1. Abra seu projeto em supabase.com
-- 2. Vá em "SQL Editor" (menu lateral)
-- 3. Cole este arquivo inteiro e clique em "Run"
-- =========================================================


-- Tabela principal de lançamentos (receitas e despesas)

create table if not exists public.transactions (

    id uuid primary key default gen_random_uuid(),

    -- Preenchido automaticamente com o usuário autenticado que criou o registro
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

    description text not null,
    value numeric(12,2) not null check (value > 0),
    type text not null check (type in ('income', 'expense')),
    category text not null default 'Outros',
    card text,
    date date not null,

    created_at timestamptz not null default now()

);


-- Índices para acelerar as consultas mais comuns

create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_date_idx on public.transactions (date desc);


-- =========================================================
-- ROW LEVEL SECURITY (RLS)
-- Garante, dentro do próprio banco, que cada usuário só
-- consegue ler/alterar os próprios lançamentos — mesmo que
-- alguém tente burlar o front-end.
-- =========================================================

alter table public.transactions enable row level security;

create policy "Usuários veem apenas seus próprios lançamentos"
    on public.transactions
    for select
    using (auth.uid() = user_id);

create policy "Usuários inserem apenas para si mesmos"
    on public.transactions
    for insert
    with check (auth.uid() = user_id);

create policy "Usuários atualizam apenas seus próprios lançamentos"
    on public.transactions
    for update
    using (auth.uid() = user_id);

create policy "Usuários excluem apenas seus próprios lançamentos"
    on public.transactions
    for delete
    using (auth.uid() = user_id);
