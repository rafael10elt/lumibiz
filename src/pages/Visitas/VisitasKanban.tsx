import type { VisitaComRelacionamentos } from '../../hooks/useLumiBiz';
import { VisitaCard } from './VisitaCard';

interface VisitasKanbanProps {
  visitas: VisitaComRelacionamentos[];
  onUpdate: () => void;
}

const KanbanColumn = ({
  title,
  visitas,
  onUpdate
}: {
  title: 'Agendada' | 'Em Andamento' | 'Concluída';
  visitas: VisitaComRelacionamentos[];
  onUpdate: () => void;
}) => (
  <section className="min-w-0 rounded-2xl border border-black/5 bg-black/5 p-3 dark:border-white/5 dark:bg-white/5 lg:w-80 lg:flex-shrink-0">
    <header className="mb-4 flex items-center justify-between px-1">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-900 dark:text-gray-300">
        {visitas.length}
      </span>
    </header>

    <div className="space-y-4">
      {visitas.length > 0 ? (
        visitas.map((visita) => <VisitaCard key={visita.id} visita={visita} onUpdate={onUpdate} />)
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700">
          Nenhuma visita nesta etapa.
        </div>
      )}
    </div>
  </section>
);

export function VisitasKanban({ visitas, onUpdate }: VisitasKanbanProps) {
  const agendadas = visitas.filter((visita) => visita.status === 'Agendada');
  const emAndamento = visitas.filter((visita) => visita.status === 'Em Andamento');
  const concluidas = visitas.filter((visita) => visita.status === 'Concluída');

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:overflow-x-auto lg:pb-4">
      <KanbanColumn title="Agendada" visitas={agendadas} onUpdate={onUpdate} />
      <KanbanColumn title="Em Andamento" visitas={emAndamento} onUpdate={onUpdate} />
      <KanbanColumn title="Concluída" visitas={concluidas} onUpdate={onUpdate} />
    </div>
  );
}
