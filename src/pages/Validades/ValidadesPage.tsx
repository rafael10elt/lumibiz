import { useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarClock, Plus, ShieldAlert } from 'lucide-react';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useValidades } from '../../hooks/useLumiBiz';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function ValidadesPage() {
  const queryClient = useQueryClient();
  const { perfil } = useAuth();
  const { data, isLoading, isError, error } = useValidades();
  const [titulo, setTitulo] = useState('');
  const [dataValidade, setDataValidade] = useState(new Date().toISOString().slice(0, 10));
  const [statusNovo, setStatusNovo] = useState<'pendente' | 'em_dia' | 'vencido'>('pendente');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'pendente' | 'em_dia' | 'vencido'>('todos');
  const [saving, setSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const canManage = ['super_admin', 'admin', 'gestor'].includes(perfil?.role || '');

  const rows = useMemo(() => (data || []).filter((item) => statusFiltro === 'todos' || item.status === statusFiltro), [data, statusFiltro]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['validades'] });
  };

  const criarValidade = async () => {
    if (!perfil?.tenant_id || !titulo.trim() || !dataValidade) {
      alert('Preencha os campos obrigatorios.');
      return;
    }

    setSaving(true);
    const { error: insertError } = await supabase.from('validades').insert({
      tenant_id: perfil.tenant_id,
      titulo: titulo.trim(),
      data_validade: dataValidade,
      status: statusNovo
    } as never);
    setSaving(false);

    if (insertError) {
      alert(`Erro ao criar validade: ${insertError.message}`);
      return;
    }

    setTitulo('');
    setStatusNovo('pendente');
    await refresh();
  };

  const atualizarStatus = async (id: string, status: 'pendente' | 'em_dia' | 'vencido') => {
    const { error: updateError } = await supabase.from('validades').update({ status } as never).eq('id', id);
    if (updateError) {
      alert(`Erro ao atualizar status: ${updateError.message}`);
      return;
    }
    await refresh();
  };

  const excluirValidade = async (id: string) => {
    const { error: deleteError } = await supabase.from('validades').delete().eq('id', id);
    if (deleteError) {
      alert(`Erro ao excluir validade: ${deleteError.message}`);
      return;
    }
    await refresh();
  };

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-orange/15 bg-brand-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-orange dark:text-orange-200">
            <ShieldAlert size={14} />
            Controle preventivo
          </span>
          <h2 className="section-title mt-4">Validades</h2>
          <p className="section-copy">Acompanhe prazos, vencimentos e itens que exigem renovacao ou conferencias periodicas.</p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 sm:w-auto">
          <Metric title="Itens" value={String(rows.length)} icon={<CalendarClock size={18} />} tone="info" />
          <Metric title="Pendentes" value={String(rows.filter((item) => item.status === 'pendente').length)} icon={<AlertTriangle size={18} />} tone="amber" />
          <Metric title="Vencidos" value={String(rows.filter((item) => item.status === 'vencido').length)} icon={<ShieldAlert size={18} />} tone="danger" />
        </div>
      </section>

      <section className="surface-panel p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr_1fr_auto]">
          <Field label="Titulo">
            <input type="text" placeholder="Titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="input-field" />
          </Field>
          <Field label="Data de validade">
            <input type="date" value={dataValidade} onChange={(e) => setDataValidade(e.target.value)} className="input-field" />
          </Field>
          <Field label="Status inicial">
            <select value={statusNovo} onChange={(e) => setStatusNovo(e.target.value as typeof statusNovo)} className="input-field">
              <option value="pendente">pendente</option>
              <option value="em_dia">em_dia</option>
              <option value="vencido">vencido</option>
            </select>
          </Field>
          <div className="flex items-end">
            <button onClick={criarValidade} disabled={saving} className="btn-primary w-full">
              <Plus size={18} />
              {saving ? 'Salvando...' : 'Nova validade'}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(['todos', 'pendente', 'em_dia', 'vencido'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFiltro(status)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                statusFiltro === status ? 'bg-gradient-to-r from-brand-blue to-brand-blue-deep text-white shadow-glow' : 'bg-surface-muted text-app-secondary hover:text-app-primary'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </section>

      {isLoading && <div className="surface-panel p-6 text-app-secondary">Carregando validades...</div>}
      {isError && <div className="surface-panel p-6 text-rose-600 dark:text-rose-300">Erro ao carregar validades: {error?.message}</div>}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {rows.map((item) => (
            <article key={item.id} className="surface-panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-app-primary">{item.titulo}</h3>
                  <p className="mt-1 text-sm text-app-secondary">Validade: {new Date(item.data_validade).toLocaleDateString('pt-BR')}</p>
                </div>
                <StatusPill status={item.status || '-'} />
              </div>

              {canManage && (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <select value={item.status || 'pendente'} onChange={(e) => atualizarStatus(item.id, e.target.value as 'pendente' | 'em_dia' | 'vencido')} className="input-field">
                    <option value="pendente">pendente</option>
                    <option value="em_dia">em_dia</option>
                    <option value="vencido">vencido</option>
                  </select>
                  <button onClick={() => setPendingDeleteId(item.id)} className="btn-ghost rounded-2xl border border-border-subtle px-4 text-rose-600 hover:bg-rose-500/10 dark:text-rose-300">
                    Excluir
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Excluir validade"
        description="Deseja excluir esta validade?"
        confirmText="Excluir"
        confirmVariant="danger"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          const id = pendingDeleteId;
          setPendingDeleteId(null);
          if (id) void excluirValidade(id);
        }}
      />
    </div>
  );
}

function Metric({ title, value, icon, tone }: { title: string; value: string; icon: ReactNode; tone: 'info' | 'amber' | 'danger' }) {
  const toneMap = {
    info: 'bg-brand-blue/12 text-brand-blue dark:text-blue-200',
    amber: 'bg-brand-orange/12 text-brand-orange dark:text-orange-200',
    danger: 'bg-rose-500/12 text-rose-600 dark:text-rose-300'
  };

  return (
    <div className="surface-subtle p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-app-secondary">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-app-primary">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneMap[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-app-primary">{label}</label>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'em_dia'
      ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300'
      : status === 'vencido'
        ? 'bg-rose-500/12 text-rose-600 dark:text-rose-300'
        : 'bg-brand-orange/12 text-brand-orange dark:text-orange-200';

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}>{status}</span>;
}
