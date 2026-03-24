import { BadgeDollarSign, Layers3, UsersRound } from 'lucide-react';
import { usePlanos } from '../../hooks/useLumiBiz';

export function PlanosPage() {
  const { data: planos, isLoading, isError, error } = usePlanos();

  if (isLoading) {
    return <div className="surface-panel p-6 text-app-secondary">Carregando planos...</div>;
  }

  if (isError) {
    return <div className="surface-panel p-6 text-rose-600 dark:text-rose-300">Erro ao carregar planos: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-orange/15 bg-brand-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-orange dark:text-orange-200">
            <Layers3 size={14} />
            Estrategia comercial
          </span>
          <h2 className="section-title mt-4">Gestao de planos</h2>
          <p className="section-copy">Catalogo de planos usados na operacao multitenant, com foco em monetizacao e limites de uso.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {planos?.map((plano) => (
          <article key={plano.id} className="surface-panel p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-semibold tracking-tight text-app-primary">{plano.nome}</p>
                <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-orange/12 px-3 py-1 text-sm font-semibold text-brand-orange dark:text-orange-200">
                  <BadgeDollarSign size={16} />
                  R$ {Number(plano.preco_mensal).toFixed(2)} / mes
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/12 text-brand-blue dark:text-blue-200">
                <Layers3 size={20} />
              </div>
            </div>

            <div className="mt-5 surface-subtle p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-app-muted">Limite</p>
              <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-app-primary">
                <UsersRound size={16} />
                {plano.user_limit} usuarios
              </p>
            </div>

            {plano.descricao && <p className="mt-5 text-sm leading-6 text-app-secondary">{plano.descricao}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
