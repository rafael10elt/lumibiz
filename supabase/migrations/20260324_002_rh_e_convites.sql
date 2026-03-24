-- LumiBiz - RH, metadados de perfis e convites de usuarios

alter table public.perfis
  add column if not exists telefone text,
  add column if not exists data_nascimento date,
  add column if not exists data_inicio_vinculo date,
  add column if not exists data_fim_vinculo date,
  add column if not exists cnpj text,
  add column if not exists razao_social text,
  add column if not exists valor_hora numeric(12,2),
  add column if not exists endereco text,
  add column if not exists observacoes text;

create table if not exists public.ferias (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  data_inicio date not null,
  data_retorno date not null,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.atestados (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  data_inicio date not null,
  data_retorno date not null,
  anexo_url text,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.epi_entregas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  item text not null,
  quantidade integer not null default 1,
  data_entrega date not null,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.ativos_colaboradores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  item text not null,
  data_entrega date not null,
  data_devolucao date,
  status text not null default 'em_uso' check (status in ('em_uso', 'devolvido')),
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.convites_usuarios (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome text not null,
  email text not null,
  role text not null default 'usuario' check (role in ('admin', 'gestor', 'usuario')),
  status text not null default 'pendente' check (status in ('pendente', 'aceito', 'cancelado', 'expirado')),
  token uuid not null default gen_random_uuid(),
  invited_by uuid references public.perfis(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_convites_usuarios_tenant_email_pendente
  on public.convites_usuarios(tenant_id, email)
  where status = 'pendente';

create index if not exists idx_ferias_tenant_usuario on public.ferias(tenant_id, usuario_id);
create index if not exists idx_atestados_tenant_usuario on public.atestados(tenant_id, usuario_id);
create index if not exists idx_epi_entregas_tenant_usuario on public.epi_entregas(tenant_id, usuario_id);
create index if not exists idx_ativos_colaboradores_tenant_usuario on public.ativos_colaboradores(tenant_id, usuario_id);
create index if not exists idx_convites_usuarios_tenant_status on public.convites_usuarios(tenant_id, status);

alter table public.ferias enable row level security;
alter table public.atestados enable row level security;
alter table public.epi_entregas enable row level security;
alter table public.ativos_colaboradores enable row level security;
alter table public.convites_usuarios enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['ferias', 'atestados', 'epi_entregas', 'ativos_colaboradores']
  loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format(
      'create policy %I_select on public.%I for select using (
        public.is_super_admin()
        or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
        or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
      )',
      t, t
    );

    execute format('drop policy if exists %I_insert on public.%I', t, t);
    execute format(
      'create policy %I_insert on public.%I for insert with check (
        public.is_super_admin()
        or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
      )',
      t, t
    );

    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format(
      'create policy %I_update on public.%I for update using (
        public.is_super_admin()
        or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
      ) with check (
        public.is_super_admin()
        or tenant_id = public.current_tenant_id()
      )',
      t, t
    );

    execute format('drop policy if exists %I_delete on public.%I', t, t);
    execute format(
      'create policy %I_delete on public.%I for delete using (
        public.is_super_admin()
        or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
      )',
      t, t
    );
  end loop;
end $$;

drop policy if exists convites_usuarios_select on public.convites_usuarios;
create policy convites_usuarios_select on public.convites_usuarios
for select
using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);

drop policy if exists convites_usuarios_insert on public.convites_usuarios;
create policy convites_usuarios_insert on public.convites_usuarios
for insert
with check (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);

drop policy if exists convites_usuarios_update on public.convites_usuarios;
create policy convites_usuarios_update on public.convites_usuarios
for update
using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
)
with check (
  public.is_super_admin()
  or tenant_id = public.current_tenant_id()
);

drop policy if exists convites_usuarios_delete on public.convites_usuarios;
create policy convites_usuarios_delete on public.convites_usuarios
for delete
using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);
