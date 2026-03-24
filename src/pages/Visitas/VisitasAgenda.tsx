import type { VisitaComRelacionamentos } from '../../hooks/useLumiBiz';
import { formatDate } from '../../lib/utils';

interface VisitasAgendaProps {
  visitas: VisitaComRelacionamentos[];
}

export function VisitasAgenda({ visitas }: VisitasAgendaProps) {
  const grupos = visitas.reduce<Record<string, VisitaComRelacionamentos[]>>((acc, visita) => {
    acc[visita.data_visita] = acc[visita.data_visita] || [];
    acc[visita.data_visita].push(visita);
    return acc;
  }, {});

  const datas = Object.keys(grupos).sort((a, b) => a.localeCompare(b));

  if (datas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800">
        Nenhuma visita encontrada para a agenda atual.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {datas.map((data) => (
        <section key={data} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <header className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3 dark:border-gray-700">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{formatDate(data)}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{grupos[data].length} visita(s) programada(s)</p>
            </div>
          </header>

          <div className="space-y-3">
            {grupos[data].map((visita) => (
              <div
                key={visita.id}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{visita.clientes?.nome || 'Cliente sem nome'}</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {visita.hora_inicio ? visita.hora_inicio.slice(0, 5) : 'Horario a definir'}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-gold/15 px-2.5 py-1 text-xs font-semibold text-brand-gold">
                    {visita.status}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <span>Usuario: {visita.perfis?.nome || 'Nao atribuido'}</span>
                  {visita.check_in && <span>Check-in realizado</span>}
                  {visita.check_out && <span>Check-out realizado</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
