-- LumiBiz - Camada SaaS: modulos, assinaturas, ajuda e pagamentos

create table if not exists public.tenant_modulos (
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

create table if not exists public.tenant_assinaturas (
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

create table if not exists public.tenant_pagamentos (
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

create table if not exists public.ajuda_documentos (
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

create index if not exists idx_tenant_modulos_tenant_enabled on public.tenant_modulos(tenant_id, enabled);
create index if not exists idx_tenant_pagamentos_tenant_status on public.tenant_pagamentos(tenant_id, status);
create index if not exists idx_ajuda_documentos_categoria_ordem on public.ajuda_documentos(categoria, ordem);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tenant_modulos_updated_at on public.tenant_modulos;
create trigger trg_tenant_modulos_updated_at
before update on public.tenant_modulos
for each row execute function public.set_updated_at();

drop trigger if exists trg_tenant_assinaturas_updated_at on public.tenant_assinaturas;
create trigger trg_tenant_assinaturas_updated_at
before update on public.tenant_assinaturas
for each row execute function public.set_updated_at();

drop trigger if exists trg_ajuda_documentos_updated_at on public.ajuda_documentos;
create trigger trg_ajuda_documentos_updated_at
before update on public.ajuda_documentos
for each row execute function public.set_updated_at();

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
select t.id, t.plano_id, case when t.status = 'ativo' then 'ativo' else 'pendente' end, coalesce(p.preco_mensal, 0), current_date + interval '30 days'
from public.tenants t
left join public.planos p on p.id = t.plano_id
on conflict (tenant_id) do nothing;

alter table public.tenant_modulos enable row level security;
alter table public.tenant_assinaturas enable row level security;
alter table public.tenant_pagamentos enable row level security;
alter table public.ajuda_documentos enable row level security;

drop policy if exists tenant_modulos_select on public.tenant_modulos;
create policy tenant_modulos_select on public.tenant_modulos
for select
using (public.is_super_admin() or tenant_id = public.current_tenant_id());

drop policy if exists tenant_modulos_insert on public.tenant_modulos;
create policy tenant_modulos_insert on public.tenant_modulos
for insert
with check (public.is_super_admin());

drop policy if exists tenant_modulos_update on public.tenant_modulos;
create policy tenant_modulos_update on public.tenant_modulos
for update
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists tenant_modulos_delete on public.tenant_modulos;
create policy tenant_modulos_delete on public.tenant_modulos
for delete
using (public.is_super_admin());

drop policy if exists tenant_assinaturas_select on public.tenant_assinaturas;
create policy tenant_assinaturas_select on public.tenant_assinaturas
for select
using (public.is_super_admin() or tenant_id = public.current_tenant_id());

drop policy if exists tenant_assinaturas_insert on public.tenant_assinaturas;
create policy tenant_assinaturas_insert on public.tenant_assinaturas
for insert
with check (public.is_super_admin());

drop policy if exists tenant_assinaturas_update on public.tenant_assinaturas;
create policy tenant_assinaturas_update on public.tenant_assinaturas
for update
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists tenant_assinaturas_delete on public.tenant_assinaturas;
create policy tenant_assinaturas_delete on public.tenant_assinaturas
for delete
using (public.is_super_admin());

drop policy if exists tenant_pagamentos_select on public.tenant_pagamentos;
create policy tenant_pagamentos_select on public.tenant_pagamentos
for select
using (public.is_super_admin() or tenant_id = public.current_tenant_id());

drop policy if exists tenant_pagamentos_insert on public.tenant_pagamentos;
create policy tenant_pagamentos_insert on public.tenant_pagamentos
for insert
with check (public.is_super_admin() or tenant_id = public.current_tenant_id());

drop policy if exists tenant_pagamentos_update on public.tenant_pagamentos;
create policy tenant_pagamentos_update on public.tenant_pagamentos
for update
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists tenant_pagamentos_delete on public.tenant_pagamentos;
create policy tenant_pagamentos_delete on public.tenant_pagamentos
for delete
using (public.is_super_admin());

drop policy if exists ajuda_documentos_select on public.ajuda_documentos;
create policy ajuda_documentos_select on public.ajuda_documentos
for select
using (auth.uid() is not null);

drop policy if exists ajuda_documentos_insert on public.ajuda_documentos;
create policy ajuda_documentos_insert on public.ajuda_documentos
for insert
with check (public.is_super_admin());

drop policy if exists ajuda_documentos_update on public.ajuda_documentos;
create policy ajuda_documentos_update on public.ajuda_documentos
for update
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists ajuda_documentos_delete on public.ajuda_documentos;
create policy ajuda_documentos_delete on public.ajuda_documentos
for delete
using (public.is_super_admin());

insert into storage.buckets (id, name, public)
values ('help-center', 'help-center', true)
on conflict (id) do nothing;

drop policy if exists help_center_public_read on storage.objects;
create policy help_center_public_read on storage.objects
for select
using (bucket_id = 'help-center');

drop policy if exists help_center_super_admin_insert on storage.objects;
create policy help_center_super_admin_insert on storage.objects
for insert
with check (bucket_id = 'help-center' and public.is_super_admin());

drop policy if exists help_center_super_admin_update on storage.objects;
create policy help_center_super_admin_update on storage.objects
for update
using (bucket_id = 'help-center' and public.is_super_admin())
with check (bucket_id = 'help-center' and public.is_super_admin());

drop policy if exists help_center_super_admin_delete on storage.objects;
create policy help_center_super_admin_delete on storage.objects
for delete
using (bucket_id = 'help-center' and public.is_super_admin());
