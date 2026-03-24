import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { type Cliente, useClientes } from '../../hooks/useLumiBiz';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { ClienteCard } from './ClienteCard';

export function ClientesPage() {
  const queryClient = useQueryClient();
  const { perfil } = useAuth();
  const { data: clientes, isLoading, isError } = useClientes();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [endereco, setEndereco] = useState('');
  const [categoria, setCategoria] = useState<'Contrato' | 'Lead' | 'Serviço'>('Lead');
  const [clienteStatus, setClienteStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [saving, setSaving] = useState(false);

  const canManage = ['super_admin', 'admin'].includes(perfil?.role || '');

  const filteredClientes = useMemo(
    () =>
      (clientes || []).filter((cliente) => {
        const matchName = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase());
        const normalizedStatus = cliente.status ? cliente.status.toLowerCase() : 'ativo';
        const matchStatus = statusFilter === 'Todos' || normalizedStatus === statusFilter.toLowerCase();
        const normalizedCategory = cliente.categoria === 'Servico' ? 'Serviço' : cliente.categoria;
        const matchCategory = categoryFilter === 'Todos' || normalizedCategory === categoryFilter;
        return matchName && matchStatus && matchCategory;
      }),
    [clientes, searchTerm, statusFilter, categoryFilter]
  );

  const resetForm = () => {
    setEditingId(null);
    setNome('');
    setTelefone('');
    setResponsavel('');
    setEndereco('');
    setCategoria('Lead');
    setClienteStatus('ativo');
  };

  const openCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (cliente: Cliente) => {
    setEditingId(cliente.id);
    setNome(cliente.nome);
    setTelefone(cliente.telefone || '');
    setResponsavel(cliente.responsavel || '');
    setEndereco(cliente.endereco || '');
    setCategoria(((cliente.categoria === 'Servico' ? 'Serviço' : cliente.categoria) as 'Contrato' | 'Lead' | 'Serviço') || 'Lead');
    setClienteStatus(((cliente.status || 'ativo').toLowerCase() as 'ativo' | 'inativo') || 'ativo');
    setIsFormOpen(true);
  };

  const saveCliente = async () => {
    if (!perfil?.tenant_id || !nome.trim()) {
      alert('Informe o nome do cliente.');
      return;
    }

    setSaving(true);
    const payload = {
      tenant_id: perfil.tenant_id,
      nome: nome.trim(),
      telefone: telefone.trim() || null,
      responsavel: responsavel.trim() || null,
      endereco: endereco.trim() || null,
      categoria: categoria,
      status: clienteStatus
    };

    const result = editingId
      ? await supabase.from('clientes').update(payload as never).eq('id', editingId)
      : await supabase.from('clientes').insert(payload as never);

    setSaving(false);

    if (result.error) {
      alert(`Erro ao salvar cliente: ${result.error.message}`);
      return;
    }

    setIsFormOpen(false);
    resetForm();
    await queryClient.invalidateQueries({ queryKey: ['clientes'] });
  };

  const deleteCliente = async (cliente: Cliente) => {
    const confirmed = confirm(`Deseja excluir o cliente "${cliente.nome}"?`);
    if (!confirmed) return;

    const { error } = await supabase.from('clientes').delete().eq('id', cliente.id);
    if (error) {
      alert(`Erro ao excluir cliente: ${error.message}`);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['clientes'] });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-gold" />
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 text-center text-red-500">Erro ao carregar clientes.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Clientes</h2>
        <p className="text-gray-600 dark:text-gray-300">Gerenciamento de clientes e parceiros.</p>
      </div>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-gold dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="flex rounded-lg bg-gray-200 p-1 dark:bg-gray-700">
            {['Todos', 'Ativo', 'Inativo'].map((item) => (
              <button
                key={item}
                onClick={() => setStatusFilter(item)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  statusFilter === item ? 'bg-brand-gold text-white shadow-sm' : 'text-gray-600 hover:bg-gray-300 dark:text-gray-300 dark:hover:bg-gray-600'
                )}
              >
                {item}
              </button>
            ))}
          </div>

          {canManage && (
            <div className="hidden rounded-lg bg-gray-200 p-1 md:flex dark:bg-gray-700">
              {['Todos', 'Contrato', 'Lead', 'Serviço'].map((item) => (
                <button
                  key={item}
                  onClick={() => setCategoryFilter(item)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    categoryFilter === item ? 'bg-brand-gold text-white shadow-sm' : 'text-gray-600 hover:bg-gray-300 dark:text-gray-300 dark:hover:bg-gray-600'
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          {canManage && (
            <button onClick={openCreate} className="ml-auto flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2 text-white shadow hover:bg-[#a98c57] sm:ml-0">
              <Plus size={18} />
              Novo Cliente
            </button>
          )}
        </div>
      </div>

      {!isFormOpen && (
        <>
          {filteredClientes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800">
              Nenhum cliente encontrado para estes filtros.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredClientes.map((cliente) => (
                <ClienteCard key={cliente.id} cliente={cliente} canManage={canManage} onEdit={openEdit} onDelete={deleteCliente} />
              ))}
            </div>
          )}
        </>
      )}

      {isFormOpen && (
        <div className="mt-6">
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
              {editingId ? 'Editar Cliente' : 'Cadastro de Cliente'}
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Nome do Cliente</label>
                <input value={nome} onChange={(e) => setNome(e.target.value)} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Telefone</label>
                <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Responsavel</label>
                <input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Status</label>
                <select value={clienteStatus} onChange={(e) => setClienteStatus(e.target.value as 'ativo' | 'inativo')} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Categoria</label>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value as 'Contrato' | 'Lead' | 'Serviço')} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  <option value="Contrato">Contrato</option>
                  <option value="Lead">Lead</option>
                  <option value="Serviço">Serviço</option>
                </select>
              </div>
              <div className="lg:col-span-3">
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Endereco</label>
                <input value={endereco} onChange={(e) => setEndereco(e.target.value)} className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
              <div className="flex justify-end gap-4 md:col-span-2 lg:col-span-3">
                <button onClick={() => { setIsFormOpen(false); resetForm(); }} className="rounded-md bg-gray-200 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                  Cancelar
                </button>
                <button onClick={saveCliente} disabled={saving} className="rounded-md bg-brand-gold px-6 py-2 text-sm font-medium text-white hover:bg-[#a98c57] disabled:opacity-60">
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
