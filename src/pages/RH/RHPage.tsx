import { useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BriefcaseBusiness, Cake, Plus, Search, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAtestados, useAtivosColaboradores, useEpiEntregas, useFerias, usePerfis } from '../../hooks/useLumiBiz';
import { supabase } from '../../lib/supabase';

type RHTab = 'usuarios' | 'aniversariantes' | 'ferias' | 'atestados' | 'epis' | 'ativos';

export function RHPage() {
  const queryClient = useQueryClient();
  const { perfil } = useAuth();
  const { data: perfis } = usePerfis();
  const { data: ferias } = useFerias();
  const { data: atestados } = useAtestados();
  const { data: epis } = useEpiEntregas();
  const { data: ativos } = useAtivosColaboradores();
  const [tab, setTab] = useState<RHTab>('usuarios');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'Todos' | 'ativo' | 'inativo'>('ativo');
  const [usuarioId, setUsuarioId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataRetorno, setDataRetorno] = useState('');
  const [item, setItem] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  const canManage = ['super_admin', 'admin', 'gestor'].includes(perfil?.role || '');

  const usuarios = useMemo(
    () =>
      (perfis || []).filter((item) => {
        const matchSearch = !search || item.nome?.toLowerCase().includes(search.toLowerCase()) || item.email?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = status === 'Todos' || item.status === status;
        return matchSearch && matchStatus;
      }),
    [perfis, search, status]
  );

  const aniversariantes = useMemo(() => {
    const mesAtual = new Date().toISOString().slice(5, 7);
    return (perfis || []).filter((item) => item.data_nascimento?.slice(5, 7) === mesAtual);
  }, [perfis]);

  const resetForm = () => {
    setUsuarioId('');
    setDataInicio('');
    setDataRetorno('');
    setItem('');
    setObservacoes('');
  };

  const saveEntry = async () => {
    if (!perfil?.tenant_id || !usuarioId || !dataInicio) {
      alert('Selecione um usuario e informe a data inicial.');
      return;
    }

    setSaving(true);
    let responseError: string | null = null;

    if (tab === 'ferias') {
      const { error } = await supabase.from('ferias').insert({
        tenant_id: perfil.tenant_id,
        usuario_id: usuarioId,
        data_inicio: dataInicio,
        data_retorno: dataRetorno || dataInicio,
        observacoes: observacoes || null
      } as never);
      responseError = error?.message || null;
    }

    if (tab === 'atestados') {
      const { error } = await supabase.from('atestados').insert({
        tenant_id: perfil.tenant_id,
        usuario_id: usuarioId,
        data_inicio: dataInicio,
        data_retorno: dataRetorno || dataInicio,
        observacoes: observacoes || null
      } as never);
      responseError = error?.message || null;
    }

    if (tab === 'epis') {
      if (!item.trim()) {
        setSaving(false);
        alert('Informe o item do EPI.');
        return;
      }

      const { error } = await supabase.from('epi_entregas').insert({
        tenant_id: perfil.tenant_id,
        usuario_id: usuarioId,
        item: item.trim(),
        quantidade: 1,
        data_entrega: dataInicio,
        observacoes: observacoes || null
      } as never);
      responseError = error?.message || null;
    }

    if (tab === 'ativos') {
      if (!item.trim()) {
        setSaving(false);
        alert('Informe o item do ativo.');
        return;
      }

      const { error } = await supabase.from('ativos_colaboradores').insert({
        tenant_id: perfil.tenant_id,
        usuario_id: usuarioId,
        item: item.trim(),
        data_entrega: dataInicio,
        data_devolucao: dataRetorno || null,
        status: dataRetorno ? 'devolvido' : 'em_uso',
        observacoes: observacoes || null
      } as never);
      responseError = error?.message || null;
    }

    setSaving(false);

    if (responseError) {
      alert(`Erro ao salvar registro: ${responseError}`);
      return;
    }

    resetForm();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['rh', 'ferias'] }),
      queryClient.invalidateQueries({ queryKey: ['rh', 'atestados'] }),
      queryClient.invalidateQueries({ queryKey: ['rh', 'epis'] }),
      queryClient.invalidateQueries({ queryKey: ['rh', 'ativos'] })
    ]);
  };

  const currentRows =
    tab === 'ferias'
      ? ferias || []
      : tab === 'atestados'
        ? atestados || []
        : tab === 'epis'
          ? epis || []
          : tab === 'ativos'
            ? ativos || []
            : [];

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-brand-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue dark:text-blue-200">
            <BriefcaseBusiness size={14} />
            RH operacional
          </span>
          <h2 className="section-title mt-4">Recursos humanos</h2>
          <p className="section-copy">Estrutura inspirada na base Consultoria, agora usando perfis no lugar de consultores.</p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 sm:w-auto">
          <Metric title="Usuarios" value={String(usuarios.length)} icon={<Users size={18} />} tone="info" />
          <Metric title="Aniversariantes" value={String(aniversariantes.length)} icon={<Cake size={18} />} tone="amber" />
          <Metric title="Registros" value={String((ferias || []).length + (atestados || []).length + (epis || []).length + (ativos || []).length)} icon={<ShieldCheck size={18} />} tone="success" />
        </div>
      </section>

      <section className="surface-panel p-4">
        <div className="flex flex-wrap gap-2">
          {[
            ['usuarios', `Usuarios (${usuarios.length})`],
            ['aniversariantes', `Aniversariantes (${aniversariantes.length})`],
            ['ferias', `Ferias (${(ferias || []).length})`],
            ['atestados', `Atestados (${(atestados || []).length})`],
            ['epis', `EPIs (${(epis || []).length})`],
            ['ativos', `Ativos (${(ativos || []).length})`]
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value as RHTab)}
              className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === value ? 'bg-gradient-to-r from-brand-blue to-brand-orange text-white shadow-glow' : 'bg-surface-muted text-app-secondary hover:text-app-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {tab === 'usuarios' && (
        <div className="space-y-4">
          <section className="surface-panel p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <label className="relative flex-1">
                <Search size={18} className="absolute left-3 top-3.5 text-app-muted" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuario..." className="input-field pl-10" />
              </label>
              <div className="flex flex-wrap gap-2">
                {(['Todos', 'ativo', 'inativo'] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setStatus(item)}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      status === item ? 'bg-gradient-to-r from-brand-orange to-brand-orange-deep text-white shadow-soft' : 'bg-surface-muted text-app-secondary hover:text-app-primary'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {usuarios.map((item) => (
              <article key={item.id} className="surface-panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-app-primary">{item.nome || 'Sem nome'}</h3>
                    <p className="mt-1 text-sm text-app-secondary">{item.email || 'Sem email'}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'ativo' ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300' : 'bg-slate-500/12 text-slate-700 dark:text-slate-200'}`}>
                    {item.status || 'ativo'}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3 text-sm text-app-secondary sm:grid-cols-2">
                  <InfoBlock label="Role" value={item.role} />
                  <InfoBlock label="Telefone" value={item.telefone || '-'} />
                  <InfoBlock label="Valor hora" value={item.valor_hora ? `R$ ${Number(item.valor_hora).toFixed(2)}` : '-'} />
                  <InfoBlock label="Nascimento" value={item.data_nascimento || '-'} />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === 'aniversariantes' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {aniversariantes.length === 0 && <div className="surface-panel p-6 text-sm text-app-secondary">Nenhum aniversariante cadastrado para este mes.</div>}
          {aniversariantes.map((item) => (
            <article key={item.id} className="surface-panel p-5">
              <h3 className="font-semibold text-app-primary">{item.nome || 'Sem nome'}</h3>
              <p className="mt-1 text-sm text-app-secondary">{item.email || 'Sem email'}</p>
              <div className="mt-4 inline-flex rounded-full bg-brand-orange/12 px-3 py-1 text-sm font-semibold text-brand-orange dark:text-orange-200">
                {item.data_nascimento || 'Sem data de nascimento'}
              </div>
            </article>
          ))}
        </div>
      )}

      {(['ferias', 'atestados', 'epis', 'ativos'] as const).includes(tab as 'ferias') && (
        <div className="space-y-4">
          <section className="surface-panel p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-app-primary">
                  {tab === 'ferias' ? 'Controle de ferias' : tab === 'atestados' ? 'Atestados medicos' : tab === 'epis' ? 'Controle de EPIs' : 'Controle de ativos'}
                </h3>
                <p className="mt-1 text-sm text-app-secondary">Cadastro rapido para movimentacoes operacionais do colaborador.</p>
              </div>
              {canManage && (
                <button onClick={saveEntry} disabled={saving} className="btn-primary">
                  <Plus size={18} />
                  {saving ? 'Salvando...' : tab === 'ferias' ? 'Agendar ferias' : tab === 'atestados' ? 'Novo atestado' : tab === 'epis' ? 'Nova entrega' : 'Novo ativo'}
                </button>
              )}
            </div>

            {canManage && (
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} className="input-field">
                  <option value="">Selecione um usuario</option>
                  {(perfis || [])
                    .filter((item) => item.status === 'ativo')
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome || item.email || item.id}
                      </option>
                    ))}
                </select>
                <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="input-field" />
                <input type="date" value={dataRetorno} onChange={(e) => setDataRetorno(e.target.value)} className="input-field" />
                <input
                  type="text"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  placeholder={tab === 'epis' || tab === 'ativos' ? 'Item' : 'Descricao opcional'}
                  className="input-field"
                />
                <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observacoes" className="textarea-field md:col-span-2 xl:col-span-4" />
              </div>
            )}
          </section>

          <div className="space-y-3">
            {currentRows.length === 0 && <div className="surface-panel p-6 text-sm text-app-secondary">Nenhum registro nesta aba ainda.</div>}
            {currentRows.map((entry) => (
              <article key={entry.id} className="surface-panel p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-app-primary">{entry.perfis?.nome || entry.perfis?.email || entry.usuario_id}</p>
                    <p className="mt-1 text-sm text-app-secondary">
                      Inicio: {'data_inicio' in entry ? entry.data_inicio : entry.data_entrega}
                      {'data_retorno' in entry && entry.data_retorno ? ` | Retorno: ${entry.data_retorno}` : ''}
                      {'data_devolucao' in entry && entry.data_devolucao ? ` | Devolucao: ${entry.data_devolucao}` : ''}
                    </p>
                  </div>
                  {'item' in entry && entry.item && <span className="rounded-full bg-brand-blue/12 px-3 py-1 text-sm font-semibold text-brand-blue dark:text-blue-200">{entry.item}</span>}
                </div>
                {'observacoes' in entry && entry.observacoes && <p className="mt-4 text-sm leading-6 text-app-secondary">{entry.observacoes}</p>}
              </article>
            ))}
          </div>
        </div>
      )}
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
  tone: 'info' | 'amber' | 'success';
}) {
  const toneMap = {
    info: 'bg-brand-blue/12 text-brand-blue dark:text-blue-200',
    amber: 'bg-brand-orange/12 text-brand-orange dark:text-orange-200',
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

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-subtle p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-app-muted">{label}</p>
      <p className="mt-2 text-sm font-medium text-app-primary">{value}</p>
    </div>
  );
}
