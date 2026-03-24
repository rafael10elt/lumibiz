import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  const canManage = ['super_admin', 'admin', 'gestor'].includes(perfil?.role || '');

  const rows = useMemo(
    () => (data || []).filter((item) => statusFiltro === 'todos' || item.status === statusFiltro),
    [data, statusFiltro]
  );

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
      status: statusNovo,
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
    const { error: updateError } = await supabase
      .from('validades')
      .update({ status } as never)
      .eq('id', id);
    if (updateError) {
      alert(`Erro ao atualizar status: ${updateError.message}`);
      return;
    }
    await refresh();
  };

  const excluirValidade = async (id: string) => {
    const confirmDelete = confirm('Deseja excluir esta validade?');
    if (!confirmDelete) return;

    const { error: deleteError } = await supabase.from('validades').delete().eq('id', id);
    if (deleteError) {
      alert(`Erro ao excluir validade: ${deleteError.message}`);
      return;
    }
    await refresh();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {isLoading && <div className="p-6 text-gray-500">Carregando validades...</div>}
        {isError && <div className="p-6 text-red-500">Erro ao carregar validades: {error?.message}</div>}
        {!isLoading && !isError && (
          <div className="space-y-3 p-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
              <input
                type="date"
                value={dataValidade}
                onChange={(e) => setDataValidade(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
              <select
                value={statusNovo}
                onChange={(e) => setStatusNovo(e.target.value as typeof statusNovo)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="pendente">pendente</option>
                <option value="em_dia">em_dia</option>
                <option value="vencido">vencido</option>
              </select>
              <button
                onClick={criarValidade}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-brand-dark text-white hover:bg-brand-gold transition-colors disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Nova Validade'}
              </button>
            </div>

            <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg w-fit">
              {(['todos', 'pendente', 'em_dia', 'vencido'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFiltro(status)}
                  className={`px-3 py-1 text-sm rounded-md ${statusFiltro === status ? 'bg-brand-gold text-white' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/40">
                  <tr>
                    <th className="text-left px-4 py-3">Titulo</th>
                    <th className="text-left px-4 py-3">Data de validade</th>
                    <th className="text-left px-4 py-3">Status</th>
                    {canManage && <th className="text-left px-4 py-3">Acoes</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3">{item.titulo}</td>
                      <td className="px-4 py-3">{new Date(item.data_validade).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {canManage ? (
                          <select
                            value={item.status || 'pendente'}
                            onChange={(e) => atualizarStatus(item.id, e.target.value as 'pendente' | 'em_dia' | 'vencido')}
                            className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                          >
                            <option value="pendente">pendente</option>
                            <option value="em_dia">em_dia</option>
                            <option value="vencido">vencido</option>
                          </select>
                        ) : (
                          <span className="capitalize">{item.status || '-'}</span>
                        )}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <button onClick={() => excluirValidade(item.id)} className="text-red-500 hover:text-red-600">
                            Excluir
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
