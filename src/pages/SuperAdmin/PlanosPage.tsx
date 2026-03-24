import { usePlanos } from '../../hooks/useLumiBiz';

export function PlanosPage() {
  const { data: planos, isLoading, isError, error } = usePlanos();

  if (isLoading) {
    return <div className="py-12 text-center text-gray-500">Carregando planos...</div>;
  }

  if (isError) {
    return <div className="py-12 text-center text-red-500">Erro ao carregar planos: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gestao de Planos</h2>
        <button className="px-4 py-2 rounded-lg bg-brand-dark text-white hover:bg-brand-gold transition-colors">
          Novo Plano
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {planos?.map((plano) => (
          <div
            key={plano.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
          >
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{plano.nome}</p>
            <p className="text-brand-gold font-medium mt-1">R$ {Number(plano.preco_mensal).toFixed(2)} / mes</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Limite de usuarios: {plano.user_limit}
            </p>
            {plano.descricao && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{plano.descricao}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
