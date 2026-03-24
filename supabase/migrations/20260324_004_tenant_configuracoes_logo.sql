-- LumiBiz - Configuracoes do tenant e logo institucional

alter table public.tenants
  add column if not exists email text,
  add column if not exists telefone text,
  add column if not exists endereco text,
  add column if not exists logo_url text;

insert into storage.buckets (id, name, public)
values ('tenant-assets', 'tenant-assets', true)
on conflict (id) do nothing;

drop policy if exists tenant_assets_public_read on storage.objects;
create policy tenant_assets_public_read on storage.objects
for select
using (bucket_id = 'tenant-assets');

drop policy if exists tenant_assets_admin_insert on storage.objects;
create policy tenant_assets_admin_insert on storage.objects
for insert
with check (
  bucket_id = 'tenant-assets'
  and (
    public.is_super_admin()
    or (
      public.current_user_role() = 'admin'
      and split_part(name, '/', 1) = public.current_tenant_id()::text
    )
  )
);

drop policy if exists tenant_assets_admin_update on storage.objects;
create policy tenant_assets_admin_update on storage.objects
for update
using (
  bucket_id = 'tenant-assets'
  and (
    public.is_super_admin()
    or (
      public.current_user_role() = 'admin'
      and split_part(name, '/', 1) = public.current_tenant_id()::text
    )
  )
)
with check (
  bucket_id = 'tenant-assets'
  and (
    public.is_super_admin()
    or (
      public.current_user_role() = 'admin'
      and split_part(name, '/', 1) = public.current_tenant_id()::text
    )
  )
);

drop policy if exists tenant_assets_admin_delete on storage.objects;
create policy tenant_assets_admin_delete on storage.objects
for delete
using (
  bucket_id = 'tenant-assets'
  and (
    public.is_super_admin()
    or (
      public.current_user_role() = 'admin'
      and split_part(name, '/', 1) = public.current_tenant_id()::text
    )
  )
);
