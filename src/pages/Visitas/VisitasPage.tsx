import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, KanbanSquare, Plus, Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';
import { useClientes, usePerfis, useVisitas } from '../../hooks/useLumiBiz';
import { VisitasAgenda } from './VisitasAgenda';
import { VisitasKanban } from './VisitasKanban';

type StatusFilter = 'Todas' | 'Agendada' | 'Em Andamento' | 'Concluída';
type ViewMode = 'kanban' | 'agenda';

const LoadingSpinner = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-brand-gold" />
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700">{message}</div>
);

export function VisitasPage() {
  const queryClient = useQueryClient();
  const { perfil } = useAuth();
  const { data: visitas, isLoading, isError, error } = useVisitas();
  const { data: clientes } = useClientes();
  const { data: perfis } = usePerfis();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todas');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [dataVisita, setDataVisita] = useState(new Date().toISOString().slice(0, 10));
  const [horaInicio, setHoraInicio] = useState('');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['visitas'] });
  };

  const visitasFiltradas = useMemo(() => {
    if (!visitas) return [];

    return visitas.filter((visita) => {
      const matchStatus = statusFilter === 'Todas' || visita.status === statusFilter;
      const search = searchTerm.toLowerCase();
      const matchSearch =
        !search ||
        visita.clientes?.nome?.toLowerCase().includes(search) ||
        visita.perfis?.nome?.toLowerCase().includes(search);

      return matchStatus && matchSearch;
    });
  }, [visitas, searchTerm, statusFilter]);

  const resumo = useMemo(() => {
    const total = visitasFiltradas.length;
    const hoje = new Date().toISOString().slice(0, 10);

    return {
      total,
      hoje: visitasFiltradas.filter((visita) => visita.data_visita === hoje).length,
      andamento: visitasFiltradas.filter((visita) => visita.status === 'Em Andamento').length
    };
  }, [visitasFiltradas]);

  const criarVisita = async () => {
    if (!perfil?.tenant_id || !clienteId || !dataVisita) {
      alert('Preencha cliente e data da visita.');
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase.from('visitas').insert({
      tenant_id: perfil.tenant_id,
      cliente_id: clienteId,
      usuario_id: usuarioId || perfil.id,
      data_visita: dataVisita,
      hora_inicio: horaInicio || null,
      status: 'Agendada'
    } as never);

    setSaving(false);

    if (insertError) {
      alert(`Erro ao criar visita: ${insertError.message}`);
      return;
    }

    setClienteId('');
    setUsuarioId('');
    setHoraInicio('');
    setIsSheetOpen(false);
    await handleUpdate();
  };

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-brand-dark p-4 text-white shadow-lg">
          <p className="text-sm text-white/70">Visitas filtradas</p>
          <p className="mt-2 text-3xl font-semibold">{resumo.total}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Agenda de hoje</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{resumo.hoje}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Em andamento</p>
          <p className="mt-2 text-3xl font-semibold text-brand-gold">{resumo.andamento}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por cliente ou usuario"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 outline-none ring-0 focus:border-brand-gold dark:border-gray-700 dark:bg-gray-900"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {(['Todas', 'Agendada', 'Em Andamento', 'Concluída'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium ${
                    statusFilter === status
                      ? 'bg-brand-gold text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-700">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  viewMode === 'kanban' ? 'bg-brand-dark text-white' : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                <KanbanSquare size={16} />
                Kanban
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  viewMode === 'agenda' ? 'bg-brand-dark text-white' : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                <CalendarDays size={16} />
                Agenda
              </button>
            </div>

            <button
              onClick={() => setIsSheetOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-dark px-4 py-2.5 font-medium text-white transition-colors hover:bg-brand-gold"
            >
              <Plus size={18} />
              Nova visita
            </button>
          </div>
        </div>
      </section>

      <section>
        {isLoading && <LoadingSpinner />}
        {isError && <ErrorMessage message={error.message} />}
        {!isLoading && !isError && viewMode === 'kanban' && <VisitasKanban visitas={visitasFiltradas} onUpdate={handleUpdate} />}
        {!isLoading && !isError && viewMode === 'agenda' && <VisitasAgenda visitas={visitasFiltradas} />}
      </section>

      {isSheetOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/50 sm:items-center sm:justify-center">
          <div className="h-[92vh] w-full rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-gray-900 sm:h-auto sm:max-w-xl sm:rounded-3xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Nova visita</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Agende visitas com foco em uso mobile e check-in em campo.</p>
              </div>
              <button
                onClick={() => setIsSheetOpen(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Cliente</span>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="">Selecione um cliente</option>
                  {(clientes || []).map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Usuario responsavel</span>
                <select
                  value={usuarioId}
                  onChange={(e) => setUsuarioId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="">Eu mesmo</option>
                  {(perfis || []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome || item.email || item.id}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Data</span>
                  <input
                    type="date"
                    value={dataVisita}
                    onChange={(e) => setDataVisita(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Horario inicial</span>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800"
                  />
                </label>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                Check-in e check-out continuam usando a geolocalizacao nativa do navegador quando a visita entrar em execucao.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setIsSheetOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-3 font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={criarVisita}
                  disabled={saving}
                  className="rounded-xl bg-brand-dark px-4 py-3 font-medium text-white transition-colors hover:bg-brand-gold disabled:opacity-60"
                >
                  {saving ? 'Salvando...' : 'Salvar visita'}
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Proxima data sugerida: {formatDate(dataVisita)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
