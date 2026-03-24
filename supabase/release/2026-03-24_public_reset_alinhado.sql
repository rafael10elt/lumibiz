-- LumiBiz
-- Reset completo do schema public alinhado com a aplicacao atual.
-- Uso: cole este arquivo inteiro no SQL Editor do Supabase e execute uma vez.
-- Atencao: este script apaga todas as tabelas do schema public relacionadas ao app.

begin;

create extension if not exists "pgcrypto";

drop trigger if exists on_auth_user_created on auth.users;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.current_user_role() cascade;
drop function if exists public.current_tenant_id() cascade;
drop function if exists public.is_super_admin() cascade;
drop function if exists public.is_tenant_manager() cascade;

drop table if exists public.ajuda_documentos cascade;
drop table if exists public.tenant_pagamentos cascade;
drop table if exists public.tenant_assinaturas cascade;
drop table if exists public.tenant_modulos cascade;
drop table if exists public.convites_usuarios cascade;
drop table if exists public.ativos_colaboradores cascade;
drop table if exists public.ativos_entregues cascade;
drop table if exists public.epi_entregas cascade;
drop table if exists public.epis_entregues cascade;
drop table if exists public.atestados cascade;
drop table if exists public.ferias cascade;
drop table if exists public.consultores_docs cascade;
drop table if exists public.clientes_docs cascade;
drop table if exists public.itens_requisicao cascade;
drop table if exists public.chamados cascade;
drop table if exists public.servicos cascade;
drop table if exists public.validades cascade;
drop table if exists public.reembolsos cascade;
drop table if exists public.itens_catalogo cascade;
drop table if exists public.requisicoes cascade;
drop table if exists public.custos cascade;
drop table if exists public.receitas cascade;
drop table if exists public.visitas cascade;
drop table if exists public.clientes cascade;
drop table if exists public.perfis cascade;
drop table if exists public.tenants cascade;
drop table if exists public.planos cascade;

drop type if exists public.user_role cascade;

create table public.planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  preco_mensal numeric(12,2) not null default 0,
  user_limit integer not null default 5,
  created_at timestamptz not null default now()
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  nome_fantasia text,
  razao_social text,
  cnpj text unique,
  plano_id uuid references public.planos(id) on delete set null,
  status text not null default 'ativo' check (status in ('ativo', 'inativo', 'suspenso')),
  user_limit integer not null default 5,
  created_at timestamptz not null default now()
);

create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete set null,
  nome text,
  email text,
  foto_url text,
  role text not null default 'usuario' check (role in ('super_admin', 'admin', 'gestor', 'usuario')),
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  telefone text,
  data_nascimento date,
  data_inicio_vinculo date,
  data_fim_vinculo date,
  cnpj text,
  razao_social text,
  valor_hora numeric(12,2),
  endereco text,
  observacoes text,
  created_at timestamptz not null default now()
);

create table public.clientes (
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

create table public.visitas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  usuario_id uuid references public.perfis(id) on delete set null,
  status text not null default 'Agendada' check (status in ('Agendada', 'Em Andamento', 'Concluida')),
  data_visita date not null,
  hora_inicio time,
  check_in timestamptz,
  check_in_local text,
  check_out timestamptz,
  check_out_local text,
  created_at timestamptz not null default now()
);

create table public.receitas (
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

create table public.custos (
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

create table public.requisicoes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  solicitante_id uuid references public.perfis(id) on delete set null,
  status text default 'aberta',
  observacoes text,
  created_at timestamptz not null default now()
);

create table public.itens_catalogo (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome text not null,
  categoria text,
  unidade text,
  preco_unitario numeric(12,2),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.reembolsos (
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

create table public.validades (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  titulo text not null,
  data_validade date not null,
  status text default 'pendente',
  created_at timestamptz not null default now()
);

create table public.servicos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  usuario_id uuid references public.perfis(id) on delete set null,
  titulo text not null,
  descricao text,
  status text default 'aberto',
  created_at timestamptz not null default now()
);

create table public.chamados (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  usuario_id uuid references public.perfis(id) on delete set null,
  titulo text not null,
  prioridade text default 'media',
  status text default 'aberto',
  created_at timestamptz not null default now()
);

create table public.ferias (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  data_inicio date not null,
  data_retorno date not null,
  observacoes text,
  created_at timestamptz not null default now()
);

create table public.atestados (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  data_inicio date not null,
  data_retorno date not null,
  anexo_url text,
  observacoes text,
  created_at timestamptz not null default now()
);

create table public.epi_entregas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  item text not null,
  quantidade integer not null default 1,
  data_entrega date not null,
  observacoes text,
  created_at timestamptz not null default now()
);

create table public.ativos_colaboradores (
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

create table public.convites_usuarios (
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

create table public.tenant_modulos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  modulo text not null check (
    modulo in (
      'dashboard',
      'perfil',
      'rh',
      'visitas',
      'requisicoes',
      'financeiro',
      'clientes',
      'reembolsos',
      'validades',
      'servicos',
      'chamados'
    )
  ),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, modulo)
);

create table public.tenant_assinaturas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  plano_id uuid references public.planos(id) on delete set null,
  status text not null default 'ativo' check (status in ('ativo', 'pendente', 'atrasado', 'suspenso', 'cancelado')),
  valor_mensal numeric(12,2) not null default 0,
  proximo_vencimento date,
  pix_qrcode_url text,
  pix_copia_cola text,
  pix_chave text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tenant_pagamentos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  assinatura_id uuid references public.tenant_assinaturas(id) on delete set null,
  valor numeric(12,2) not null,
  data_pagamento date not null default current_date,
  status text not null default 'pendente' check (status in ('pendente', 'validado', 'recusado')),
  observacao text,
  comprovante_url text,
  created_at timestamptz not null default now()
);

create table public.ajuda_documentos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text not null default 'manual',
  descricao text,
  arquivo_url text,
  storage_path text,
  icone text not null default 'file-text',
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_perfis_tenant on public.perfis(tenant_id);
create index idx_clientes_tenant on public.clientes(tenant_id);
create index idx_visitas_tenant_usuario on public.visitas(tenant_id, usuario_id);
create index idx_receitas_tenant_usuario on public.receitas(tenant_id, usuario_id);
create index idx_custos_tenant_usuario on public.custos(tenant_id, usuario_id);
create index idx_requisicoes_tenant_solicitante on public.requisicoes(tenant_id, solicitante_id);
create index idx_reembolsos_tenant_usuario on public.reembolsos(tenant_id, usuario_id);
create index idx_validades_tenant on public.validades(tenant_id);
create index idx_servicos_tenant_usuario on public.servicos(tenant_id, usuario_id);
create index idx_chamados_tenant_usuario on public.chamados(tenant_id, usuario_id);
create index idx_ferias_tenant_usuario on public.ferias(tenant_id, usuario_id);
create index idx_atestados_tenant_usuario on public.atestados(tenant_id, usuario_id);
create index idx_epi_entregas_tenant_usuario on public.epi_entregas(tenant_id, usuario_id);
create index idx_ativos_colaboradores_tenant_usuario on public.ativos_colaboradores(tenant_id, usuario_id);
create unique index idx_convites_usuarios_tenant_email_pendente on public.convites_usuarios(tenant_id, email) where status = 'pendente';
create index idx_convites_usuarios_tenant_status on public.convites_usuarios(tenant_id, status);
create index idx_tenant_modulos_tenant_enabled on public.tenant_modulos(tenant_id, enabled);
create index idx_tenant_pagamentos_tenant_status on public.tenant_pagamentos(tenant_id, status);
create index idx_ajuda_documentos_categoria_ordem on public.ajuda_documentos(categoria, ordem);

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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create trigger trg_tenant_modulos_updated_at
before update on public.tenant_modulos
for each row execute function public.set_updated_at();

create trigger trg_tenant_assinaturas_updated_at
before update on public.tenant_assinaturas
for each row execute function public.set_updated_at();

create trigger trg_ajuda_documentos_updated_at
before update on public.ajuda_documentos
for each row execute function public.set_updated_at();

insert into public.planos (nome, descricao, preco_mensal, user_limit)
values
  ('Basic', 'Plano inicial LumiBiz', 89.90, 5),
  ('Pro', 'Plano profissional LumiBiz', 149.90, 15),
  ('Enterprise', 'Plano enterprise LumiBiz', 299.90, 50)
on conflict (nome) do update
set descricao = excluded.descricao,
    preco_mensal = excluded.preco_mensal,
    user_limit = excluded.user_limit;

insert into public.tenant_modulos (tenant_id, modulo, enabled)
select tenants.id, modulos.modulo, true
from public.tenants
cross join (
  values
    ('dashboard'),
    ('perfil'),
    ('rh'),
    ('visitas'),
    ('requisicoes'),
    ('financeiro'),
    ('clientes'),
    ('reembolsos'),
    ('validades'),
    ('servicos'),
    ('chamados')
) as modulos(modulo)
on conflict (tenant_id, modulo) do nothing;

insert into public.tenant_assinaturas (tenant_id, plano_id, status, valor_mensal, proximo_vencimento)
select
  t.id,
  t.plano_id,
  case when t.status = 'ativo' then 'ativo' else 'pendente' end,
  coalesce(p.preco_mensal, 0),
  current_date + interval '30 days'
from public.tenants t
left join public.planos p on p.id = t.plano_id
on conflict (tenant_id) do nothing;

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
alter table public.ferias enable row level security;
alter table public.atestados enable row level security;
alter table public.epi_entregas enable row level security;
alter table public.ativos_colaboradores enable row level security;
alter table public.convites_usuarios enable row level security;
alter table public.tenant_modulos enable row level security;
alter table public.tenant_assinaturas enable row level security;
alter table public.tenant_pagamentos enable row level security;
alter table public.ajuda_documentos enable row level security;

create policy planos_select on public.planos
for select using (public.is_super_admin());
create policy planos_insert on public.planos
for insert with check (public.is_super_admin());
create policy planos_update on public.planos
for update using (public.is_super_admin()) with check (public.is_super_admin());
create policy planos_delete on public.planos
for delete using (public.is_super_admin());

create policy tenants_select on public.tenants
for select using (public.is_super_admin() or id = public.current_tenant_id());
create policy tenants_insert on public.tenants
for insert with check (public.is_super_admin());
create policy tenants_update on public.tenants
for update using (public.is_super_admin() or id = public.current_tenant_id())
with check (public.is_super_admin() or id = public.current_tenant_id());
create policy tenants_delete on public.tenants
for delete using (public.is_super_admin());

create policy perfis_select on public.perfis
for select using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or id = auth.uid()
);
create policy perfis_insert on public.perfis
for insert with check (
  public.is_super_admin()
  or (public.is_tenant_manager() and tenant_id = public.current_tenant_id())
);
create policy perfis_update on public.perfis
for update using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or id = auth.uid()
)
with check (
  public.is_super_admin()
  or tenant_id = public.current_tenant_id()
);
create policy perfis_delete on public.perfis
for delete using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);

create policy clientes_select on public.clientes
for select using (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy clientes_insert on public.clientes
for insert with check (public.is_super_admin() or (public.is_tenant_manager() and tenant_id = public.current_tenant_id()));
create policy clientes_update on public.clientes
for update using (public.is_super_admin() or (public.is_tenant_manager() and tenant_id = public.current_tenant_id()))
with check (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy clientes_delete on public.clientes
for delete using (public.is_super_admin() or (public.is_tenant_manager() and tenant_id = public.current_tenant_id()));

create policy itens_catalogo_select on public.itens_catalogo
for select using (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy itens_catalogo_insert on public.itens_catalogo
for insert with check (public.is_super_admin() or (public.is_tenant_manager() and tenant_id = public.current_tenant_id()));
create policy itens_catalogo_update on public.itens_catalogo
for update using (public.is_super_admin() or (public.is_tenant_manager() and tenant_id = public.current_tenant_id()))
with check (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy itens_catalogo_delete on public.itens_catalogo
for delete using (public.is_super_admin() or (public.is_tenant_manager() and tenant_id = public.current_tenant_id()));

create policy validades_select on public.validades
for select using (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy validades_insert on public.validades
for insert with check (public.is_super_admin() or (public.is_tenant_manager() and tenant_id = public.current_tenant_id()));
create policy validades_update on public.validades
for update using (public.is_super_admin() or (public.is_tenant_manager() and tenant_id = public.current_tenant_id()))
with check (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy validades_delete on public.validades
for delete using (public.is_super_admin() or (public.is_tenant_manager() and tenant_id = public.current_tenant_id()));

create policy visitas_select on public.visitas
for select using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
);
create policy visitas_insert on public.visitas
for insert with check (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
);
create policy visitas_update on public.visitas
for update using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
)
with check (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy visitas_delete on public.visitas
for delete using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);

create policy receitas_select on public.receitas
for select using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
);
create policy receitas_insert on public.receitas
for insert with check (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
);
create policy receitas_update on public.receitas
for update using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
)
with check (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy receitas_delete on public.receitas
for delete using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);

create policy custos_select on public.custos
for select using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
);
create policy custos_insert on public.custos
for insert with check (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
);
create policy custos_update on public.custos
for update using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
)
with check (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy custos_delete on public.custos
for delete using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);

create policy reembolsos_select on public.reembolsos
for select using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
);
create policy reembolsos_insert on public.reembolsos
for insert with check (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
);
create policy reembolsos_update on public.reembolsos
for update using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
)
with check (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy reembolsos_delete on public.reembolsos
for delete using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);

create policy servicos_select on public.servicos
for select using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
);
create policy servicos_insert on public.servicos
for insert with check (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
);
create policy servicos_update on public.servicos
for update using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
)
with check (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy servicos_delete on public.servicos
for delete using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);

create policy chamados_select on public.chamados
for select using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
);
create policy chamados_insert on public.chamados
for insert with check (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
);
create policy chamados_update on public.chamados
for update using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
)
with check (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy chamados_delete on public.chamados
for delete using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);

create policy requisicoes_select on public.requisicoes
for select using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and solicitante_id = auth.uid())
);
create policy requisicoes_insert on public.requisicoes
for insert with check (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and solicitante_id = auth.uid())
);
create policy requisicoes_update on public.requisicoes
for update using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
)
with check (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy requisicoes_delete on public.requisicoes
for delete using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);

create policy ferias_select on public.ferias
for select using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
);
create policy ferias_insert on public.ferias
for insert with check (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);
create policy ferias_update on public.ferias
for update using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
)
with check (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy ferias_delete on public.ferias
for delete using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);

create policy atestados_select on public.atestados
for select using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
);
create policy atestados_insert on public.atestados
for insert with check (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);
create policy atestados_update on public.atestados
for update using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
)
with check (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy atestados_delete on public.atestados
for delete using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);

create policy epi_entregas_select on public.epi_entregas
for select using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
);
create policy epi_entregas_insert on public.epi_entregas
for insert with check (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);
create policy epi_entregas_update on public.epi_entregas
for update using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
)
with check (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy epi_entregas_delete on public.epi_entregas
for delete using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);

create policy ativos_colaboradores_select on public.ativos_colaboradores
for select using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
  or (tenant_id = public.current_tenant_id() and usuario_id = auth.uid())
);
create policy ativos_colaboradores_insert on public.ativos_colaboradores
for insert with check (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);
create policy ativos_colaboradores_update on public.ativos_colaboradores
for update using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
)
with check (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy ativos_colaboradores_delete on public.ativos_colaboradores
for delete using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);

create policy convites_usuarios_select on public.convites_usuarios
for select using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);
create policy convites_usuarios_insert on public.convites_usuarios
for insert with check (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);
create policy convites_usuarios_update on public.convites_usuarios
for update using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
)
with check (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy convites_usuarios_delete on public.convites_usuarios
for delete using (
  public.is_super_admin()
  or (tenant_id = public.current_tenant_id() and public.is_tenant_manager())
);

create policy tenant_modulos_select on public.tenant_modulos
for select using (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy tenant_modulos_insert on public.tenant_modulos
for insert with check (public.is_super_admin());
create policy tenant_modulos_update on public.tenant_modulos
for update using (public.is_super_admin()) with check (public.is_super_admin());
create policy tenant_modulos_delete on public.tenant_modulos
for delete using (public.is_super_admin());

create policy tenant_assinaturas_select on public.tenant_assinaturas
for select using (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy tenant_assinaturas_insert on public.tenant_assinaturas
for insert with check (public.is_super_admin());
create policy tenant_assinaturas_update on public.tenant_assinaturas
for update using (public.is_super_admin()) with check (public.is_super_admin());
create policy tenant_assinaturas_delete on public.tenant_assinaturas
for delete using (public.is_super_admin());

create policy tenant_pagamentos_select on public.tenant_pagamentos
for select using (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy tenant_pagamentos_insert on public.tenant_pagamentos
for insert with check (public.is_super_admin() or tenant_id = public.current_tenant_id());
create policy tenant_pagamentos_update on public.tenant_pagamentos
for update using (public.is_super_admin()) with check (public.is_super_admin());
create policy tenant_pagamentos_delete on public.tenant_pagamentos
for delete using (public.is_super_admin());

create policy ajuda_documentos_select on public.ajuda_documentos
for select using (auth.uid() is not null);
create policy ajuda_documentos_insert on public.ajuda_documentos
for insert with check (public.is_super_admin());
create policy ajuda_documentos_update on public.ajuda_documentos
for update using (public.is_super_admin()) with check (public.is_super_admin());
create policy ajuda_documentos_delete on public.ajuda_documentos
for delete using (public.is_super_admin());

insert into storage.buckets (id, name, public)
values ('help-center', 'help-center', true)
on conflict (id) do nothing;

drop policy if exists help_center_public_read on storage.objects;
create policy help_center_public_read on storage.objects
for select using (bucket_id = 'help-center');

drop policy if exists help_center_super_admin_insert on storage.objects;
create policy help_center_super_admin_insert on storage.objects
for insert with check (bucket_id = 'help-center' and public.is_super_admin());

drop policy if exists help_center_super_admin_update on storage.objects;
create policy help_center_super_admin_update on storage.objects
for update using (bucket_id = 'help-center' and public.is_super_admin())
with check (bucket_id = 'help-center' and public.is_super_admin());

drop policy if exists help_center_super_admin_delete on storage.objects;
create policy help_center_super_admin_delete on storage.objects
for delete using (bucket_id = 'help-center' and public.is_super_admin());

commit;
