import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, ImagePlus, Mail, Phone, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant, type Tenant } from '../../hooks/useLumiBiz';
import { supabase } from '../../lib/supabase';

export function ConfiguracoesPage() {
  const { perfil } = useAuth();
  const tenantId = perfil?.tenant_id || undefined;
  const { data: tenant, isLoading } = useTenant(tenantId);

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-brand-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue dark:text-blue-200">
            <Building2 size={14} />
            Identidade do tenant
          </span>
          <h2 className="section-title mt-4">Configuracoes</h2>
          <p className="section-copy">Atualize os dados institucionais do tenant e a logo usada no menu lateral e nos relatorios em PDF.</p>
        </div>
      </section>

      <section className="surface-panel p-6 sm:p-7">
        {isLoading ? (
          <div className="text-sm text-app-secondary">Carregando configuracoes do tenant...</div>
        ) : tenant ? (
          <ConfiguracoesForm tenant={tenant} />
        ) : (
          <div className="text-sm text-app-secondary">Tenant nao encontrado para este usuario.</div>
        )}
      </section>
    </div>
  );
}

function ConfiguracoesForm({ tenant }: { tenant: Tenant }) {
  const queryClient = useQueryClient();
  const { refreshPerfil } = useAuth();
  const [nomeFantasia, setNomeFantasia] = useState(tenant.nome_fantasia || '');
  const [razaoSocial, setRazaoSocial] = useState(tenant.razao_social || '');
  const [email, setEmail] = useState(tenant.email || '');
  const [telefone, setTelefone] = useState(tenant.telefone || '');
  const [endereco, setEndereco] = useState(tenant.endereco || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const saveTenant = async () => {
    setSaving(true);
    let logoUrl = tenant.logo_url || null;

    if (logoFile) {
      const extension = logoFile.name.split('.').pop() || 'png';
      const storagePath = `${tenant.id}/logo-${Date.now()}.${extension}`;
      const uploadResult = await supabase.storage.from('tenant-assets').upload(storagePath, logoFile, { upsert: true });

      if (uploadResult.error) {
        setSaving(false);
        alert(`Erro ao enviar logo: ${uploadResult.error.message}`);
        return;
      }

      const { data } = supabase.storage.from('tenant-assets').getPublicUrl(storagePath);
      logoUrl = data.publicUrl;
    }

    const updateResult = await supabase
      .from('tenants')
      .update({
        nome_fantasia: nomeFantasia.trim() || null,
        razao_social: razaoSocial.trim() || null,
        email: email.trim() || null,
        telefone: telefone.trim() || null,
        endereco: endereco.trim() || null,
        logo_url: logoUrl
      } as never)
      .eq('id', tenant.id);

    setSaving(false);

    if (updateResult.error) {
      alert(`Erro ao salvar configuracoes: ${updateResult.error.message}`);
      return;
    }

    setLogoFile(null);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tenant', tenant.id] }),
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    ]);
    await refreshPerfil();
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5">
        <Field label="Nome fantasia">
          <input value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} className="input-field" />
        </Field>
        <Field label="Razao social">
          <input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} className="input-field" />
        </Field>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="E-mail institucional">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3.5 text-app-muted" size={18} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" />
            </div>
          </Field>
          <Field label="Telefone">
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-3.5 text-app-muted" size={18} />
              <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="input-field pl-10" />
            </div>
          </Field>
        </div>
        <Field label="Endereco">
          <textarea value={endereco} onChange={(e) => setEndereco(e.target.value)} rows={4} className="textarea-field" />
        </Field>
      </div>

      <div className="space-y-5">
        <div className="surface-subtle p-5">
          <p className="text-sm font-medium text-app-primary">Logo atual</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue via-brand-blue-deep to-brand-orange shadow-glow">
              {tenant.logo_url ? <img src={tenant.logo_url} alt="Logo do tenant" className="h-full w-full object-cover" /> : <span className="text-2xl font-black text-white">LB</span>}
            </div>
            <div className="text-sm text-app-secondary">
              <p>Essa imagem sera exibida no menu lateral.</p>
              <p className="mt-1">Tambem sera usada como identidade padrao dos relatorios PDF.</p>
            </div>
          </div>
        </div>

        <Field label="Nova logo">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-border-subtle bg-surface-elevated px-4 py-5 text-sm font-medium text-app-secondary transition hover:border-brand-blue/30 hover:text-app-primary">
            <ImagePlus size={18} />
            <span>{logoFile ? logoFile.name : 'Selecionar arquivo de imagem'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
          </label>
        </Field>

        <button onClick={saveTenant} disabled={saving} className="btn-primary w-full">
          <Save size={18} />
          {saving ? 'Salvando...' : 'Salvar configuracoes'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-app-primary">{label}</label>
      {children}
    </div>
  );
}
