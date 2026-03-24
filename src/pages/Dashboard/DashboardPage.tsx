import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, CalendarRange, FileText, Lightbulb, Target, WalletCards } from 'lucide-react';
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
import { useAuth } from '../../contexts/AuthContext';
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
  const { perfil } = useAuth();
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
    const printWindow = window.open('', '_blank', 'width=960,height=720');
    if (!printWindow) return;

    const generatedAt = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date());

    const html = `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Relatorio LumiBiz</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; margin: 32px; }
            h1, h2 { margin: 0 0 12px; }
            p { margin: 0 0 8px; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 24px 0; }
            .card { border: 1px solid #cbd5e1; border-radius: 16px; padding: 16px; }
            .muted { color: #475569; }
            ul { padding-left: 18px; }
          </style>
        </head>
        <body>
          ${perfil?.tenants?.logo_url ? `<img src="${perfil.tenants.logo_url}" alt="Logo do tenant" style="width:72px;height:72px;object-fit:cover;border-radius:16px;margin-bottom:16px;" />` : ''}
          <h1>Relatorio do Dashboard LumiBiz</h1>
          <p><strong>Tenant:</strong> ${perfil?.tenants?.nome_fantasia || 'Tenant atual'}</p>
          <p class="muted">Gerado em ${generatedAt}</p>
          <p class="muted">Periodo: ${startDate || 'inicio livre'} ate ${endDate || 'fim livre'}</p>
          <div class="grid">
            <div class="card"><h2>Saldo</h2><p>${formatCurrency(resumo.saldo)}</p></div>
            <div class="card"><h2>Receitas</h2><p>${formatCurrency(resumo.totalReceitas)}</p></div>
            <div class="card"><h2>Custos</h2><p>${formatCurrency(resumo.totalCustos)}</p></div>
            <div class="card"><h2>Chamados abertos</h2><p>${resumo.chamadosAbertos}</p></div>
          </div>
          <h2>Resumo de visitas</h2>
          <ul>
            <li>Agendadas: ${visitasResumo.agendadas}</li>
            <li>Em andamento: ${visitasResumo.andamento}</li>
            <li>Concluidas: ${visitasResumo.concluidas}</li>
          </ul>
          <h2>Insights</h2>
          <ul>${insights.map((item) => `<li>${item}</li>`).join('')}</ul>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-brand-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue dark:text-blue-200">
            <WalletCards size={14} />
            Panorama executivo
          </span>
          <h2 className="section-title mt-4">Visao geral do tenant em tempo real</h2>
          <p className="section-copy">
            Acompanhe balanco, produtividade e saude operacional com filtros rapidos e graficos mais legiveis em qualquer tema.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button onClick={() => setShowInsights(true)} className="btn-accent">
            <Lightbulb size={18} />
            Gerar insights
          </button>
          <button onClick={exportReport} className="btn-primary">
            <FileText size={18} />
            Gerar relatorio
          </button>
        </div>
      </section>

      <section className="surface-panel p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
          {[
            ['balanco', 'Balanco'],
            ['receitas', 'Receitas'],
            ['custos', 'Custos'],
            ['visitas', 'Visitas']
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value as DashboardTab)}
              className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === value
                  ? 'bg-gradient-to-r from-brand-blue to-brand-blue-deep text-white shadow-glow'
                  : 'text-app-secondary hover:bg-surface-muted hover:text-app-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="surface-panel p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_1fr_auto]">
          <Field label="Status">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field">
              <option value="">Todos</option>
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="lancado">Lancado</option>
            </select>
          </Field>

          <Field label="De">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
          </Field>

          <Field label="Ate">
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
          </Field>

          <div className="flex flex-wrap items-end gap-2">
            <button onClick={() => setStartDate(startOfPeriod('week'))} className="btn-secondary px-4">
              Semana
            </button>
            <button onClick={() => setStartDate(startOfPeriod('month'))} className="btn-secondary px-4">
              Mes
            </button>
            <button onClick={() => setStartDate(startOfPeriod('year'))} className="btn-secondary px-4">
              Ano
            </button>
          </div>
        </div>
      </section>

      {tab === 'balanco' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            <MetricCard title="Balanco financeiro" value={formatCurrency(resumo.saldo)} accent="success" icon={<Target size={18} />} />
            <MetricCard title="Total de receitas" value={formatCurrency(resumo.totalReceitas)} accent="info" icon={<ArrowUpRight size={18} />} />
            <MetricCard title="Total de custos" value={formatCurrency(resumo.totalCustos)} accent="danger" icon={<ArrowDownRight size={18} />} />
            <MetricCard title="Receitas pendentes" value={formatCurrency(resumo.receitasPendentes)} accent="warning" icon={<CalendarRange size={18} />} />
            <MetricCard title="Custos pendentes" value={formatCurrency(resumo.custosPendentes)} accent="amber" icon={<CalendarRange size={18} />} />
            <MetricCard title="Chamados em aberto" value={String(resumo.chamadosAbertos)} accent="neutral" icon={<FileText size={18} />} />
          </div>

          <Panel title="Receitas vs. custos por mes" subtitle="Comparativo consolidado das movimentacoes financeiras filtradas.">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={mensal} barGap={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" vertical={false} />
                <XAxis dataKey="mes" stroke="rgb(148,163,184)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgb(148,163,184)" tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                  formatter={(value) => formatCurrency(Number(value || 0))}
                  contentStyle={{
                    borderRadius: 18,
                    border: '1px solid rgba(148,163,184,0.18)',
                    background: 'rgba(15,23,42,0.92)',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Bar dataKey="receitas" fill="#0D8BD8" radius={[10, 10, 0, 0]} />
                <Bar dataKey="custos" fill="#FF9B17" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}

      {tab === 'receitas' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <Panel title="Receitas por cliente" subtitle="Ranking dos clientes com maior participacao no faturamento.">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={rankingReceitas}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" vertical={false} />
                <XAxis dataKey="nome" hide />
                <YAxis stroke="rgb(148,163,184)" tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value || 0))}
                  contentStyle={{
                    borderRadius: 18,
                    border: '1px solid rgba(148,163,184,0.18)',
                    background: 'rgba(15,23,42,0.92)',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="valor" fill="#0D8BD8" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Ranking title="Top clientes" items={rankingReceitas.map((item) => ({ label: item.nome, value: formatCurrency(item.valor) }))} />
        </div>
      )}

      {tab === 'custos' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <Panel title="Custos por categoria" subtitle="Onde o tenant concentra maior esforco financeiro.">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={rankingCustos}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" vertical={false} />
                <XAxis dataKey="nome" hide />
                <YAxis stroke="rgb(148,163,184)" tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value || 0))}
                  contentStyle={{
                    borderRadius: 18,
                    border: '1px solid rgba(148,163,184,0.18)',
                    background: 'rgba(15,23,42,0.92)',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="valor" fill="#FF9B17" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Ranking title="Top centros de custo" items={rankingCustos.map((item) => ({ label: item.nome, value: formatCurrency(item.valor) }))} />
        </div>
      )}

      {tab === 'visitas' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.9fr]">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MetricCard title="Agendadas" value={String(visitasResumo.agendadas)} accent="info" icon={<CalendarRange size={18} />} />
              <MetricCard title="Em andamento" value={String(visitasResumo.andamento)} accent="warning" icon={<Target size={18} />} />
              <MetricCard title="Concluidas" value={String(visitasResumo.concluidas)} accent="success" icon={<Target size={18} />} />
            </div>

            <Panel title="Ultimas visitas" subtitle="Compromissos mais recentes dentro do periodo filtrado.">
              <div className="space-y-3">
                {visitasFiltradas.length === 0 && <EmptyState>Nenhuma visita encontrada no periodo selecionado.</EmptyState>}
                {visitasFiltradas.slice(0, 6).map((item) => (
                  <div key={item.id} className="surface-subtle p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-app-primary">{item.clientes?.nome || 'Cliente sem nome'}</p>
                        <p className="mt-1 text-sm text-app-secondary">{item.perfis?.nome || 'Sem usuario'}</p>
                      </div>
                      <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-app-secondary dark:bg-slate-800/80">
                        {formatDate(item.data_visita)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-border-subtle bg-white p-6 text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-white sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Insights do dashboard</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Leitura automatica a partir do recorte filtrado.</p>
              </div>
              <button onClick={() => setShowInsights(false)} className="btn-ghost">
                Fechar
              </button>
            </div>
            <div className="space-y-3">
              {insights.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-100">
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-app-primary">{label}</label>
      {children}
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  accent
}: {
  title: string;
  value: string;
  icon: ReactNode;
  accent: 'success' | 'info' | 'danger' | 'warning' | 'amber' | 'neutral';
}) {
  const accentMap = {
    success: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
    info: 'bg-brand-blue/12 text-brand-blue dark:text-blue-200',
    danger: 'bg-rose-500/12 text-rose-600 dark:text-rose-300',
    warning: 'bg-yellow-500/12 text-yellow-600 dark:text-yellow-300',
    amber: 'bg-brand-orange/12 text-brand-orange dark:text-orange-200',
    neutral: 'bg-slate-500/12 text-slate-700 dark:text-slate-200'
  };

  return (
    <div className="metric-tile">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-app-secondary">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-app-primary">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accentMap[accent]}`}>{icon}</div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="surface-panel p-5 sm:p-6">
      <div className="mb-5">
        <h4 className="text-lg font-semibold tracking-tight text-app-primary">{title}</h4>
        {subtitle ? <p className="mt-1 text-sm text-app-secondary">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Ranking({ title, items }: { title: string; items: Array<{ label: string; value: string }> }) {
  return (
    <div className="surface-panel p-5 sm:p-6">
      <h4 className="text-lg font-semibold tracking-tight text-app-primary">{title}</h4>
      <ul className="mt-5 space-y-3">
        {items.length === 0 && <EmptyState>Nenhum dado para o periodo.</EmptyState>}
        {items.map((item, index) => (
          <li key={`${item.label}-${item.value}`} className="surface-subtle flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-orange text-xs font-bold text-white">
                {index + 1}
              </div>
              <span className="font-medium text-app-primary">{item.label}</span>
            </div>
            <span className="text-sm font-semibold text-app-secondary">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="surface-subtle px-4 py-5 text-sm text-app-secondary">{children}</div>;
}
