import { useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDownCircle, ArrowUpCircle, Landmark, Plus, Trash2, Wallet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useClientes, useCustos, useReceitas } from '../../hooks/useLumiBiz';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';

type FinanceiroTab = 'receitas' | 'custos';

export function FinanceiroPage() {
  const queryClient = useQueryClient();
  const { perfil } = useAuth();
  const { data: clientes } = useClientes();
  const { data: receitas } = useReceitas();
  const { data: custos } = useCustos();
  const [tab, setTab] = useState<FinanceiroTab>('receitas');
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [clienteFiltro, setClienteFiltro] = useState('');
  const [credorFiltro, setCredorFiltro] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataLancamento, setDataLancamento] = useState('');
  const [valor, setValor] = useState('');
  const [statusNovo, setStatusNovo] = useState<'Pendente' | 'Pago'>('Pendente');
  const [observacao, setObservacao] = useState('');
  const [saving, setSaving] = useState(false);

  const receitasFiltradas = useMemo(
    () =>
      (receitas || []).filter((item) => {
        const okStart = !startDate || item.data_lancamento >= startDate;
        const okEnd = !endDate || item.data_lancamento <= endDate;
        const okCliente = !clienteFiltro || item.cliente_id === clienteFiltro;
        const okStatus = !statusFiltro || String(item.status).toLowerCase() === statusFiltro.toLowerCase();
        return okStart && okEnd && okCliente && okStatus;
      }),
    [receitas, startDate, endDate, clienteFiltro, statusFiltro]
  );

  const custosFiltrados = useMemo(
    () =>
      (custos || []).filter((item) => {
        const okStart = !startDate || item.data_lancamento >= startDate;
        const okEnd = !endDate || item.data_lancamento <= endDate;
        const okCredor = !credorFiltro || item.descricao.toLowerCase().includes(credorFiltro.toLowerCase());
        const okStatus = !statusFiltro || String(item.status).toLowerCase() === statusFiltro.toLowerCase();
        return okStart && okEnd && okCredor && okStatus;
      }),
    [custos, startDate, endDate, credorFiltro, statusFiltro]
  );

  const totais = useMemo(() => {
    const totalReceitas = receitasFiltradas.reduce((sum, item) => sum + Number(item.valor || 0), 0);
    const totalCustos = custosFiltrados.reduce((sum, item) => sum + Number(item.valor || 0), 0);
    return { totalReceitas, totalCustos, saldo: totalReceitas - totalCustos };
  }, [receitasFiltradas, custosFiltrados]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['receitas'] }),
      queryClient.invalidateQueries({ queryKey: ['custos'] })
    ]);
  };

  const resetForm = () => {
    setClienteId('');
    setDescricao('');
    setDataLancamento('');
    setValor('');
    setStatusNovo('Pendente');
    setObservacao('');
  };

  const saveLancamento = async () => {
    if (!perfil?.tenant_id || !perfil.id || !descricao.trim() || !valor || !dataLancamento) {
      alert('Preencha os campos obrigatorios.');
      return;
    }

    setSaving(true);
    const payload = {
      tenant_id: perfil.tenant_id,
      usuario_id: perfil.id,
      descricao: descricao.trim(),
      valor: Number(valor),
      data_lancamento: dataLancamento,
      status: statusNovo,
      categoria: observacao.trim() || null
    };

    const result =
      tab === 'receitas'
        ? await supabase.from('receitas').insert({ ...payload, cliente_id: clienteId || null } as never)
        : await supabase.from('custos').insert(payload as never);

    setSaving(false);

    if (result.error) {
      alert(`Erro ao salvar ${tab === 'receitas' ? 'receita' : 'custo'}: ${result.error.message}`);
      return;
    }

    resetForm();
    setShowForm(false);
    await refresh();
  };

  const deleteLancamento = async (id: string) => {
    if (!confirm('Deseja excluir este lancamento?')) return;
    const result = tab === 'receitas' ? await supabase.from('receitas').delete().eq('id', id) : await supabase.from('custos').delete().eq('id', id);

    if (result.error) {
      alert(`Erro ao excluir lancamento: ${result.error.message}`);
      return;
    }

    await refresh();
  };

  const rows = tab === 'receitas' ? receitasFiltradas : custosFiltrados;

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-orange/15 bg-brand-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-orange dark:text-orange-200">
            <Landmark size={14} />
            Financeiro
          </span>
          <h2 className="section-title mt-4">Receitas e custos do tenant</h2>
          <p className="section-copy">Lancamentos, filtros e visao consolidada com uma leitura mais rapida no claro e no escuro.</p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 sm:w-auto">
          <Metric title="Receitas" value={formatCurrency(totais.totalReceitas)} icon={<ArrowUpCircle size={18} />} tone="info" />
          <Metric title="Custos" value={formatCurrency(totais.totalCustos)} icon={<ArrowDownCircle size={18} />} tone="danger" />
          <Metric title="Saldo" value={formatCurrency(totais.saldo)} icon={<Wallet size={18} />} tone="success" />
        </div>
      </section>

      <section className="surface-panel p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTab('receitas')}
            className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === 'receitas' ? 'bg-gradient-to-r from-brand-blue to-brand-blue-deep text-white shadow-glow' : 'bg-surface-muted text-app-secondary hover:text-app-primary'
            }`}
          >
            Receitas
          </button>
          <button
            onClick={() => setTab('custos')}
            className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === 'custos' ? 'bg-gradient-to-r from-brand-orange to-brand-orange-deep text-white shadow-soft' : 'bg-surface-muted text-app-secondary hover:text-app-primary'
            }`}
          >
            Custos
          </button>
        </div>
      </section>

      <section className="surface-panel p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <Field label="Venc. de">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
          </Field>
          <Field label="Venc. ate">
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
          </Field>
          {tab === 'receitas' ? (
            <Field label="Cliente">
              <select value={clienteFiltro} onChange={(e) => setClienteFiltro(e.target.value)} className="input-field">
                <option value="">Todos</option>
                {(clientes || []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Credor">
              <input value={credorFiltro} onChange={(e) => setCredorFiltro(e.target.value)} className="input-field" placeholder="Buscar por credor" />
            </Field>
          )}
          <Field label="Status">
            <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className="input-field">
              <option value="">Todos</option>
              <option value="Pendente">Pendente</option>
              <option value="Pago">Pago</option>
              <option value="aprovado">Aprovado</option>
              <option value="lancado">Lancado</option>
            </select>
          </Field>
          <div className="flex items-end">
            <button onClick={() => setShowForm((current) => !current)} className="btn-primary w-full">
              <Plus size={18} />
              {showForm ? 'Fechar formulario' : `Novo ${tab === 'receitas' ? 'receita' : 'custo'}`}
            </button>
          </div>
        </div>
      </section>

      {showForm && (
        <section className="surface-panel p-6 sm:p-7">
          <h3 className="text-2xl font-semibold tracking-tight text-app-primary">{tab === 'receitas' ? 'Lancar nova receita' : 'Lancar novo custo'}</h3>
          <p className="mt-1 text-sm text-app-secondary">Formulario rapido para o dia a dia operacional.</p>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            {tab === 'receitas' && (
              <Field label="Cliente">
                <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="input-field">
                  <option value="">Selecione...</option>
                  {(clientes || []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label={tab === 'receitas' ? 'Descricao / observacao curta' : 'Credor / fornecedor'}>
              <input value={descricao} onChange={(e) => setDescricao(e.target.value)} className="input-field" />
            </Field>
            <Field label="Data de vencimento">
              <input type="date" value={dataLancamento} onChange={(e) => setDataLancamento(e.target.value)} className="input-field" />
            </Field>
            <Field label="Valor">
              <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className="input-field" />
            </Field>
            <Field label="Status">
              <select value={statusNovo} onChange={(e) => setStatusNovo(e.target.value as 'Pendente' | 'Pago')} className="input-field">
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
              </select>
            </Field>
            <Field label="Observacao" className="md:col-span-2">
              <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={4} className="textarea-field" />
            </Field>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button onClick={() => setShowForm(false)} className="btn-secondary">
              Cancelar
            </button>
            <button onClick={saveLancamento} disabled={saving} className="btn-primary">
              {saving ? 'Salvando...' : 'Salvar lancamento'}
            </button>
          </div>
        </section>
      )}

      <section className="hidden overflow-hidden md:block">
        <div className="surface-panel overflow-x-auto p-2">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-app-muted">
                <th className="px-4 py-4 font-medium">{tab === 'receitas' ? 'Cliente' : 'Credor'}</th>
                <th className="px-4 py-4 font-medium">Vencimento</th>
                <th className="px-4 py-4 font-medium">Valor</th>
                <th className="px-4 py-4 font-medium">Status</th>
                <th className="px-4 py-4 font-medium text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-app-secondary">
                    Nenhum lancamento encontrado para os filtros atuais.
                  </td>
                </tr>
              )}
              {tab === 'receitas' &&
                receitasFiltradas.map((row) => (
                  <tr key={row.id} className="border-t border-border-subtle text-app-primary">
                    <td className="px-4 py-4">{clientes?.find((item) => item.id === row.cliente_id)?.nome || 'Sem cliente'}</td>
                    <td className="px-4 py-4">{new Date(row.data_lancamento).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-4 font-semibold text-brand-blue">{formatCurrency(Number(row.valor || 0))}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${String(row.status).toLowerCase() === 'pago' ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300' : 'bg-yellow-500/12 text-yellow-600 dark:text-yellow-300'}`}>
                        {row.status || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button onClick={() => deleteLancamento(row.id)} className="btn-ghost h-10 rounded-2xl border border-border-subtle px-3 text-rose-600 hover:bg-rose-500/10 dark:text-rose-300">
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              {tab === 'custos' &&
                custosFiltrados.map((row) => (
                  <tr key={row.id} className="border-t border-border-subtle text-app-primary">
                    <td className="px-4 py-4">{row.descricao}</td>
                    <td className="px-4 py-4">{new Date(row.data_lancamento).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-4 font-semibold text-brand-orange">{formatCurrency(Number(row.valor || 0))}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${String(row.status).toLowerCase() === 'pago' ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300' : 'bg-yellow-500/12 text-yellow-600 dark:text-yellow-300'}`}>
                        {row.status || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button onClick={() => deleteLancamento(row.id)} className="btn-ghost h-10 rounded-2xl border border-border-subtle px-3 text-rose-600 hover:bg-rose-500/10 dark:text-rose-300">
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:hidden">
        {rows.length === 0 && <div className="surface-panel p-6 text-center text-app-secondary">Nenhum lancamento encontrado para os filtros atuais.</div>}
        {tab === 'receitas' &&
          receitasFiltradas.map((row) => (
            <article key={row.id} className="surface-panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-app-primary">{clientes?.find((item) => item.id === row.cliente_id)?.nome || 'Sem cliente'}</p>
                  <p className="mt-1 text-sm text-app-secondary">{new Date(row.data_lancamento).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className="rounded-full bg-brand-blue/12 px-2.5 py-1 text-xs font-semibold text-brand-blue dark:text-blue-200">{row.status || '-'}</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xl font-semibold text-brand-blue">{formatCurrency(Number(row.valor || 0))}</span>
                <button onClick={() => deleteLancamento(row.id)} className="btn-ghost h-10 rounded-2xl border border-border-subtle px-3 text-rose-600 hover:bg-rose-500/10 dark:text-rose-300">
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            </article>
          ))}
        {tab === 'custos' &&
          custosFiltrados.map((row) => (
            <article key={row.id} className="surface-panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-app-primary">{row.descricao}</p>
                  <p className="mt-1 text-sm text-app-secondary">{new Date(row.data_lancamento).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className="rounded-full bg-brand-orange/12 px-2.5 py-1 text-xs font-semibold text-brand-orange dark:text-orange-200">{row.status || '-'}</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xl font-semibold text-brand-orange">{formatCurrency(Number(row.valor || 0))}</span>
                <button onClick={() => deleteLancamento(row.id)} className="btn-ghost h-10 rounded-2xl border border-border-subtle px-3 text-rose-600 hover:bg-rose-500/10 dark:text-rose-300">
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            </article>
          ))}
      </section>
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
  tone
}: {
  title: string;
  value: string;
  icon: ReactNode;
  tone: 'info' | 'danger' | 'success';
}) {
  const toneMap = {
    info: 'bg-brand-blue/12 text-brand-blue dark:text-blue-200',
    danger: 'bg-brand-orange/12 text-brand-orange dark:text-orange-200',
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

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-app-primary">{label}</label>
      {children}
    </div>
  );
}
