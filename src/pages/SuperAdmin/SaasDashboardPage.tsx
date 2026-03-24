import { Building2, CreditCard, Layers3, WalletCards } from 'lucide-react';
import { useTenantAssinaturas, useTenantModulos, useTenantPagamentos, useTenants } from '../../hooks/useLumiBiz';
import { formatCurrency } from '../../lib/utils';

export function SaasDashboardPage() {
  const { data: tenants } = useTenants();
  const { data: assinaturas } = useTenantAssinaturas();
  const { data: pagamentos } = useTenantPagamentos();
  const { data: modulos } = useTenantModulos();

  const ativos = (tenants || []).filter((tenant) => tenant.status === 'ativo').length;
  const totalReceitaProjetada = (assinaturas || []).reduce((sum, item) => sum + Number(item.valor_mensal || 0), 0);
  const pendentes = (pagamentos || []).filter((item) => item.status === 'pendente').length;
  const modulosAtivos = (modulos || []).filter((item) => item.enabled).length;

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-brand-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue dark:text-blue-200">
            <WalletCards size={14} />
            Gestão do SaaS
          </span>
          <h2 className="section-title mt-4">Dashboard SaaS</h2>
          <p className="section-copy">Visão consolidada dos assinantes, receita projetada, pagamentos e módulos liberados.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <Metric title="Tenants" value={String((tenants || []).length)} icon={<Building2 size={18} />} tone="info" />
        <Metric title="Tenants ativos" value={String(ativos)} icon={<CreditCard size={18} />} tone="success" />
        <Metric title="Receita mensal projetada" value={formatCurrency(totalReceitaProjetada)} icon={<WalletCards size={18} />} tone="amber" />
        <Metric title="Módulos ativos" value={String(modulosAtivos)} icon={<Layers3 size={18} />} tone="info" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="surface-panel p-6">
          <h3 className="text-2xl font-semibold tracking-tight text-app-primary">Assinaturas recentes</h3>
          <div className="mt-5 space-y-3">
            {(assinaturas || []).slice(0, 6).map((item) => (
              <div key={item.id} className="surface-subtle flex items-center justify-between gap-4 px-4 py-4">
                <div>
                  <p className="font-medium text-app-primary">{item.tenants?.nome_fantasia || 'Tenant sem nome'}</p>
                  <p className="text-sm text-app-secondary">{item.planos?.nome || 'Sem plano'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-app-primary">{formatCurrency(Number(item.valor_mensal || 0))}</p>
                  <p className="text-xs capitalize text-app-muted">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-panel p-6">
          <h3 className="text-2xl font-semibold tracking-tight text-app-primary">Pagamentos aguardando validação</h3>
          <div className="mt-5 space-y-3">
            {(pagamentos || [])
              .filter((item) => item.status === 'pendente')
              .slice(0, 6)
              .map((item) => (
                <div key={item.id} className="surface-subtle flex items-center justify-between gap-4 px-4 py-4">
                  <div>
                    <p className="font-medium text-app-primary">{new Date(item.data_pagamento).toLocaleDateString('pt-BR')}</p>
                    <p className="text-sm text-app-secondary">{item.observacao || 'Comprovante pendente de revisão'}</p>
                  </div>
                  <p className="font-semibold text-brand-orange">{formatCurrency(Number(item.valor || 0))}</p>
                </div>
              ))}

            {pendentes === 0 && <div className="surface-subtle px-4 py-5 text-sm text-app-secondary">Nenhum pagamento pendente no momento.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
  tone
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone: 'info' | 'success' | 'amber';
}) {
  const toneMap = {
    info: 'bg-brand-blue/12 text-brand-blue dark:text-blue-200',
    success: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
    amber: 'bg-brand-orange/12 text-brand-orange dark:text-orange-200'
  };

  return (
    <div className="surface-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-app-secondary">{title}</p>
          <p className="mt-3 text-2xl font-semibold text-app-primary">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneMap[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}
