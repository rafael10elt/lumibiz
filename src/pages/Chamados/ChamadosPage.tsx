import { useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Headphones, Plus, Siren } from 'lucide-react';
import { useChamados } from '../../hooks/useLumiBiz';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function ChamadosPage() {
  const queryClient = useQueryClient();
  const { perfil } = useAuth();
  const { data, isLoading, isError, error } = useChamados();
  const [titulo, setTitulo] = useState('');
  const [prioridade, setPrioridade] = useState<'baixa' | 'media' | 'alta'>('media');
  const [statusNovo, setStatusNovo] = useState<'aberto' | 'em_andamento' | 'resolvido'>('aberto');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'aberto' | 'em_andamento' | 'resolvido'>('todos');
  const [saving, setSaving] = useState(false);
  const canManage = ['super_admin', 'admin', 'gestor'].includes(perfil?.role || '');

  const rows = useMemo(() => (data || []).filter((item) => statusFiltro === 'todos' || item.status === statusFiltro), [data, statusFiltro]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['chamados'] });
  };

  const criarChamado = async () => {
    if (!perfil?.tenant_id || !perfil?.id || !titulo.trim()) {
      alert('Preencha os campos obrigatorios e confirme seu perfil.');
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase.from('chamados').insert({
      tenant_id: perfil.tenant_id,
      usuario_id: perfil.id,
      titulo: titulo.trim(),
      prioridade,
      status: statusNovo
    } as never);
    setSaving(false);
    if (insertError) {
      alert(`Erro ao criar chamado: ${insertError.message}`);
      return;
    }
    setTitulo('');
    setPrioridade('media');
    setStatusNovo('aberto');
    await refresh();
  };

  const atualizarStatus = async (id: string, status: 'aberto' | 'em_andamento' | 'resolvido') => {
    const { error: updateError } = await supabase.from('chamados').update({ status } as never).eq('id', id);
    if (updateError) {
      alert(`Erro ao atualizar status: ${updateError.message}`);
      return;
    }
    await refresh();
  };

  const excluirChamado = async (id: string) => {
    if (!confirm('Deseja excluir este chamado?')) return;

    const { error: deleteError } = await supabase.from('chamados').delete().eq('id', id);
    if (deleteError) {
      alert(`Erro ao excluir chamado: ${deleteError.message}`);
      return;
    }
    await refresh();
  };

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-brand-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue dark:text-blue-200">
            <Headphones size={14} />
            Atendimento e suporte
          </span>
          <h2 className="section-title mt-4">Chamados</h2>
          <p className="section-copy">Controle de chamados operacionais com prioridade, andamento e resolucao.</p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 sm:w-auto">
          <Metric title="Total" value={String(rows.length)} icon={<Headphones size={18} />} tone="info" />
          <Metric title="Abertos" value={String(rows.filter((item) => item.status === 'aberto').length)} icon={<AlertCircle size={18} />} tone="amber" />
          <Metric title="Alta prioridade" value={String(rows.filter((item) => item.prioridade === 'alta').length)} icon={<Siren size={18} />} tone="danger" />
        </div>
      </section>

      <section className="surface-panel p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr_1fr_auto]">
          <Field label="Titulo do chamado">
            <input type="text" placeholder="Titulo do chamado" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="input-field" />
          </Field>
          <Field label="Prioridade">
            <select value={prioridade} onChange={(e) => setPrioridade(e.target.value as typeof prioridade)} className="input-field">
              <option value="baixa">baixa</option>
              <option value="media">media</option>
              <option value="alta">alta</option>
            </select>
          </Field>
          <Field label="Status inicial">
            <select value={statusNovo} onChange={(e) => setStatusNovo(e.target.value as typeof statusNovo)} className="input-field">
              <option value="aberto">aberto</option>
              <option value="em_andamento">em_andamento</option>
              <option value="resolvido">resolvido</option>
            </select>
          </Field>
          <div className="flex items-end">
            <button onClick={criarChamado} disabled={saving} className="btn-primary w-full">
              <Plus size={18} />
              {saving ? 'Salvando...' : 'Novo chamado'}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(['todos', 'aberto', 'em_andamento', 'resolvido'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFiltro(status)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                statusFiltro === status ? 'bg-gradient-to-r from-brand-blue to-brand-orange text-white shadow-glow' : 'bg-surface-muted text-app-secondary hover:text-app-primary'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </section>

      {isLoading && <div className="surface-panel p-6 text-app-secondary">Carregando chamados...</div>}
      {isError && <div className="surface-panel p-6 text-rose-600 dark:text-rose-300">Erro ao carregar chamados: {error?.message}</div>}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {rows.map((item) => (
            <article key={item.id} className="surface-panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-app-primary">{item.titulo}</h3>
                  <p className="mt-1 text-sm text-app-secondary">Criado em {new Date(item.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <StatusPill status={item.status || '-'} />
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                  item.prioridade === 'alta'
                    ? 'bg-rose-500/12 text-rose-600 dark:text-rose-300'
                    : item.prioridade === 'media'
                      ? 'bg-brand-orange/12 text-brand-orange dark:text-orange-200'
                      : 'bg-brand-blue/12 text-brand-blue dark:text-blue-200'
                }`}>
                  Prioridade {item.prioridade || '-'}
                </span>
              </div>

              {canManage && (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <select value={item.status || 'aberto'} onChange={(e) => atualizarStatus(item.id, e.target.value as 'aberto' | 'em_andamento' | 'resolvido')} className="input-field">
                    <option value="aberto">aberto</option>
                    <option value="em_andamento">em_andamento</option>
                    <option value="resolvido">resolvido</option>
                  </select>
                  <button onClick={() => excluirChamado(item.id)} className="btn-ghost rounded-2xl border border-border-subtle px-4 text-rose-600 hover:bg-rose-500/10 dark:text-rose-300">
                    Excluir
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
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
    status === 'resolvido'
      ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300'
      : status === 'em_andamento'
        ? 'bg-brand-orange/12 text-brand-orange dark:text-orange-200'
        : 'bg-brand-blue/12 text-brand-blue dark:text-blue-200';

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}>{status}</span>;
}
