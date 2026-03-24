import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Crown, Save, Users2 } from 'lucide-react';
import { useTenantModulos, useTenants, type TenantComPlano } from '../../hooks/useLumiBiz';
import { supabase } from '../../lib/supabase';
import { SAAS_MODULES } from '../../lib/support';

export function TenantsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useTenants();
  const { data: modulos } = useTenantModulos();
  const tenants: TenantComPlano[] = data || [];
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [status, setStatus] = useState('ativo');
  const [userLimit, setUserLimit] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId) || null;
  const selectedModules = (modulos || []).filter((item) => item.tenant_id === selectedTenantId);

  const openTenant = (tenant: TenantComPlano) => {
    setSelectedTenantId(tenant.id);
    setStatus(tenant.status);
    setUserLimit(String(tenant.user_limit || ''));
  };

  const saveTenant = async () => {
    if (!selectedTenantId) return;
    setSaving(true);
    const result = await supabase.from('tenants').update({ status, user_limit: Number(userLimit || 0) } as never).eq('id', selectedTenantId);
    setSaving(false);

    if (result.error) {
      alert(`Erro ao salvar tenant: ${result.error.message}`);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['tenants'] });
  };

  const toggleModulo = async (tenantId: string, modulo: string, enabled: boolean) => {
    const existing = (modulos || []).find((item) => item.tenant_id === tenantId && item.modulo === modulo);
    const result = existing
      ? await supabase.from('tenant_modulos').update({ enabled: !enabled } as never).eq('id', existing.id)
      : await supabase.from('tenant_modulos').insert({ tenant_id: tenantId, modulo, enabled: true } as never);

    if (result.error) {
      alert(`Erro ao atualizar modulo: ${result.error.message}`);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['saas', 'modulos', 'all'] });
  };

  if (isLoading) {
    return <div className="surface-panel p-6 text-app-secondary">Carregando tenants...</div>;
  }

  if (isError) {
    return <div className="surface-panel p-6 text-rose-600 dark:text-rose-300">Erro ao carregar tenants: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-brand-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue dark:text-blue-200">
            <Crown size={14} />
            Super admin
          </span>
          <h2 className="section-title mt-4">Gestao de tenants</h2>
          <p className="section-copy">Controle status, limite de usuarios e modulos liberados para montar pacotes personalizados.</p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 sm:w-auto">
          <Metric label="Tenants" value={String(tenants.length)} icon={<Building2 size={18} />} />
          <Metric label="Ativos" value={String(tenants.filter((tenant) => tenant.status === 'ativo').length)} icon={<Crown size={18} />} />
          <Metric label="Usuarios previstos" value={String(tenants.reduce((sum, tenant) => sum + Number(tenant.user_limit || 0), 0))} icon={<Users2 size={18} />} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="surface-panel p-6">
          <div className="space-y-3">
            {tenants.map((tenant) => (
              <button key={tenant.id} onClick={() => openTenant(tenant)} className={`surface-subtle flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition ${selectedTenantId === tenant.id ? 'border-brand-blue/30' : ''}`}>
                <div>
                  <p className="font-semibold text-app-primary">{tenant.nome_fantasia}</p>
                  <p className="text-sm text-app-secondary">{tenant.planos?.nome || 'Sem plano'} • limite {tenant.user_limit || 0} usuarios</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tenant.status === 'ativo' ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300' : 'bg-brand-orange/12 text-brand-orange dark:text-orange-200'}`}>
                  {tenant.status}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="surface-panel p-6">
          <h3 className="text-2xl font-semibold tracking-tight text-app-primary">Configurar tenant</h3>
          {!selectedTenant && <p className="mt-4 text-sm text-app-secondary">Selecione um tenant para editar seu pacote e limites.</p>}

          {selectedTenant && (
            <div className="mt-5 space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field">
                  <option value="ativo">ativo</option>
                  <option value="inativo">inativo</option>
                  <option value="suspenso">suspenso</option>
                </select>
                <input value={userLimit} onChange={(e) => setUserLimit(e.target.value)} type="number" min="1" className="input-field" placeholder="Limite de usuarios" />
              </div>

              <button onClick={saveTenant} disabled={saving} className="btn-primary">
                <Save size={18} />
                {saving ? 'Salvando...' : 'Salvar tenant'}
              </button>

              <div>
                <p className="mb-3 text-sm font-medium text-app-primary">Módulos liberados</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {SAAS_MODULES.map((module) => {
                    const current = selectedModules.find((item) => item.modulo === module.slug);
                    const enabled = current?.enabled ?? false;
                    return (
                      <button
                        key={module.slug}
                        onClick={() => toggleModulo(selectedTenant.id, module.slug, enabled)}
                        className={`surface-subtle flex items-center justify-between px-4 py-4 text-left transition ${
                          enabled ? 'border-brand-blue/30' : 'opacity-75'
                        }`}
                      >
                        <span className="font-medium text-app-primary">{module.label}</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${enabled ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300' : 'bg-slate-500/12 text-slate-700 dark:text-slate-200'}`}>
                          {enabled ? 'Liberado' : 'Bloqueado'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="surface-subtle p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-app-secondary">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-app-primary">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue/12 text-brand-blue dark:text-blue-200">{icon}</div>
      </div>
    </div>
  );
}
