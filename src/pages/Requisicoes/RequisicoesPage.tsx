import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useItensCatalogo, usePerfis, useRequisicoes } from '../../hooks/useLumiBiz';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';

type RequisicaoTab = 'requisicoes' | 'itens';

export function RequisicoesPage() {
  const queryClient = useQueryClient();
  const { perfil } = useAuth();
  const { data: requisicoes, isLoading: loadingReq, isError: errorReq, error: reqError } = useRequisicoes();
  const { data: itens, isLoading: loadingItens, isError: errorItens, error: itensError } = useItensCatalogo();
  const { data: perfis } = usePerfis();
  const [aba, setAba] = useState<RequisicaoTab>('requisicoes');
  const [showForm, setShowForm] = useState(false);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [usuarioFiltro, setUsuarioFiltro] = useState('');
  const [itemFiltro, setItemFiltro] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [statusNova, setStatusNova] = useState<'aberta' | 'aprovada' | 'recusada'>('aberta');
  const [saving, setSaving] = useState(false);

  const loading = aba === 'requisicoes' ? loadingReq : loadingItens;
  const hasError = aba === 'requisicoes' ? errorReq : errorItens;
  const error = aba === 'requisicoes' ? reqError : itensError;
  const canManage = ['super_admin', 'admin', 'gestor'].includes(perfil?.role || '');

  const rows = useMemo(() => {
    return (requisicoes || []).filter((item) => {
      const okStatus = !statusFiltro || item.status === statusFiltro;
      const okUsuario = !usuarioFiltro || item.solicitante_id === usuarioFiltro;
      const okStart = !dataInicio || item.created_at.slice(0, 10) >= dataInicio;
      const okEnd = !dataFim || item.created_at.slice(0, 10) <= dataFim;
      const okItem = !itemFiltro || (item.observacoes || '').toLowerCase().includes(itemFiltro.toLowerCase());
      return okStatus && okUsuario && okStart && okEnd && okItem;
    });
  }, [requisicoes, statusFiltro, usuarioFiltro, dataInicio, dataFim, itemFiltro]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['requisicoes'] });
  };

  const criarRequisicao = async () => {
    if (!perfil?.tenant_id || !perfil?.id || !observacoes.trim()) {
      alert('Preencha a observacao da requisicao.');
      return;
    }

    setSaving(true);
    const { error: insertError } = await supabase.from('requisicoes').insert({
      tenant_id: perfil.tenant_id,
      solicitante_id: perfil.id,
      status: statusNova,
      observacoes: observacoes.trim()
    } as never);
    setSaving(false);

    if (insertError) {
      alert(`Erro ao criar requisicao: ${insertError.message}`);
      return;
    }

    setObservacoes('');
    setStatusNova('aberta');
    setShowForm(false);
    await refresh();
  };

  const atualizarStatus = async (id: string, status: 'aberta' | 'aprovada' | 'recusada') => {
    const { error: updateError } = await supabase.from('requisicoes').update({ status } as never).eq('id', id);
    if (updateError) {
      alert(`Erro ao atualizar status: ${updateError.message}`);
      return;
    }
    await refresh();
  };

  const excluirRequisicao = async (id: string) => {
    if (!confirm('Deseja excluir esta requisicao?')) return;
    const { error: deleteError } = await supabase.from('requisicoes').delete().eq('id', id);
    if (deleteError) {
      alert(`Erro ao excluir requisicao: ${deleteError.message}`);
      return;
    }
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Requisicoes</h2>
        <p className="text-gray-600 dark:text-gray-300">Gerenciamento de requisicoes de materiais.</p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap -mb-px text-sm font-medium">
          <button onClick={() => setAba('requisicoes')} className={`rounded-t-lg border-b-2 px-4 py-3 ${aba === 'requisicoes' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-600 dark:text-gray-300'}`}>Requisicoes</button>
          <button onClick={() => setAba('itens')} className={`rounded-t-lg border-b-2 px-4 py-3 ${aba === 'itens' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-600 dark:text-gray-300'}`}>Itens de Requisicao</button>
        </div>
      </div>

      {aba === 'requisicoes' && (
        <>
          <div className="grid grid-cols-1 gap-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">De</label>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Ate</label>
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Usuario</label>
              <select value={usuarioFiltro} onChange={(e) => setUsuarioFiltro(e.target.value)} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                <option value="">Todos</option>
                {(perfis || []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome || item.email || item.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Status</label>
              <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                <option value="">Todos</option>
                <option value="aberta">Aberta</option>
                <option value="aprovada">Aprovada</option>
                <option value="recusada">Recusada</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Item</label>
              <input value={itemFiltro} onChange={(e) => setItemFiltro(e.target.value)} placeholder="Buscar item..." className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button className="rounded-lg bg-gray-600 px-4 py-2 text-white shadow hover:bg-gray-700">Baixar Selecionados</button>
            <button onClick={() => setShowForm((current) => !current)} className="rounded-lg bg-brand-gold px-4 py-2 text-white shadow hover:bg-[#a98c57]">
              {showForm ? 'Fechar formulario' : 'Nova Requisicao'}
            </button>
          </div>

          {showForm && (
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">Nova Requisicao</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Status</label>
                  <select value={statusNova} onChange={(e) => setStatusNova(e.target.value as typeof statusNova)} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <option value="aberta">Aberta</option>
                    <option value="aprovada">Aprovada</option>
                    <option value="recusada">Recusada</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Observacao</label>
                  <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={4} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="flex justify-end gap-4 md:col-span-2">
                  <button onClick={() => setShowForm(false)} className="rounded-md bg-gray-200 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200">
                    Cancelar
                  </button>
                  <button onClick={criarRequisicao} disabled={saving} className="rounded-md bg-brand-gold px-6 py-2 text-sm font-medium text-white hover:bg-[#a98c57] disabled:opacity-60">
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
                  <th className="px-6 py-3">Usuario</th>
                  <th className="px-6 py-3">Data/Hora</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className="border-b bg-white dark:border-gray-700 dark:bg-gray-800">
                    <td className="px-6 py-4">{perfis?.find((perfilItem) => perfilItem.id === item.solicitante_id)?.nome || 'Nao identificado'}</td>
                    <td className="px-6 py-4">{new Date(item.created_at).toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4">
                      {canManage ? (
                        <select value={item.status || 'aberta'} onChange={(e) => atualizarStatus(item.id, e.target.value as 'aberta' | 'aprovada' | 'recusada')} className="rounded border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900">
                          <option value="aberta">aberta</option>
                          <option value="aprovada">aprovada</option>
                          <option value="recusada">recusada</option>
                        </select>
                      ) : (
                        <span className="capitalize">{item.status || '-'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {canManage && <button onClick={() => excluirRequisicao(item.id)} className="text-red-500 hover:text-red-600">Excluir</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 md:hidden">
            {rows.map((item) => (
              <article key={item.id} className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
                <p className="font-semibold text-gray-900 dark:text-white">{perfis?.find((perfilItem) => perfilItem.id === item.solicitante_id)?.nome || 'Nao identificado'}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{new Date(item.created_at).toLocaleString('pt-BR')}</p>
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{item.observacoes || '-'}</p>
              </article>
            ))}
          </div>
        </>
      )}

      {aba === 'itens' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2 rounded-lg bg-gray-200 p-2 dark:bg-gray-700">
              {[...new Set((itens || []).map((item) => item.categoria || 'Sem categoria'))].map((categoria) => (
                <button key={categoria} className="rounded-md bg-white px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  {categoria}
                </button>
              ))}
            </div>
            {canManage && <button className="w-full rounded-lg bg-brand-gold px-4 py-2 text-white shadow hover:bg-[#a98c57] sm:w-auto">Novo Item</button>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(itens || []).map((item) => (
              <article key={item.id} className="rounded-xl bg-white p-5 shadow dark:bg-gray-800">
                <p className="font-semibold text-gray-900 dark:text-white">{item.nome}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.categoria || 'Sem categoria'}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-brand-gold">{item.preco_unitario != null ? formatCurrency(Number(item.preco_unitario)) : '-'}</span>
                  <span className={item.ativo ? 'text-emerald-600' : 'text-rose-600'}>{item.ativo ? 'Ativo' : 'Inativo'}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="rounded-xl bg-white p-6 text-gray-500 shadow dark:bg-gray-800">Carregando...</div>}
      {hasError && <div className="rounded-xl bg-white p-6 text-red-500 shadow dark:bg-gray-800">Erro: {error?.message}</div>}
    </div>
  );
}
