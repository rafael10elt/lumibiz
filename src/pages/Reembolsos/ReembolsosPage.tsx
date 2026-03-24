import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useReembolsos } from '../../hooks/useLumiBiz';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

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
  const canManage = ['super_admin', 'admin', 'gestor'].includes(perfil?.role || '');

  const rows = useMemo(
    () => (data || []).filter((item) => statusFiltro === 'todos' || item.status === statusFiltro),
    [data, statusFiltro]
  );

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
      motivo: motivo.trim() || null,
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
    const { error: updateError } = await supabase
      .from('reembolsos')
      .update({ status } as never)
      .eq('id', id);

    if (updateError) {
      alert(`Erro ao atualizar status: ${updateError.message}`);
      return;
    }
    await refreshReembolsos();
  };

  const excluirReembolso = async (id: string) => {
    const confirmDelete = confirm('Deseja excluir este reembolso?');
    if (!confirmDelete) return;

    const { error: deleteError } = await supabase.from('reembolsos').delete().eq('id', id);
    if (deleteError) {
      alert(`Erro ao excluir reembolso: ${deleteError.message}`);
      return;
    }
    await refreshReembolsos();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {isLoading && <div className="p-6 text-gray-500">Carregando reembolsos...</div>}
        {isError && <div className="p-6 text-red-500">Erro ao carregar reembolsos: {error?.message}</div>}
        {!isLoading && !isError && (
          <div className="space-y-3 p-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                type="date"
                value={dataSolicitacao}
                onChange={(e) => setDataSolicitacao(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Valor"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
              <select
                value={statusNovo}
                onChange={(e) => setStatusNovo(e.target.value as typeof statusNovo)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="solicitado">Solicitado</option>
                <option value="aprovado">Aprovado</option>
                <option value="pago">Pago</option>
                <option value="recusado">Recusado</option>
              </select>
              <input
                type="text"
                placeholder="Motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
              <button
                onClick={criarReembolso}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-brand-dark text-white hover:bg-brand-gold transition-colors disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Novo Reembolso'}
              </button>
            </div>

            <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg w-fit">
              {(['todos', 'solicitado', 'aprovado', 'pago', 'recusado'] as const).map((status) => (
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
                    <th className="text-left px-4 py-3">Data</th>
                    <th className="text-left px-4 py-3">Valor</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Motivo</th>
                    {canManage && <th className="text-left px-4 py-3">Acoes</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3">{new Date(item.data_solicitacao).toLocaleDateString()}</td>
                      <td className="px-4 py-3">R$ {Number(item.valor).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        {canManage ? (
                          <select
                            value={item.status || 'solicitado'}
                            onChange={(e) => atualizarStatus(item.id, e.target.value as 'solicitado' | 'aprovado' | 'pago' | 'recusado')}
                            className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                          >
                            <option value="solicitado">solicitado</option>
                            <option value="aprovado">aprovado</option>
                            <option value="pago">pago</option>
                            <option value="recusado">recusado</option>
                          </select>
                        ) : (
                          <span className="capitalize">{item.status || '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{item.motivo || '-'}</td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <button onClick={() => excluirReembolso(item.id)} className="text-red-500 hover:text-red-600">
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
