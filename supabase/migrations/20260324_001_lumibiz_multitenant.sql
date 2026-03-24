-- LumiBiz - Base multitenant com RLS
-- Projeto: dgwlzgblrzsbvbzlvdqo

create extension if not exists "pgcrypto";

-- =========================
-- Tabelas base de tenancy
-- =========================
create table if not exists public.planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  preco_mensal numeric(12,2) not null default 0,
  user_limit integer not null default 5,
  created_at timestamptz not null default now()
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  nome_fantasia text not null,
  razao_social text,
  cnpj text,
  plano_id uuid references public.planos(id),
  status text not null default 'ativo' check (status in ('ativo', 'inativo', 'suspenso')),
  user_limit integer not null default 5,
  created_at timestamptz not null default now()
);

-- =========================
-- Tabelas de domínio
-- =========================
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id),
  nome text,
  email text,
  foto_url text,
  role text not null default 'usuario' check (role in ('super_admin', 'admin', 'gestor', 'usuario')),
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now()
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome text not null,
  categoria text default 'Lead',
  status text default 'ativo',
  responsavel text,
  foto_url text,
  telefone text,
  endereco text,
  created_at timestamptz not null default now()
);

create table if not exists public.visitas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  usuario_id uuid references public.perfis(id) on delete set null,
  status text not null default 'Agendada' check (status in ('Agendada', 'Em Andamento', 'Concluída')),
  data_visita date not null,
  hora_inicio time,
  check_in timestamptz,
  check_in_local text,
  check_out timestamptz,
  check_out_local text,
  created_at timestamptz not null default now()
);

create table if not exists public.receitas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  usuario_id uuid references public.perfis(id) on delete set null,
  descricao text not null,
  valor numeric(12,2) not null,
  data_lancamento date not null default current_date,
  categoria text,
  status text default 'aprovado',
  created_at timestamptz not null default now()
);

create table if not exists public.custos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  usuario_id uuid references public.perfis(id) on delete set null,
  descricao text not null,
  valor numeric(12,2) not null,
  data_lancamento date not null default current_date,
  categoria text,
  status text default 'lancado',
  created_at timestamptz not null default now()
);

create table if not exists public.requisicoes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  solicitante_id uuid references public.perfis(id) on delete set null,
  status text default 'aberta',
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.itens_catalogo (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome text not null,
  categoria text,
  unidade text,
  preco_unitario numeric(12,2),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.reembolsos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  usuario_id uuid references public.perfis(id) on delete set null,
  data_solicitacao date not null default current_date,
  valor numeric(12,2) not null,
  status text default 'solicitado',
  motivo text,
  anexo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.validades (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  titulo text not null,
  data_validade date not null,
  status text default 'pendente',
  created_at timestamptz not null default now()
);

create table if not exists public.servicos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  usuario_id uuid references public.perfis(id) on delete set null,
  titulo text not null,
  descricao text,
  status text default 'aberto',
  created_at timestamptz not null default now()
);

create table if not exists public.chamados (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  usuario_id uuid references public.perfis(id) on delete set null,
  titulo text not null,
  prioridade text default 'media',
  status text default 'aberto',
  created_at timestamptz not null default now()
);

-- =========================
-- Índices
-- =========================
create index if not exists idx_perfis_tenant on public.perfis(tenant_id);
create index if not exists idx_clientes_tenant on public.clientes(tenant_id);
create index if not exists idx_visitas_tenant_usuario on public.visitas(tenant_id, usuario_id);
create index if not exists idx_receitas_tenant_usuario on public.receitas(tenant_id, usuario_id);
create index if not exists idx_custos_tenant_usuario on public.custos(tenant_id, usuario_id);
create index if not exists idx_requisicoes_tenant_solicitante on public.requisicoes(tenant_id, solicitante_id);
create index if not exists idx_reembolsos_tenant_usuario on public.reembolsos(tenant_id, usuario_id);
create index if not exists idx_validades_tenant on public.validades(tenant_id);
create index if not exists idx_servicos_tenant_usuario on public.servicos(tenant_id, usuario_id);
create index if not exists idx_chamados_tenant_usuario on public.chamados(tenant_id, usuario_id);

-- =========================
-- Funções auxiliares RLS
-- =========================
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.perfis p
  where p.id = auth.uid();
$$;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.tenant_id
  from public.perfis p
  where p.id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'super_admin', false);
$$;

create or replace function public.is_tenant_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin', 'gestor'), false);
$$;

-- =========================
-- Trigger de perfil automático
-- =========================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_nome text;
  v_role text;
begin
  v_tenant_id := nullif(new.raw_user_meta_data->>'tenant_id', '')::uuid;
  v_nome := coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1));
  v_role := coalesce(new.raw_user_meta_data->>'role', 'usuario');

  insert into public.perfis (id, tenant_id, nome, email, role)
  values (new.id, v_tenant_id, v_nome, new.email, v_role)
  on conflict (id) do update
    set tenant_id = excluded.tenant_id,
        nome = excluded.nome,
        email = excluded.email,
        role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================
-- RLS
-- =========================
alter table public.planos enable row level security;
alter table public.tenants enable row level security;
alter table public.perfis enable row level security;
alter table public.clientes enable row level security;
alter table public.visitas enable row level security;
alter table public.receitas enable row level security;
alter table public.custos enable row level security;
alter table public.requisicoes enable row level security;
alter table public.itens_catalogo enable row level security;
alter table public.reembolsos enable row level security;
alter table public.validades enable row level security;
alter table public.servicos enable row level security;
alter table public.chamados enable row level security;

-- Planos: somente super admin
drop policy if exists planos_select on public.planos;
create policy planos_select on public.planos for select using (public.is_super_admin());
drop policy if exists planos_insert on public.planos;
create policy planos_insert on public.planos for insert with check (public.is_super_admin());
drop policy if exists planos_update on public.planos;
create policy planos_update on public.planos for update using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists planos_delete on public.planos;
create policy planos_delete on public.planos for delete using (public.is_super_admin());

-- Tenants: super admin total; admin/gestor apenas próprio tenant
drop policy if exists tenants_select on public.tenants;
create policy tenants_select on public.tenants
for select
using (public.is_super_admin() or id = public.current_tenant_id());

drop policy if exists tenants_insert on public.tenants;
create policy tenants_insert on public.tenants
for insert
with check (public.is_super_admin());

drop policy if exists tenants_update on public.tenants;
create policy tenants_update on public.tenants
for update
using (public.is_super_admin() or id = public.current_tenant_id())
with check (public.is_super_admin() or id = public.current_tenant_id());

drop policy if exists tenants_delete on public.tenants;
create policy tenants_delete on public.tenants
for delete
using (public.is_super_admin());

-- Perfis
drop policy if exists perfis_select on public.perfis;
create policy perfis_select on public.perfis
for select
using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or id = auth.uid()
);

drop policy if exists perfis_insert on public.perfis;
create policy perfis_insert on public.perfis
for insert
with check (
  public.is_super_admin()
  or (public.is_tenant_manager() and tenant_id = public.current_tenant_id())
);

drop policy if exists perfis_update on public.perfis;
create policy perfis_update on public.perfis
for update
using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or id = auth.uid()
)
with check (
  public.is_super_admin()
  or tenant_id = public.current_tenant_id()
);

drop policy if exists perfis_delete on public.perfis;
create policy perfis_delete on public.perfis
for delete
using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);

-- Regra padrão tenant-based
do $$
declare
  t text;
begin
  foreach t in array array[
    'clientes','itens_catalogo','validades'
  ]
  loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('create policy %I_select on public.%I for select using (public.is_super_admin() or tenant_id = public.current_tenant_id())', t, t);
    execute format('drop policy if exists %I_insert on public.%I', t, t);
    execute format('create policy %I_insert on public.%I for insert with check (public.is_super_admin() or (public.is_tenant_manager() and tenant_id = public.current_tenant_id()))', t, t);
    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format('create policy %I_update on public.%I for update using (public.is_super_admin() or (public.is_tenant_manager() and tenant_id = public.current_tenant_id())) with check (public.is_super_admin() or tenant_id = public.current_tenant_id())', t, t);
    execute format('drop policy if exists %I_delete on public.%I', t, t);
    execute format('create policy %I_delete on public.%I for delete using (public.is_super_admin() or (public.is_tenant_manager() and tenant_id = public.current_tenant_id()))', t, t);
  end loop;
end $$;

-- Regra com usuário responsável (usuário só enxerga/edita o próprio)
do $$
declare
  t text;
  user_col text;
begin
  foreach t, user_col in
    select * from (values
      ('visitas', 'usuario_id'),
      ('receitas', 'usuario_id'),
      ('custos', 'usuario_id'),
      ('reembolsos', 'usuario_id'),
      ('servicos', 'usuario_id'),
      ('chamados', 'usuario_id')
    ) as x(t, user_col)
  loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format(
      'create policy %I_select on public.%I for select using (
        public.is_super_admin()
        or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
        or (tenant_id = public.current_tenant_id() and %I = auth.uid())
      )', t, t, user_col
    );

    execute format('drop policy if exists %I_insert on public.%I', t, t);
    execute format(
      'create policy %I_insert on public.%I for insert with check (
        public.is_super_admin()
        or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
        or (tenant_id = public.current_tenant_id() and %I = auth.uid())
      )', t, t, user_col
    );

    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format(
      'create policy %I_update on public.%I for update using (
        public.is_super_admin()
        or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
        or (tenant_id = public.current_tenant_id() and %I = auth.uid())
      ) with check (
        public.is_super_admin()
        or tenant_id = public.current_tenant_id()
      )', t, t, user_col
    );

    execute format('drop policy if exists %I_delete on public.%I', t, t);
    execute format(
      'create policy %I_delete on public.%I for delete using (
        public.is_super_admin()
        or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
      )', t, t
    );
  end loop;
end $$;

-- Requisições: usuário baseado em solicitante_id
drop policy if exists requisicoes_select on public.requisicoes;
create policy requisicoes_select on public.requisicoes
for select
using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and solicitante_id = auth.uid())
);

drop policy if exists requisicoes_insert on public.requisicoes;
create policy requisicoes_insert on public.requisicoes
for insert
with check (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and solicitante_id = auth.uid())
);

drop policy if exists requisicoes_update on public.requisicoes;
create policy requisicoes_update on public.requisicoes
for update
using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
)
with check (
  public.is_super_admin()
  or tenant_id = public.current_tenant_id()
);

drop policy if exists requisicoes_delete on public.requisicoes;
create policy requisicoes_delete on public.requisicoes
for delete
using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);
