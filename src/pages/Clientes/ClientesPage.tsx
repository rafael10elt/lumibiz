import { useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Search, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
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
  const [categoria, setCategoria] = useState<'Contrato' | 'Lead' | 'Servico'>('Lead');
  const [clienteStatus, setClienteStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Cliente | null>(null);

  const canManage = ['super_admin', 'admin'].includes(perfil?.role || '');

  const filteredClientes = useMemo(
    () =>
      (clientes || []).filter((cliente) => {
        const matchName = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase());
        const normalizedStatus = cliente.status ? cliente.status.toLowerCase() : 'ativo';
        const matchStatus = statusFilter === 'Todos' || normalizedStatus === statusFilter.toLowerCase();
        const normalizedCategory = cliente.categoria === 'Servico' || cliente.categoria === 'Serviço' ? 'Servico' : cliente.categoria;
        const matchCategory = categoryFilter === 'Todos' || normalizedCategory === categoryFilter;
        return matchName && matchStatus && matchCategory;
      }),
    [clientes, searchTerm, statusFilter, categoryFilter]
  );

  const totals = useMemo(
    () => ({
      total: filteredClientes.length,
      ativos: filteredClientes.filter((item) => (item.status || 'ativo').toLowerCase() === 'ativo').length,
      contratos: filteredClientes.filter((item) => item.categoria === 'Contrato').length
    }),
    [filteredClientes]
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
    setCategoria(((cliente.categoria === 'Servico' || cliente.categoria === 'Serviço' ? 'Servico' : cliente.categoria) as 'Contrato' | 'Lead' | 'Servico') || 'Lead');
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
      categoria,
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
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-orange/25 border-t-brand-blue" />
      </div>
    );
  }

  if (isError) {
    return <div className="surface-panel p-6 text-center text-rose-600 dark:text-rose-300">Erro ao carregar clientes.</div>;
  }

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-brand-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue dark:text-blue-200">
            <Building2 size={14} />
            Base comercial
          </span>
          <h2 className="section-title mt-4">Clientes e parceiros</h2>
          <p className="section-copy">Cadastro, relacionamento e consulta rapida dos clientes do tenant.</p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 sm:w-auto">
          <Metric label="Filtrados" value={String(totals.total)} tone="info" />
          <Metric label="Ativos" value={String(totals.ativos)} tone="success" />
          <Metric label="Contratos" value={String(totals.contratos)} tone="amber" />
        </div>
      </section>

      <section className="surface-panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_auto_auto]">
            <label className="relative">
              <Search className="absolute left-3 top-3.5 text-app-muted" size={18} />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {['Todos', 'Ativo', 'Inativo'].map((item) => (
                <button
                  key={item}
                  onClick={() => setStatusFilter(item)}
                  className={cn(
                    'rounded-2xl px-4 py-2 text-sm font-semibold transition',
                    statusFilter === item ? 'bg-gradient-to-r from-brand-blue to-brand-blue-deep text-white shadow-glow' : 'bg-surface-muted text-app-secondary hover:text-app-primary'
                  )}
                >
                  {item}
                </button>
              ))}
            </div>

            {canManage && (
              <div className="flex flex-wrap gap-2">
                {['Todos', 'Contrato', 'Lead', 'Servico'].map((item) => (
                  <button
                    key={item}
                    onClick={() => setCategoryFilter(item)}
                    className={cn(
                      'rounded-2xl px-4 py-2 text-sm font-semibold transition',
                      categoryFilter === item ? 'bg-gradient-to-r from-brand-blue to-brand-blue-deep text-white shadow-glow' : 'bg-surface-muted text-app-secondary hover:text-app-primary'
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {canManage && (
            <button onClick={openCreate} className="btn-primary w-full xl:w-auto">
              <Plus size={18} />
              Novo cliente
            </button>
          )}
        </div>
      </section>

      {!isFormOpen && (
        <>
          {filteredClientes.length === 0 ? (
            <div className="surface-panel py-14 text-center">
              <Users className="mx-auto h-10 w-10 text-app-muted" />
              <p className="mt-4 text-base font-medium text-app-primary">Nenhum cliente encontrado</p>
              <p className="mt-2 text-sm text-app-secondary">Ajuste os filtros ou cadastre um novo cliente para comecar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {filteredClientes.map((cliente) => (
                <ClienteCard key={cliente.id} cliente={cliente} canManage={canManage} onEdit={openEdit} onDelete={setPendingDelete} />
              ))}
            </div>
          )}
        </>
      )}

      {isFormOpen && (
        <section className="surface-panel p-6 sm:p-7">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-app-primary">{editingId ? 'Editar cliente' : 'Novo cliente'}</h3>
              <p className="mt-1 text-sm text-app-secondary">Preencha os dados principais para organizar a carteira do tenant.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Nome do cliente">
              <input value={nome} onChange={(e) => setNome(e.target.value)} className="input-field" required />
            </Field>
            <Field label="Telefone">
              <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="input-field" />
            </Field>
            <Field label="Responsavel">
              <input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className="input-field" />
            </Field>
            <Field label="Status">
              <select value={clienteStatus} onChange={(e) => setClienteStatus(e.target.value as 'ativo' | 'inativo')} className="input-field">
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </Field>
            <Field label="Categoria">
              <select value={categoria} onChange={(e) => setCategoria(e.target.value as 'Contrato' | 'Lead' | 'Servico')} className="input-field">
                <option value="Contrato">Contrato</option>
                <option value="Lead">Lead</option>
                <option value="Servico">Servico</option>
              </select>
            </Field>
            <Field label="Endereco" className="xl:col-span-3">
              <input value={endereco} onChange={(e) => setEndereco(e.target.value)} className="input-field" />
            </Field>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button onClick={saveCliente} disabled={saving} className="btn-primary">
              {saving ? 'Salvando...' : 'Salvar cliente'}
            </button>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Excluir cliente"
        description={pendingDelete ? `Deseja excluir o cliente "${pendingDelete.nome}"?` : ''}
        confirmText="Excluir"
        confirmVariant="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const cliente = pendingDelete;
          setPendingDelete(null);
          if (cliente) void deleteCliente(cliente);
        }}
      />
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: 'info' | 'success' | 'amber' }) {
  const toneMap = {
    info: 'bg-brand-blue/12 text-brand-blue dark:text-blue-200',
    success: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
    amber: 'bg-brand-orange/12 text-brand-orange dark:text-orange-200'
  };

  return (
    <div className="surface-subtle p-4">
      <p className="text-sm text-app-secondary">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneMap[tone]}`}>{value}</p>
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
