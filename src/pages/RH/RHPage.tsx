import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  useAtestados,
  useAtivosColaboradores,
  useEpiEntregas,
  useFerias,
  usePerfis
} from '../../hooks/useLumiBiz';
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
        const matchSearch =
          !search ||
          item.nome?.toLowerCase().includes(search.toLowerCase()) ||
          item.email?.toLowerCase().includes(search.toLowerCase());
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
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Recursos Humanos</h2>
        <p className="text-gray-600 dark:text-gray-300">Estrutura da base Consultoria, usando perfis no lugar de consultores.</p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap -mb-px text-sm font-medium">
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
              className={`rounded-t-lg border-b-2 px-4 py-3 ${
                tab === value ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-600 hover:border-gray-300 dark:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow dark:bg-gray-800 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative flex-1">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar usuario..."
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 dark:border-gray-700 dark:bg-gray-900"
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {usuarios.map((item) => (
              <article key={item.id} className="rounded-2xl bg-white p-5 shadow dark:bg-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.nome || 'Sem nome'}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.email || 'Sem email'}</p>
                <div className="mt-4 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <p>Role: {item.role}</p>
                  <p>Telefone: {item.telefone || '-'}</p>
                  <p>Valor hora: {item.valor_hora ? `R$ ${Number(item.valor_hora).toFixed(2)}` : '-'}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === 'aniversariantes' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {aniversariantes.length === 0 && <div className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow dark:bg-gray-800">Nenhum aniversariante cadastrado para este mes.</div>}
          {aniversariantes.map((item) => (
            <article key={item.id} className="rounded-2xl bg-white p-5 shadow dark:bg-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">{item.nome || 'Sem nome'}</h3>
              <p className="mt-1 text-sm text-brand-gold">{item.data_nascimento || 'Sem data de nascimento'}</p>
            </article>
          ))}
        </div>
      )}

      {(['ferias', 'atestados', 'epis', 'ativos'] as const).includes(tab as 'ferias') && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">
              {tab === 'ferias' ? 'Controle de Ferias' : tab === 'atestados' ? 'Atestados Medicos' : tab === 'epis' ? 'Controle de EPIs' : 'Controle de Ativos'}
            </h3>
            {canManage && (
              <button onClick={saveEntry} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2 text-white shadow hover:bg-[#a98c57] disabled:opacity-60">
                <Plus size={18} />
                {saving ? 'Salvando...' : tab === 'ferias' ? 'Agendar Ferias' : tab === 'atestados' ? 'Novo Atestado' : tab === 'epis' ? 'Nova Entrega' : 'Novo Ativo'}
              </button>
            )}
          </div>

          {canManage && (
            <div className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-4 shadow dark:bg-gray-800 md:grid-cols-2 xl:grid-cols-4">
              <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-700 dark:bg-gray-900">
                <option value="">Selecione um usuario</option>
                {(perfis || [])
                  .filter((item) => item.status === 'ativo')
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome || item.email || item.id}
                    </option>
                  ))}
              </select>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-700 dark:bg-gray-900" />
              <input type="date" value={dataRetorno} onChange={(e) => setDataRetorno(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-700 dark:bg-gray-900" />
              <input
                type="text"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder={tab === 'epis' || tab === 'ativos' ? 'Item' : 'Descricao opcional'}
                className="rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-700 dark:bg-gray-900"
              />
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observacoes"
                className="rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-700 dark:bg-gray-900 md:col-span-2 xl:col-span-4"
              />
            </div>
          )}

          <div className="space-y-3">
            {currentRows.length === 0 && <div className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow dark:bg-gray-800">Nenhum registro nesta aba ainda.</div>}
            {currentRows.map((entry) => (
              <article key={entry.id} className="rounded-2xl bg-white p-5 shadow dark:bg-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{entry.perfis?.nome || entry.perfis?.email || entry.usuario_id}</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Inicio: {'data_inicio' in entry ? entry.data_inicio : entry.data_entrega}
                      {'data_retorno' in entry && entry.data_retorno ? ` | Retorno: ${entry.data_retorno}` : ''}
                      {'data_devolucao' in entry && entry.data_devolucao ? ` | Devolucao: ${entry.data_devolucao}` : ''}
                    </p>
                  </div>
                  {'item' in entry && entry.item && <span className="rounded-full bg-brand-gold/10 px-2.5 py-1 text-sm text-brand-gold">{entry.item}</span>}
                </div>
                {'observacoes' in entry && entry.observacoes && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{entry.observacoes}</p>}
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
