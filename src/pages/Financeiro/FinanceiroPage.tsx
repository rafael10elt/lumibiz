import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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

    setClienteId('');
    setDescricao('');
    setDataLancamento('');
    setValor('');
    setStatusNovo('Pendente');
    setObservacao('');
    setShowForm(false);
    await refresh();
  };

  const deleteLancamento = async (id: string) => {
    if (!confirm('Deseja excluir este lancamento?')) return;
    const result =
      tab === 'receitas'
        ? await supabase.from('receitas').delete().eq('id', id)
        : await supabase.from('custos').delete().eq('id', id);

    if (result.error) {
      alert(`Erro ao excluir lancamento: ${result.error.message}`);
      return;
    }

    await refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Financeiro</h2>
        <p className="text-gray-600 dark:text-gray-300">Gerenciamento de receitas e custos.</p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap -mb-px text-sm font-medium">
          <button onClick={() => setTab('receitas')} className={`rounded-t-lg border-b-2 px-4 py-3 ${tab === 'receitas' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-600 dark:text-gray-300'}`}>Receitas</button>
          <button onClick={() => setTab('custos')} className={`rounded-t-lg border-b-2 px-4 py-3 ${tab === 'custos' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-600 dark:text-gray-300'}`}>Custos</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Venc. De</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Venc. Ate</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
        </div>
        {tab === 'receitas' ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Cliente</label>
            <select value={clienteFiltro} onChange={(e) => setClienteFiltro(e.target.value)} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              <option value="">Todos</option>
              {(clientes || []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Credor</label>
            <input value={credorFiltro} onChange={(e) => setCredorFiltro(e.target.value)} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
        )}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Status</label>
          <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            <option value="">Todos</option>
            <option value="Pendente">Pendente</option>
            <option value="Pago">Pago</option>
            <option value="aprovado">Aprovado</option>
            <option value="lancado">Lancado</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric title="Receitas" value={formatCurrency(totais.totalReceitas)} color="text-blue-500" />
        <Metric title="Custos" value={formatCurrency(totais.totalCustos)} color="text-red-500" />
        <Metric title="Saldo" value={formatCurrency(totais.saldo)} color="text-green-500" />
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowForm((current) => !current)} className="rounded-lg bg-brand-gold px-4 py-2 text-white shadow hover:bg-[#a98c57]">
          {showForm ? `Fechar ${tab === 'receitas' ? 'receita' : 'custo'}` : `Novo ${tab === 'receitas' ? 'Receita' : 'Custo'}`}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
            {tab === 'receitas' ? 'Lancar Nova Receita' : 'Lancar Novo Custo'}
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {tab === 'receitas' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Cliente</label>
                <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  <option value="">Selecione...</option>
                  {(clientes || []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                {tab === 'receitas' ? 'Descricao / Observacao curta' : 'Credor / Fornecedor'}
              </label>
              <input value={descricao} onChange={(e) => setDescricao(e.target.value)} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Data de Vencimento</label>
              <input type="date" value={dataLancamento} onChange={(e) => setDataLancamento(e.target.value)} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Valor</label>
              <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Status</label>
              <select value={statusNovo} onChange={(e) => setStatusNovo(e.target.value as 'Pendente' | 'Pago')} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Observacao</label>
              <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={3} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            </div>
            <div className="flex justify-end gap-4 md:col-span-2">
              <button onClick={() => setShowForm(false)} className="rounded-md bg-gray-200 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200">
                Cancelar
              </button>
              <button onClick={saveLancamento} disabled={saving} className="rounded-md bg-brand-gold px-6 py-2 text-sm font-medium text-white hover:bg-[#a98c57] disabled:opacity-60">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden overflow-x-auto rounded-lg shadow-md md:block">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-300">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-6 py-3">{tab === 'receitas' ? 'Cliente' : 'Credor'}</th>
              <th className="px-6 py-3">Vencimento</th>
              <th className="px-6 py-3">Valor</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {tab === 'receitas' &&
              receitasFiltradas.map((row) => (
                <tr key={row.id} className="border-b bg-white dark:border-gray-700 dark:bg-gray-800">
                  <td className="px-6 py-4">{clientes?.find((item) => item.id === row.cliente_id)?.nome || 'Sem cliente'}</td>
                  <td className="px-6 py-4">{new Date(row.data_lancamento).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4">{formatCurrency(Number(row.valor || 0))}</td>
                  <td className="px-6 py-4">{row.status || '-'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => deleteLancamento(row.id)} className="text-red-500 hover:text-red-600">Excluir</button>
                  </td>
                </tr>
              ))}
            {tab === 'custos' &&
              custosFiltrados.map((row) => (
                <tr key={row.id} className="border-b bg-white dark:border-gray-700 dark:bg-gray-800">
                  <td className="px-6 py-4">{row.descricao}</td>
                  <td className="px-6 py-4">{new Date(row.data_lancamento).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4">{formatCurrency(Number(row.valor || 0))}</td>
                  <td className="px-6 py-4">{row.status || '-'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => deleteLancamento(row.id)} className="text-red-500 hover:text-red-600">Excluir</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {tab === 'receitas' &&
          receitasFiltradas.map((row) => (
            <article key={row.id} className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
              <p className="font-semibold text-gray-900 dark:text-white">{clientes?.find((item) => item.id === row.cliente_id)?.nome || 'Sem cliente'}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{new Date(row.data_lancamento).toLocaleDateString('pt-BR')}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-brand-gold">{formatCurrency(Number(row.valor || 0))}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{row.status || '-'}</span>
              </div>
            </article>
          ))}
        {tab === 'custos' &&
          custosFiltrados.map((row) => (
            <article key={row.id} className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
              <p className="font-semibold text-gray-900 dark:text-white">{row.descricao}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{new Date(row.data_lancamento).toLocaleDateString('pt-BR')}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-brand-gold">{formatCurrency(Number(row.valor || 0))}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{row.status || '-'}</span>
              </div>
            </article>
          ))}
      </div>
    </div>
  );
}

function Metric({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow dark:bg-gray-800">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
