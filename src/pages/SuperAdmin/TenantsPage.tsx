import { useTenants, type TenantComPlano } from '../../hooks/useLumiBiz';

export function TenantsPage() {
  const { data, isLoading, isError, error } = useTenants();
  const tenants: TenantComPlano[] = data || [];

  if (isLoading) {
    return <div className="py-12 text-center text-gray-500">Carregando tenants...</div>;
  }

  if (isError) {
    return <div className="py-12 text-center text-red-500">Erro ao carregar tenants: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gestao de Tenants</h2>
        <button className="px-4 py-2 rounded-lg bg-brand-dark text-white hover:bg-brand-gold transition-colors">
          Novo Tenant
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="text-left px-4 py-3">Tenant</th>
                <th className="text-left px-4 py-3">Plano</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Limite de Usuarios</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-4 py-3">{tenant.nome_fantasia}</td>
                  <td className="px-4 py-3">
                    {tenant.planos ? `${tenant.planos.nome} (R$ ${tenant.planos.preco_mensal})` : '-'}
                  </td>
                  <td className="px-4 py-3 capitalize">{tenant.status}</td>
                  <td className="px-4 py-3">{tenant.user_limit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
