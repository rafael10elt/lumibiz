import { useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BanknoteArrowUp, CircleDollarSign, Plus, ReceiptText, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useReembolsos } from '../../hooks/useLumiBiz';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';

export function ReembolsosPage() {
  const queryClient = useQueryClient();
  const { perfil } = useAuth();
  const { data, isLoading, isError, error } = useReembolsos();
  const [valor, setValor] = useState('');
  const [motivo, setMotivo] = useState('');
  const [dataSolicitacao, setDataSolicitacao] = useState(new Date().toISOString().slice(0, 10));
  const [statusNovo, setStatusNovo] = useState<'solicitado' | 'aprovado' | 'pago' | 'recusado'>('solicitado');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'solicitado' | 'aprovado' | 'pago' | 'recusado'>('todos');
  const [saving, setSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const canManage = ['super_admin', 'admin', 'gestor'].includes(perfil?.role || '');

  const rows = useMemo(() => (data || []).filter((item) => statusFiltro === 'todos' || item.status === statusFiltro), [data, statusFiltro]);
  const totalSolicitado = rows.reduce((sum, item) => sum + Number(item.valor || 0), 0);

  const refreshReembolsos = async () => {
    await queryClient.invalidateQueries({ queryKey: ['reembolsos'] });
  };

  const criarReembolso = async () => {
    if (!perfil?.tenant_id || !perfil?.id || !valor) {
      alert('Preencha os campos obrigatorios e confirme seu perfil.');
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase.from('reembolsos').insert({
      tenant_id: perfil.tenant_id,
      usuario_id: perfil.id,
      data_solicitacao: dataSolicitacao,
      valor: Number(valor),
      status: statusNovo,
      motivo: motivo.trim() || null
    } as never);
    setSaving(false);

    if (insertError) {
      alert(`Erro ao criar reembolso: ${insertError.message}`);
      return;
    }

    setValor('');
    setMotivo('');
    setStatusNovo('solicitado');
    await refreshReembolsos();
  };

  const atualizarStatus = async (id: string, status: 'solicitado' | 'aprovado' | 'pago' | 'recusado') => {
    const { error: updateError } = await supabase.from('reembolsos').update({ status } as never).eq('id', id);

    if (updateError) {
      alert(`Erro ao atualizar status: ${updateError.message}`);
      return;
    }
    await refreshReembolsos();
  };

  const excluirReembolso = async (id: string) => {
    const { error: deleteError } = await supabase.from('reembolsos').delete().eq('id', id);
    if (deleteError) {
      alert(`Erro ao excluir reembolso: ${deleteError.message}`);
      return;
    }
    await refreshReembolsos();
  };

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-orange/15 bg-brand-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-orange dark:text-orange-200">
            <ReceiptText size={14} />
            Despesas e devolucoes
          </span>
          <h2 className="section-title mt-4">Reembolsos</h2>
          <p className="section-copy">Solicitacoes, aprovacoes e historico de reembolsos com leitura mais clara e operacional.</p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 sm:w-auto">
          <Metric title="Registros" value={String(rows.length)} icon={<ReceiptText size={18} />} tone="info" />
          <Metric title="Total" value={formatCurrency(totalSolicitado)} icon={<CircleDollarSign size={18} />} tone="amber" />
          <Metric title="Pagos" value={String(rows.filter((item) => item.status === 'pago').length)} icon={<BanknoteArrowUp size={18} />} tone="success" />
        </div>
      </section>

      <section className="surface-panel p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_1fr_1.2fr_auto]">
          <Field label="Data">
            <input type="date" value={dataSolicitacao} onChange={(e) => setDataSolicitacao(e.target.value)} className="input-field" />
          </Field>
          <Field label="Valor">
            <input type="number" min="0" step="0.01" placeholder="Valor" value={valor} onChange={(e) => setValor(e.target.value)} className="input-field" />
          </Field>
          <Field label="Status inicial">
            <select value={statusNovo} onChange={(e) => setStatusNovo(e.target.value as typeof statusNovo)} className="input-field">
              <option value="solicitado">Solicitado</option>
              <option value="aprovado">Aprovado</option>
              <option value="pago">Pago</option>
              <option value="recusado">Recusado</option>
            </select>
          </Field>
          <Field label="Motivo">
            <input type="text" placeholder="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="input-field" />
          </Field>
          <div className="flex items-end">
            <button onClick={criarReembolso} disabled={saving} className="btn-primary w-full">
              <Plus size={18} />
              {saving ? 'Salvando...' : 'Novo reembolso'}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(['todos', 'solicitado', 'aprovado', 'pago', 'recusado'] as const).map((status) => (
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

      {isLoading && <div className="surface-panel p-6 text-app-secondary">Carregando reembolsos...</div>}
      {isError && <div className="surface-panel p-6 text-rose-600 dark:text-rose-300">Erro ao carregar reembolsos: {error?.message}</div>}

      {!isLoading && !isError && (
        <>
          <section className="hidden md:block">
            <div className="surface-panel overflow-x-auto p-2">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-app-muted">
                    <th className="px-4 py-4 font-medium">Data</th>
                    <th className="px-4 py-4 font-medium">Valor</th>
                    <th className="px-4 py-4 font-medium">Status</th>
                    <th className="px-4 py-4 font-medium">Motivo</th>
                    {canManage && <th className="px-4 py-4 font-medium text-right">Acoes</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id} className="border-t border-border-subtle">
                      <td className="px-4 py-4 text-app-primary">{new Date(item.data_solicitacao).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-4 font-semibold text-brand-blue">{formatCurrency(Number(item.valor || 0))}</td>
                      <td className="px-4 py-4">
                        {canManage ? (
                          <select value={item.status || 'solicitado'} onChange={(e) => atualizarStatus(item.id, e.target.value as 'solicitado' | 'aprovado' | 'pago' | 'recusado')} className="input-field h-10 py-0">
                            <option value="solicitado">solicitado</option>
                            <option value="aprovado">aprovado</option>
                            <option value="pago">pago</option>
                            <option value="recusado">recusado</option>
                          </select>
                        ) : (
                          <StatusPill status={item.status || '-'} />
                        )}
                      </td>
                      <td className="px-4 py-4 text-app-secondary">{item.motivo || '-'}</td>
                      {canManage && (
                        <td className="px-4 py-4 text-right">
                          <button onClick={() => setPendingDeleteId(item.id)} className="btn-ghost h-10 rounded-2xl border border-border-subtle px-3 text-rose-600 hover:bg-rose-500/10 dark:text-rose-300">
                            <Trash2 size={16} />
                            Excluir
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:hidden">
            {rows.map((item) => (
              <article key={item.id} className="surface-panel p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-app-primary">{formatCurrency(Number(item.valor || 0))}</p>
                    <p className="mt-1 text-sm text-app-secondary">{new Date(item.data_solicitacao).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <StatusPill status={item.status || '-'} />
                </div>
                <p className="mt-4 text-sm text-app-secondary">{item.motivo || 'Sem motivo informado.'}</p>
              </article>
            ))}
          </section>
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Excluir reembolso"
        description="Deseja excluir este reembolso?"
        confirmText="Excluir"
        confirmVariant="danger"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          const id = pendingDeleteId;
          setPendingDeleteId(null);
          if (id) void excluirReembolso(id);
        }}
      />
    </div>
  );
}

function Metric({ title, value, icon, tone }: { title: string; value: string; icon: ReactNode; tone: 'info' | 'amber' | 'success' }) {
  const toneMap = {
    info: 'bg-brand-blue/12 text-brand-blue dark:text-blue-200',
    amber: 'bg-brand-orange/12 text-brand-orange dark:text-orange-200',
    success: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300'
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
  const normalized = status.toLowerCase();
  const tone =
    normalized === 'pago'
      ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300'
      : normalized === 'recusado'
        ? 'bg-rose-500/12 text-rose-600 dark:text-rose-300'
        : normalized === 'aprovado'
          ? 'bg-brand-blue/12 text-brand-blue dark:text-blue-200'
          : 'bg-brand-orange/12 text-brand-orange dark:text-orange-200';

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}>{status}</span>;
}
