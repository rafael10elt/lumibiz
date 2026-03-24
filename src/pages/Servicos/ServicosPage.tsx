import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServicos } from '../../hooks/useLumiBiz';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function ServicosPage() {
  const queryClient = useQueryClient();
  const { perfil } = useAuth();
  const { data, isLoading, isError, error } = useServicos();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [statusNovo, setStatusNovo] = useState<'aberto' | 'em_andamento' | 'concluido'>('aberto');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'aberto' | 'em_andamento' | 'concluido'>('todos');
  const [saving, setSaving] = useState(false);
  const canManage = ['super_admin', 'admin', 'gestor'].includes(perfil?.role || '');

  const rows = useMemo(
    () => (data || []).filter((item) => statusFiltro === 'todos' || item.status === statusFiltro),
    [data, statusFiltro]
  );

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['servicos'] });
  };

  const criarServico = async () => {
    if (!perfil?.tenant_id || !perfil?.id || !titulo.trim()) {
      alert('Preencha os campos obrigatorios e confirme seu perfil.');
      return;
    }

    setSaving(true);
    const { error: insertError } = await supabase.from('servicos').insert({
      tenant_id: perfil.tenant_id,
      usuario_id: perfil.id,
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      status: statusNovo,
    } as never);
    setSaving(false);

    if (insertError) {
      alert(`Erro ao criar servico: ${insertError.message}`);
      return;
    }

    setTitulo('');
    setDescricao('');
    setStatusNovo('aberto');
    await refresh();
  };

  const atualizarStatus = async (id: string, status: 'aberto' | 'em_andamento' | 'concluido') => {
    const { error: updateError } = await supabase
      .from('servicos')
      .update({ status } as never)
      .eq('id', id);
    if (updateError) {
      alert(`Erro ao atualizar status: ${updateError.message}`);
      return;
    }
    await refresh();
  };

  const excluirServico = async (id: string) => {
    const confirmDelete = confirm('Deseja excluir este servico?');
    if (!confirmDelete) return;

    const { error: deleteError } = await supabase.from('servicos').delete().eq('id', id);
    if (deleteError) {
      alert(`Erro ao excluir servico: ${deleteError.message}`);
      return;
    }
    await refresh();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {isLoading && <div className="p-6 text-gray-500">Carregando servicos...</div>}
        {isError && <div className="p-6 text-red-500">Erro ao carregar servicos: {error?.message}</div>}
        {!isLoading && !isError && (
          <div className="space-y-3 p-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Titulo do servico"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
              <input
                type="text"
                placeholder="Descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
              <select
                value={statusNovo}
                onChange={(e) => setStatusNovo(e.target.value as typeof statusNovo)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="aberto">aberto</option>
                <option value="em_andamento">em_andamento</option>
                <option value="concluido">concluido</option>
              </select>
              <button
                onClick={criarServico}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-brand-dark text-white hover:bg-brand-gold transition-colors disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Novo Servico'}
              </button>
            </div>

            <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg w-fit">
              {(['todos', 'aberto', 'em_andamento', 'concluido'] as const).map((status) => (
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
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Criado em</th>
                    <th className="text-left px-4 py-3">Descricao</th>
                    {canManage && <th className="text-left px-4 py-3">Acoes</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3">{item.titulo}</td>
                      <td className="px-4 py-3">
                        {canManage ? (
                          <select
                            value={item.status || 'aberto'}
                            onChange={(e) => atualizarStatus(item.id, e.target.value as 'aberto' | 'em_andamento' | 'concluido')}
                            className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                          >
                            <option value="aberto">aberto</option>
                            <option value="em_andamento">em_andamento</option>
                            <option value="concluido">concluido</option>
                          </select>
                        ) : (
                          <span className="capitalize">{item.status || '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{item.descricao || '-'}</td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <button onClick={() => excluirServico(item.id)} className="text-red-500 hover:text-red-600">
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
