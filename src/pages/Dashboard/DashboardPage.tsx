import { useMemo, useState } from 'react';
import { FileText, Lightbulb } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useChamados, useClientes, useCustos, useReceitas, useVisitas } from '../../hooks/useLumiBiz';
import { formatCurrency, formatDate } from '../../lib/utils';

type DashboardTab = 'balanco' | 'receitas' | 'custos' | 'visitas';
type Period = 'week' | 'month' | 'year';

const startOfPeriod = (period: Period) => {
  const today = new Date();
  const base = new Date(today);

  if (period === 'week') base.setDate(today.getDate() - 7);
  if (period === 'month') base.setMonth(today.getMonth() - 1);
  if (period === 'year') base.setFullYear(today.getFullYear() - 1);

  return base.toISOString().slice(0, 10);
};

export function DashboardPage() {
  const [tab, setTab] = useState<DashboardTab>('balanco');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showInsights, setShowInsights] = useState(false);
  const { data: clientes } = useClientes();
  const { data: visitas } = useVisitas();
  const { data: receitas } = useReceitas();
  const { data: custos } = useCustos();
  const { data: chamados } = useChamados();

  const receitasFiltradas = useMemo(
    () =>
      (receitas || []).filter((item) => {
        const okStatus = !statusFilter || item.status === statusFilter;
        const okStart = !startDate || item.data_lancamento >= startDate;
        const okEnd = !endDate || item.data_lancamento <= endDate;
        return okStatus && okStart && okEnd;
      }),
    [receitas, statusFilter, startDate, endDate]
  );

  const custosFiltrados = useMemo(
    () =>
      (custos || []).filter((item) => {
        const okStatus = !statusFilter || item.status === statusFilter;
        const okStart = !startDate || item.data_lancamento >= startDate;
        const okEnd = !endDate || item.data_lancamento <= endDate;
        return okStatus && okStart && okEnd;
      }),
    [custos, statusFilter, startDate, endDate]
  );

  const visitasFiltradas = useMemo(
    () =>
      (visitas || []).filter((item) => {
        const okStart = !startDate || item.data_visita >= startDate;
        const okEnd = !endDate || item.data_visita <= endDate;
        return okStart && okEnd;
      }),
    [visitas, startDate, endDate]
  );

  const resumo = useMemo(() => {
    const totalReceitas = receitasFiltradas.reduce((sum, item) => sum + Number(item.valor || 0), 0);
    const totalCustos = custosFiltrados.reduce((sum, item) => sum + Number(item.valor || 0), 0);
    const receitasPendentes = receitasFiltradas
      .filter((item) => String(item.status).toLowerCase() === 'pendente')
      .reduce((sum, item) => sum + Number(item.valor || 0), 0);
    const custosPendentes = custosFiltrados
      .filter((item) => String(item.status).toLowerCase() === 'pendente')
      .reduce((sum, item) => sum + Number(item.valor || 0), 0);

    return {
      totalReceitas,
      totalCustos,
      saldo: totalReceitas - totalCustos,
      receitasPendentes,
      custosPendentes,
      chamadosAbertos: (chamados || []).filter((item) => item.status === 'aberto').length
    };
  }, [receitasFiltradas, custosFiltrados, chamados]);

  const mensal = useMemo(() => {
    const map = new Map<string, { mes: string; receitas: number; custos: number }>();

    for (const item of receitasFiltradas) {
      const mes = item.data_lancamento.slice(0, 7);
      const current = map.get(mes) || { mes, receitas: 0, custos: 0 };
      current.receitas += Number(item.valor || 0);
      map.set(mes, current);
    }

    for (const item of custosFiltrados) {
      const mes = item.data_lancamento.slice(0, 7);
      const current = map.get(mes) || { mes, receitas: 0, custos: 0 };
      current.custos += Number(item.valor || 0);
      map.set(mes, current);
    }

    return Array.from(map.values())
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .map((item) => ({ ...item, mes: item.mes.slice(5, 7) + '/' + item.mes.slice(2, 4) }));
  }, [receitasFiltradas, custosFiltrados]);

  const rankingReceitas = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of receitasFiltradas) {
      const key = item.cliente_id || 'sem-cliente';
      map.set(key, (map.get(key) || 0) + Number(item.valor || 0));
    }

    return Array.from(map.entries())
      .map(([clienteId, valor]) => ({
        nome: clientes?.find((item) => item.id === clienteId)?.nome || 'Sem cliente',
        valor
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [clientes, receitasFiltradas]);

  const rankingCustos = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of custosFiltrados) {
      const key = item.categoria || 'Sem categoria';
      map.set(key, (map.get(key) || 0) + Number(item.valor || 0));
    }

    return Array.from(map.entries())
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [custosFiltrados]);

  const visitasResumo = useMemo(
    () => ({
      agendadas: visitasFiltradas.filter((item) => item.status === 'Agendada').length,
      andamento: visitasFiltradas.filter((item) => item.status === 'Em Andamento').length,
      concluidas: visitasFiltradas.filter((item) => item.status === 'Concluída').length
    }),
    [visitasFiltradas]
  );

  const insights = [
    `Saldo do periodo: ${formatCurrency(resumo.saldo)}.`,
    rankingReceitas[0]
      ? `Cliente com maior receita: ${rankingReceitas[0].nome} com ${formatCurrency(rankingReceitas[0].valor)}.`
      : 'Nenhuma receita no periodo.',
    rankingCustos[0]
      ? `Maior concentracao de custo: ${rankingCustos[0].nome} com ${formatCurrency(rankingCustos[0].valor)}.`
      : 'Nenhum custo no periodo.',
    `Visitas concluidas no periodo: ${visitasResumo.concluidas}.`
  ];

  const exportReport = () => {
    const payload = {
      periodo: { statusFilter, startDate, endDate },
      resumo,
      visitas: visitasResumo,
      geradoEm: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `dashboard-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-300">Visao geral e metricas chave do sistema.</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <button onClick={() => setShowInsights(true)} className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-white shadow hover:bg-yellow-600">
            <Lightbulb size={18} />
            Gerar Insights
          </button>
          <button onClick={exportReport} className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white shadow hover:bg-blue-600">
            <FileText size={18} />
            Gerar Relatorio
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap -mb-px text-sm font-medium">
          {[
            ['balanco', 'Balanco'],
            ['receitas', 'Receitas'],
            ['custos', 'Custos'],
            ['visitas', 'Visitas']
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value as DashboardTab)}
              className={`rounded-t-lg border-b-2 px-4 py-3 ${
                tab === value ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-600 hover:border-gray-300 dark:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700">
              <option value="">Todos</option>
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="lancado">Lancado</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">De</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Ate</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700" />
          </div>
          <div className="flex items-end justify-start gap-2 lg:justify-end">
            <button onClick={() => setStartDate(startOfPeriod('week'))} className="rounded-md bg-gray-200 px-3 py-2 text-sm dark:bg-gray-600">Semana</button>
            <button onClick={() => setStartDate(startOfPeriod('month'))} className="rounded-md bg-gray-200 px-3 py-2 text-sm dark:bg-gray-600">Mes</button>
            <button onClick={() => setStartDate(startOfPeriod('year'))} className="rounded-md bg-gray-200 px-3 py-2 text-sm dark:bg-gray-600">Ano</button>
          </div>
        </div>
      </div>

      {tab === 'balanco' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard title="Balanco Financeiro" value={formatCurrency(resumo.saldo)} color="text-green-500" />
            <MetricCard title="Total de Receitas" value={formatCurrency(resumo.totalReceitas)} color="text-blue-500" />
            <MetricCard title="Total de Custos" value={formatCurrency(resumo.totalCustos)} color="text-red-500" />
            <MetricCard title="Receitas Pendentes" value={formatCurrency(resumo.receitasPendentes)} color="text-yellow-500" />
            <MetricCard title="Custos Pendentes" value={formatCurrency(resumo.custosPendentes)} color="text-orange-500" />
            <MetricCard title="Chamados em aberto" value={String(resumo.chamadosAbertos)} color="text-brand-dark dark:text-white" />
          </div>

          <Panel title="Receitas vs. Custos por Mes">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={mensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value || 0))} />
                <Legend />
                <Bar dataKey="receitas" fill="#5b8def" radius={[6, 6, 0, 0]} />
                <Bar dataKey="custos" fill="#f87171" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}

      {tab === 'receitas' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel title="Receitas por Cliente">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={rankingReceitas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" hide />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value || 0))} />
                <Bar dataKey="valor" fill="#5b8def" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Ranking title="Ranking de Clientes" items={rankingReceitas.map((item) => ({ label: item.nome, value: formatCurrency(item.valor) }))} />
        </div>
      )}

      {tab === 'custos' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel title="Custos por Categoria">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={rankingCustos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" hide />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value || 0))} />
                <Bar dataKey="valor" fill="#f87171" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Ranking title="Ranking de Custos" items={rankingCustos.map((item) => ({ label: item.nome, value: formatCurrency(item.valor) }))} />
        </div>
      )}

      {tab === 'visitas' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-2">
            <MetricCard title="Agendadas" value={String(visitasResumo.agendadas)} color="text-blue-500" />
            <MetricCard title="Em andamento" value={String(visitasResumo.andamento)} color="text-yellow-500" />
            <MetricCard title="Concluidas" value={String(visitasResumo.concluidas)} color="text-green-500" />
          </div>
          <Panel title="Ultimas Visitas">
            <div className="space-y-3">
              {visitasFiltradas.slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-100 p-4 dark:border-gray-700">
                  <p className="font-semibold text-gray-900 dark:text-white">{item.clientes?.nome || 'Cliente sem nome'}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {(item.perfis?.nome || 'Sem usuario') + ' - ' + formatDate(item.data_visita)}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
          <Ranking
            title="Resumo de visitas"
            items={[
              { label: 'Agendadas', value: String(visitasResumo.agendadas) },
              { label: 'Em andamento', value: String(visitasResumo.andamento) },
              { label: 'Concluidas', value: String(visitasResumo.concluidas) }
            ]}
          />
        </div>
      )}

      {showInsights && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Insights do Dashboard</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Gerado a partir dos dados filtrados.</p>
              </div>
              <button onClick={() => setShowInsights(false)} className="rounded-full px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">Fechar</button>
            </div>
            <div className="space-y-3">
              {insights.map((item) => (
                <div key={item} className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow dark:bg-gray-800">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
      <p className={`mt-3 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow dark:bg-gray-800">
      <h4 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">{title}</h4>
      {children}
    </div>
  );
}

function Ranking({ title, items }: { title: string; items: Array<{ label: string; value: string }> }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow dark:bg-gray-800">
      <h4 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">{title}</h4>
      <ul className="space-y-3">
        {items.length === 0 && <li className="text-sm text-gray-500">Nenhum dado para o periodo.</li>}
        {items.map((item) => (
          <li key={`${item.label}-${item.value}`} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-900/50">
            <span className="font-medium text-gray-800 dark:text-white">{item.label}</span>
            <span className="text-sm text-gray-500 dark:text-gray-300">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
