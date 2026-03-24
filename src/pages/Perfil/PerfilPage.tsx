import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MailPlus, Pencil, Search, ShieldPlus, UserRound, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConvitesUsuarios, usePerfis } from '../../hooks/useLumiBiz';
import { supabase } from '../../lib/supabase';

export function PerfilPage() {
  const queryClient = useQueryClient();
  const { perfil: currentPerfil } = useAuth();
  const { data: perfis, isLoading, isError, error } = usePerfis();
  const { data: convites, isLoading: convitesLoading, isError: convitesError, error: convitesErrorData } = useConvitesUsuarios();
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

  const basePerfis = useMemo(() => {
    if ((perfis || []).length > 0) return perfis || [];
    return currentPerfil ? [currentPerfil] : [];
  }, [perfis, currentPerfil]);

  const rows = useMemo(
    () =>
      basePerfis.filter((item) => {
        const matchSearch = !search || item.nome?.toLowerCase().includes(search.toLowerCase()) || item.email?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = status === 'Todos' || item.status === status;
        return matchSearch && matchStatus;
      }),
    [basePerfis, search, status]
  );

  const openEdit = (id: string) => {
    const selected = basePerfis.find((item) => item.id === id);
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
    const { error: updateError } = await supabase.from('perfis').update({ nome, email, role, status: rowStatus } as never).eq('id', editingId);
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
    const { error: updateError } = await supabase.from('convites_usuarios').update({ status: 'cancelado' } as never).eq('id', id);

    if (updateError) {
      alert(`Erro ao cancelar convite: ${updateError.message}`);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['perfis', 'convites'] });
  };

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-brand-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue dark:text-blue-200">
            <Users size={14} />
            Acesso e pessoas
          </span>
          <h2 className="section-title mt-4">Perfis do tenant</h2>
          <p className="section-copy">Gestao dos usuarios ativos, papeis de acesso e convites administrativos do workspace.</p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 sm:w-auto">
          <Metric label="Perfis" value={String(rows.length)} tone="info" />
          <Metric label="Ativos" value={String(basePerfis.filter((item) => item.status !== 'inativo').length)} tone="success" />
          <Metric label="Convites" value={String((convites || []).length)} tone="amber" />
        </div>
      </section>

      <section className="surface-panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-1 flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <label className="relative">
                <Search size={18} className="absolute left-3 top-3.5 text-app-muted" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou email" className="input-field pl-10" />
              </label>
              <div className="flex flex-wrap gap-2">
                {(['Todos', 'ativo', 'inativo'] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setStatus(item)}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      status === item ? 'bg-gradient-to-r from-brand-blue to-brand-blue-deep text-white shadow-glow' : 'bg-surface-muted text-app-secondary hover:text-app-primary'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {canManage && (
              <div className="surface-subtle grid grid-cols-1 gap-3 p-4 md:grid-cols-4">
                <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Nome do usuario" className="input-field" />
                <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Email do usuario" className="input-field" />
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)} className="input-field">
                  <option value="usuario">Usuario</option>
                  <option value="gestor">Gestor</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={createInvite} disabled={inviteSaving} className="btn-primary">
                  <MailPlus size={18} />
                  {inviteSaving ? 'Criando...' : 'Novo convite'}
                </button>
              </div>
            )}
          </div>

          <div className="surface-subtle max-w-md p-4 text-sm text-app-secondary">
            {canManage
              ? 'Convites criam a trilha administrativa do usuario. A etapa de aceite e signup ainda sera conectada na proxima iteracao.'
              : 'Visualizacao liberada para consulta do proprio tenant.'}
          </div>
        </div>

        {isLoading && basePerfis.length === 0 && <div className="mt-5 rounded-2xl border border-dashed border-border-subtle px-4 py-4 text-sm text-app-secondary">Carregando perfis...</div>}
        {isError && <div className="mt-5 rounded-2xl border border-rose-300/50 bg-rose-500/10 px-4 py-4 text-sm text-rose-700 dark:text-rose-300">Erro ao carregar perfis: {error.message}</div>}
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {rows.length === 0 && !isLoading && (
          <div className="surface-panel p-6 text-sm text-app-secondary">Nenhum perfil encontrado para os filtros atuais.</div>
        )}

        {rows.map((item) => (
          <article key={item.id} className="surface-panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-orange text-white shadow-glow">
                  <UserRound size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-app-primary">{item.nome || 'Sem nome'}</h3>
                  <p className="text-sm text-app-secondary">{item.email || 'Sem email'}</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'inativo' ? 'bg-rose-500/12 text-rose-600 dark:text-rose-300' : 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300'}`}>
                {item.status || 'ativo'}
              </span>
            </div>

            <div className="mt-4 surface-subtle flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-app-secondary">Role</span>
              <span className="font-medium capitalize text-app-primary">{item.role}</span>
            </div>

            {canManage && (
              <button onClick={() => openEdit(item.id)} className="btn-secondary mt-4">
                <Pencil size={16} />
                Editar perfil
              </button>
            )}
          </article>
        ))}
      </div>

      <section className="surface-panel p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <ShieldPlus className="text-brand-orange" size={20} />
          <h3 className="text-xl font-semibold tracking-tight text-app-primary">Convites pendentes</h3>
        </div>

        {convitesLoading && <div className="rounded-2xl border border-dashed border-border-subtle px-4 py-4 text-sm text-app-secondary">Carregando convites...</div>}
        {convitesError && <div className="rounded-2xl border border-rose-300/50 bg-rose-500/10 px-4 py-4 text-sm text-rose-700 dark:text-rose-300">Erro ao carregar convites: {convitesErrorData?.message}</div>}

        <div className="space-y-3">
          {(convites || []).length === 0 && !convitesLoading && <div className="text-sm text-app-secondary">Nenhum convite registrado.</div>}
          {(convites || []).map((invite) => (
            <div key={invite.id} className="surface-subtle flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-app-primary">{invite.nome}</p>
                <p className="text-sm text-app-secondary">{invite.email}</p>
                <p className="mt-1 text-xs text-app-muted">
                  Role: {invite.role} | Status: {invite.status} | Expira em: {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {canManage && invite.status === 'pendente' && (
                <button onClick={() => cancelInvite(invite.id)} className="btn-ghost rounded-2xl border border-rose-300/50 px-4 text-rose-600 hover:bg-rose-500/10 dark:text-rose-300">
                  Cancelar convite
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="surface-panel w-full max-w-xl p-6 sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-app-primary">Editar perfil</h3>
                <p className="mt-1 text-sm text-app-secondary">A criacao completa do usuario autenticado sera amarrada ao fluxo de aceite do convite.</p>
              </div>
              <ShieldPlus className="text-brand-orange" size={22} />
            </div>

            <div className="space-y-4">
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" className="input-field" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input-field" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="input-field">
                  <option value="usuario">Usuario</option>
                  <option value="gestor">Gestor</option>
                  <option value="admin">Admin</option>
                </select>
                <select value={rowStatus} onChange={(e) => setRowStatus(e.target.value as typeof rowStatus)} className="input-field">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => setEditingId(null)} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={savePerfil} disabled={saving} className="btn-primary">
                {saving ? 'Salvando...' : 'Salvar alteracoes'}
              </button>
            </div>
          </div>
        </div>
      )}
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
