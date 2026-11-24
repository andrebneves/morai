-- Moraí — esquema do banco de dados (Supabase / PostgreSQL + PostGIS)
-- Execute este arquivo no SQL Editor do seu projeto Supabase (https://app.supabase.com).
-- Ver DATABASE.md para o passo a passo completo de configuração.

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- =========================================================
-- PROPERTIES — imóveis (demonstrativos + cadastrados por usuários)
-- =========================================================
create table if not exists properties (
  id text primary key default ('user-' || extract(epoch from now())::text),
  demo boolean not null default false,
  titulo text not null,
  descricao text not null default '',
  finalidade text not null check (finalidade in ('venda', 'aluguel')),
  tipo text not null check (tipo in ('casa','apartamento','casa_condominio','cobertura','kitnet','terreno','comercial')),
  preco numeric not null check (preco >= 0),
  condominio numeric not null default 0,
  iptu_mensal numeric not null default 0,
  area numeric not null check (area > 0),
  preco_m2 numeric not null default 0,
  quartos int not null default 0,
  suites int not null default 0,
  banheiros int not null default 0,
  vagas int not null default 0,
  bairro text not null,
  endereco text not null default '',
  lat double precision not null,
  lng double precision not null,
  geom geography(Point, 4326) generated always as (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  ) stored,
  localizacao_exata boolean not null default true,
  contato text,
  fotos jsonb not null default '[]',
  caracteristicas jsonb not null default '{}',
  data_publicacao date not null default current_date,
  historico_precos jsonb not null default '[]',
  -- disponivel | reservado | indisponivel | pendente (aguardando moderação)
  status text not null default 'pendente' check (status in ('disponivel','reservado','indisponivel','pendente')),
  owner_id uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists properties_geom_idx on properties using gist (geom);
create index if not exists properties_status_idx on properties (status);
create index if not exists properties_bairro_idx on properties (bairro);

alter table properties enable row level security;

-- Qualquer pessoa pode ler imóveis já aprovados (status = disponivel)
create policy "properties_select_public" on properties
  for select using (status = 'disponivel' or demo = true);

-- Usuários autenticados podem inserir seus próprios imóveis (entram como 'pendente')
create policy "properties_insert_own" on properties
  for insert with check (auth.uid() is not null and (owner_id = auth.uid() or owner_id is null));

-- Donos podem editar/ver seus próprios imóveis mesmo pendentes
create policy "properties_select_own" on properties
  for select using (auth.uid() = owner_id);

create policy "properties_update_own" on properties
  for update using (auth.uid() = owner_id);

-- =========================================================
-- ADMINS — lista simples de administradores (por user id do Supabase Auth)
-- =========================================================
create table if not exists admins (
  user_id uuid primary key references auth.users (id)
);

alter table admins enable row level security;

create policy "admins_select_self" on admins
  for select using (auth.uid() = user_id);

-- Administradores podem ver e moderar todos os imóveis
create policy "properties_admin_all" on properties
  for all using (exists (select 1 from admins where admins.user_id = auth.uid()));

-- =========================================================
-- FEEDBACK — avaliações e relatos do beta
-- =========================================================
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('sugestao','erro','localizacao','instalacao','funcionalidade')),
  nota int check (nota between 1 and 5),
  mensagem text not null,
  user_id uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

create policy "feedback_insert_anyone" on feedback
  for insert with check (true);

create policy "feedback_select_admin" on feedback
  for select using (exists (select 1 from admins where admins.user_id = auth.uid()));

-- =========================================================
-- Storage: bucket para fotos de imóveis cadastrados por usuários
-- =========================================================
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

create policy "property_photos_public_read" on storage.objects
  for select using (bucket_id = 'property-photos');

create policy "property_photos_authenticated_upload" on storage.objects
  for insert with check (bucket_id = 'property-photos' and auth.uid() is not null);
