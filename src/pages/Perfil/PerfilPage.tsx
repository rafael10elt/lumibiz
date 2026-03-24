import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MailPlus, Pencil, Search, ShieldPlus, UserRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConvitesUsuarios, usePerfis } from '../../hooks/useLumiBiz';
import { supabase } from '../../lib/supabase';

export function PerfilPage() {
  const queryClient = useQueryClient();
  const { perfil: currentPerfil } = useAuth();
  const { data: perfis, isLoading, isError, error } = usePerfis();
  const { data: convites } = useConvitesUsuarios();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'Todos' | 'ativo' | 'inativo'>('Todos');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'gestor' | 'usuario'>('usuario');
  const [rowStatus, setRowStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [saving, setSaving] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'gestor' | 'usuario'>('usuario');
  const [inviteSaving, setInviteSaving] = useState(false);

  const canManage = ['super_admin', 'admin'].includes(currentPerfil?.role || '');

  const rows = useMemo(
    () =>
      (perfis || []).filter((item) => {
        const matchSearch =
          !search ||
          item.nome?.toLowerCase().includes(search.toLowerCase()) ||
          item.email?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = status === 'Todos' || item.status === status;
        return matchSearch && matchStatus;
      }),
    [perfis, search, status]
  );

  const openEdit = (id: string) => {
    const selected = rows.find((item) => item.id === id);
    if (!selected) return;
    setEditingId(id);
    setNome(selected.nome || '');
    setEmail(selected.email || '');
    setRole((selected.role as 'admin' | 'gestor' | 'usuario') || 'usuario');
    setRowStatus((selected.status as 'ativo' | 'inativo') || 'ativo');
  };

  const savePerfil = async () => {
    if (!editingId) return;

    setSaving(true);
    const { error: updateError } = await supabase
      .from('perfis')
      .update({ nome, email, role, status: rowStatus } as never)
      .eq('id', editingId);
    setSaving(false);

    if (updateError) {
      alert(`Erro ao salvar perfil: ${updateError.message}`);
      return;
    }

    setEditingId(null);
    await queryClient.invalidateQueries({ queryKey: ['perfis'] });
  };

  const createInvite = async () => {
    if (!currentPerfil?.tenant_id || !currentPerfil.id || !inviteName.trim() || !inviteEmail.trim()) {
      alert('Preencha nome e email do convite.');
      return;
    }

    setInviteSaving(true);
    const { error: insertError } = await supabase.from('convites_usuarios').insert({
      tenant_id: currentPerfil.tenant_id,
      nome: inviteName.trim(),
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      invited_by: currentPerfil.id,
      status: 'pendente'
    } as never);
    setInviteSaving(false);

    if (insertError) {
      alert(`Erro ao criar convite: ${insertError.message}`);
      return;
    }

    setInviteName('');
    setInviteEmail('');
    setInviteRole('usuario');
    await queryClient.invalidateQueries({ queryKey: ['perfis', 'convites'] });
  };

  const cancelInvite = async (id: string) => {
    const { error: updateError } = await supabase
      .from('convites_usuarios')
      .update({ status: 'cancelado' } as never)
      .eq('id', id);

    if (updateError) {
      alert(`Erro ao cancelar convite: ${updateError.message}`);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['perfis', 'convites'] });
  };

  if (isLoading) return <div className="py-12 text-center text-gray-500">Carregando perfis...</div>;
  if (isError) return <div className="py-12 text-center text-red-500">Erro ao carregar perfis: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Perfis</h2>
        <p className="text-gray-600 dark:text-gray-300">Gestao dos usuarios do tenant, com base em perfis ativos e convites pendentes.</p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow dark:bg-gray-800 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row">
            <label className="relative flex-1">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou email"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
            <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-700">
              {(['Todos', 'ativo', 'inativo'] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setStatus(item)}
                  className={`rounded-lg px-3 py-2 text-sm ${status === item ? 'bg-brand-gold text-white' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {canManage && (
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-dashed border-brand-gold/40 p-4 md:grid-cols-4">
              <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Nome do usuario" className="rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-700 dark:bg-gray-900" />
              <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Email do usuario" className="rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-700 dark:bg-gray-900" />
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)} className="rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-700 dark:bg-gray-900">
                <option value="usuario">Usuario</option>
                <option value="gestor">Gestor</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={createInvite} disabled={inviteSaving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-dark px-4 py-3 text-white hover:bg-brand-gold disabled:opacity-60">
                <MailPlus size={18} />
                {inviteSaving ? 'Criando...' : 'Novo convite'}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-brand-gold/10 px-4 py-3 text-sm text-brand-gold">
          {canManage ? 'Convites criam a trilha administrativa do usuario. A etapa de aceite/signup sera conectada na proxima iteracao.' : 'Visualizacao liberada para consulta do proprio tenant.'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((item) => (
          <article key={item.id} className="rounded-2xl bg-white p-5 shadow dark:bg-gray-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
                  <UserRound size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.nome || 'Sem nome'}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.email || 'Sem email'}</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {item.status || 'ativo'}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm dark:bg-gray-900/50">
              <span className="text-gray-500 dark:text-gray-400">Role</span>
              <span className="font-medium capitalize text-gray-900 dark:text-white">{item.role}</span>
            </div>

            {canManage && (
              <button onClick={() => openEdit(item.id)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-dark px-4 py-2 text-sm font-medium text-white hover:bg-brand-gold">
                <Pencil size={16} />
                Editar perfil
              </button>
            )}
          </article>
        ))}
      </div>

      <section className="rounded-2xl bg-white p-5 shadow dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-2">
          <ShieldPlus className="text-brand-gold" size={20} />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Convites pendentes</h3>
        </div>
        <div className="space-y-3">
          {(convites || []).length === 0 && <div className="text-sm text-gray-500">Nenhum convite registrado.</div>}
          {(convites || []).map((invite) => (
            <div key={invite.id} className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{invite.nome}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{invite.email}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Role: {invite.role} | Status: {invite.status} | Expira em: {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {canManage && invite.status === 'pendente' && (
                <button onClick={() => cancelInvite(invite.id)} className="rounded-xl border border-rose-200 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/30">
                  Cancelar convite
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Editar Perfil</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">A criacao completa do usuario autenticado sera amarrada ao fluxo de aceite do convite.</p>
              </div>
              <ShieldPlus className="text-brand-gold" size={22} />
            </div>

            <div className="space-y-4">
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" className="w-full rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-700 dark:bg-gray-800" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-700 dark:bg-gray-800" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="w-full rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-700 dark:bg-gray-800">
                  <option value="usuario">Usuario</option>
                  <option value="gestor">Gestor</option>
                  <option value="admin">Admin</option>
                </select>
                <select value={rowStatus} onChange={(e) => setRowStatus(e.target.value as typeof rowStatus)} className="w-full rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-700 dark:bg-gray-800">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditingId(null)} className="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700">
                Cancelar
              </button>
              <button onClick={savePerfil} disabled={saving} className="rounded-xl bg-brand-dark px-4 py-3 text-white hover:bg-brand-gold disabled:opacity-60">
                {saving ? 'Salvando...' : 'Salvar alteracoes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
