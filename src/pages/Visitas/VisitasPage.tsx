import { useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, KanbanSquare, MapPinned, Plus, Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';
import { useClientes, usePerfis, useVisitas } from '../../hooks/useLumiBiz';
import { VisitasAgenda } from './VisitasAgenda';
import { VisitasKanban } from './VisitasKanban';

type StatusFilter = 'Todas' | 'Agendada' | 'Em Andamento' | 'Concluida';
type ViewMode = 'kanban' | 'agenda';

const LoadingSpinner = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand-orange/25 border-t-brand-blue" />
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="surface-panel px-5 py-4 text-rose-600 dark:text-rose-300">{message}</div>
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
      const normalizedStatus = visita.status === 'Concluída' ? 'Concluida' : visita.status;
      const matchStatus = statusFilter === 'Todas' || normalizedStatus === statusFilter;
      const search = searchTerm.toLowerCase();
      const matchSearch = !search || visita.clientes?.nome?.toLowerCase().includes(search) || visita.perfis?.nome?.toLowerCase().includes(search);

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
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-brand-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue dark:text-blue-200">
            <MapPinned size={14} />
            Campo e agenda
          </span>
          <h2 className="section-title mt-4">Gestao de visitas</h2>
          <p className="section-copy">Agenda, kanban e operacao em campo com check-in e check-out via geolocalizacao.</p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 sm:w-auto">
          <Metric label="Filtradas" value={String(resumo.total)} tone="info" />
          <Metric label="Hoje" value={String(resumo.hoje)} tone="amber" />
          <Metric label="Em andamento" value={String(resumo.andamento)} tone="success" />
        </div>
      </section>

      <section className="surface-panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <label className="relative">
              <Search className="absolute left-3 top-3.5 text-app-muted" size={18} />
              <input
                type="text"
                placeholder="Buscar por cliente ou usuario"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {(['Todas', 'Agendada', 'Em Andamento', 'Concluida'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    statusFilter === status ? 'bg-gradient-to-r from-brand-orange to-brand-orange-deep text-white shadow-soft' : 'bg-surface-muted text-app-secondary hover:text-app-primary'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-2xl bg-surface-muted p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${
                  viewMode === 'kanban' ? 'bg-brand-blue text-white shadow-glow' : 'text-app-secondary'
                }`}
              >
                <KanbanSquare size={16} />
                Kanban
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${
                  viewMode === 'agenda' ? 'bg-brand-orange text-white shadow-soft' : 'text-app-secondary'
                }`}
              >
                <CalendarDays size={16} />
                Agenda
              </button>
            </div>

            <button onClick={() => setIsSheetOpen(true)} className="btn-primary">
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
        <div className="fixed inset-0 z-40 flex items-end bg-slate-950/55 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="surface-panel h-[92vh] w-full rounded-t-[28px] p-5 sm:h-auto sm:max-w-xl sm:rounded-[28px] sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-app-primary">Nova visita</h2>
                <p className="mt-1 text-sm text-app-secondary">Agende visitas com foco em uso mobile e execucao em campo.</p>
              </div>
              <button onClick={() => setIsSheetOpen(false)} className="btn-ghost h-10 w-10 rounded-2xl px-0" aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Cliente">
                <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="input-field">
                  <option value="">Selecione um cliente</option>
                  {(clientes || []).map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Usuario responsavel">
                <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} className="input-field">
                  <option value="">Eu mesmo</option>
                  {(perfis || []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome || item.email || item.id}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Data">
                  <input type="date" value={dataVisita} onChange={(e) => setDataVisita(e.target.value)} min={new Date().toISOString().slice(0, 10)} className="input-field" />
                </Field>
                <Field label="Horario inicial">
                  <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="input-field" />
                </Field>
              </div>

              <div className="surface-subtle p-4 text-sm text-app-secondary">
                Check-in e check-out continuam usando a geolocalizacao nativa do navegador quando a visita entrar em execucao.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button onClick={() => setIsSheetOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button onClick={criarVisita} disabled={saving} className="btn-primary">
                  {saving ? 'Salvando...' : 'Salvar visita'}
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-border-subtle p-4 text-sm text-app-secondary">
              Proxima data sugerida: {formatDate(dataVisita)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: 'info' | 'amber' | 'success' }) {
  const toneMap = {
    info: 'bg-brand-blue/12 text-brand-blue dark:text-blue-200',
    amber: 'bg-brand-orange/12 text-brand-orange dark:text-orange-200',
    success: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300'
  };

  return (
    <div className="surface-subtle p-4">
      <p className="text-sm text-app-secondary">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneMap[tone]}`}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-app-primary">{label}</span>
      {children}
    </label>
  );
}
