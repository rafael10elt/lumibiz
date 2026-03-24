import { Building2, Crown, Users2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTenants, type TenantComPlano } from '../../hooks/useLumiBiz';

export function TenantsPage() {
  const { data, isLoading, isError, error } = useTenants();
  const tenants: TenantComPlano[] = data || [];

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
          <p className="section-copy">Visao global dos ambientes cadastrados, planos vinculados e limites operacionais.</p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 sm:w-auto">
          <Metric label="Tenants" value={String(tenants.length)} icon={<Building2 size={18} />} />
          <Metric label="Ativos" value={String(tenants.filter((tenant) => tenant.status === 'ativo').length)} icon={<Crown size={18} />} />
          <Metric label="Usuarios previstos" value={String(tenants.reduce((sum, tenant) => sum + Number(tenant.user_limit || 0), 0))} icon={<Users2 size={18} />} />
        </div>
      </section>

      <section className="surface-panel overflow-x-auto p-2">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-app-muted">
              <th className="px-4 py-4 font-medium">Tenant</th>
              <th className="px-4 py-4 font-medium">Plano</th>
              <th className="px-4 py-4 font-medium">Status</th>
              <th className="px-4 py-4 font-medium">Limite de usuarios</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-t border-border-subtle">
                <td className="px-4 py-4">
                  <p className="font-semibold text-app-primary">{tenant.nome_fantasia || 'Sem nome fantasia'}</p>
                  <p className="text-xs text-app-muted">{tenant.razao_social || 'Sem razao social'}</p>
                </td>
                <td className="px-4 py-4 text-app-secondary">{tenant.planos ? `${tenant.planos.nome} (R$ ${tenant.planos.preco_mensal})` : '-'}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tenant.status === 'ativo' ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300' : 'bg-brand-orange/12 text-brand-orange dark:text-orange-200'}`}>
                    {tenant.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-app-primary">{tenant.user_limit || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
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
