import { Suspense, lazy, type ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { useTenantAssinatura, useTenantModulos } from './hooks/useLumiBiz';
import { getBillingAccessState, normalizeRole, type SaaSModuleSlug } from './lib/support';

const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const ForgotPasswordPage = lazy(() => import('./pages/Auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/Auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const PerfilPage = lazy(() => import('./pages/Perfil/PerfilPage').then((m) => ({ default: m.PerfilPage })));
const RHPage = lazy(() => import('./pages/RH/RHPage').then((m) => ({ default: m.RHPage })));
const VisitasPage = lazy(() => import('./pages/Visitas/VisitasPage').then((m) => ({ default: m.VisitasPage })));
const RequisicoesPage = lazy(() => import('./pages/Requisicoes/RequisicoesPage').then((m) => ({ default: m.RequisicoesPage })));
const FinanceiroPage = lazy(() => import('./pages/Financeiro/FinanceiroPage').then((m) => ({ default: m.FinanceiroPage })));
const ClientesPage = lazy(() => import('./pages/Clientes/ClientesPage').then((m) => ({ default: m.ClientesPage })));
const ReembolsosPage = lazy(() => import('./pages/Reembolsos/ReembolsosPage').then((m) => ({ default: m.ReembolsosPage })));
const ValidadesPage = lazy(() => import('./pages/Validades/ValidadesPage').then((m) => ({ default: m.ValidadesPage })));
const ServicosPage = lazy(() => import('./pages/Servicos/ServicosPage').then((m) => ({ default: m.ServicosPage })));
const ChamadosPage = lazy(() => import('./pages/Chamados/ChamadosPage').then((m) => ({ default: m.ChamadosPage })));
const AjudaPage = lazy(() => import('./pages/Ajuda/AjudaPage').then((m) => ({ default: m.AjudaPage })));
const AssinaturaPage = lazy(() => import('./pages/Assinatura/AssinaturaPage').then((m) => ({ default: m.AssinaturaPage })));
const ConfiguracoesPage = lazy(() => import('./pages/Configuracoes/ConfiguracoesPage').then((m) => ({ default: m.ConfiguracoesPage })));
const SegurancaPage = lazy(() => import('./pages/Conta/SegurancaPage').then((m) => ({ default: m.SegurancaPage })));
const AccessLimitedPage = lazy(() => import('./pages/Conta/AccessLimitedPage').then((m) => ({ default: m.AccessLimitedPage })));
const SaasDashboardPage = lazy(() => import('./pages/SuperAdmin/SaasDashboardPage').then((m) => ({ default: m.SaasDashboardPage })));
const AssinaturasSaasPage = lazy(() => import('./pages/SuperAdmin/AssinaturasSaasPage').then((m) => ({ default: m.AssinaturasSaasPage })));
const TenantsPage = lazy(() => import('./pages/SuperAdmin/TenantsPage').then((m) => ({ default: m.TenantsPage })));
const PlanosPage = lazy(() => import('./pages/SuperAdmin/PlanosPage').then((m) => ({ default: m.PlanosPage })));

const FullScreenLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-app text-app-primary">
    <div className="flex items-center gap-3 rounded-full border border-white/60 bg-white/70 px-5 py-3 shadow-soft backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange/25 border-t-brand-blue" />
      <div>
        <p className="text-sm font-semibold text-app-primary">Carregando LumiBiz</p>
        <p className="text-xs text-app-secondary">Preparando seu ambiente</p>
      </div>
    </div>
  </div>
);

const RouteLoader = () => (
  <div className="flex h-48 items-center justify-center">
    <div className="flex items-center gap-3 rounded-full border border-border-subtle bg-surface-panel px-4 py-3 shadow-soft">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-blue/20 border-t-brand-orange" />
      <span className="text-sm font-medium text-app-secondary">Carregando tela</span>
    </div>
  </div>
);

const withSuspense = (element: ReactElement) => <Suspense fallback={<RouteLoader />}>{element}</Suspense>;

const AppRouter = () => {
  const { session, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : withSuspense(<Login />)} />
      <Route path="/recuperar-senha" element={withSuspense(<ForgotPasswordPage />)} />
      <Route path="/nova-senha" element={withSuspense(<ResetPasswordPage />)} />
      <Route path="/*" element={session ? <PrivateRoutes /> : <Navigate to="/login" replace />} />
    </Routes>
  );
};

const SuperAdminGuard = ({ children }: { children: ReactElement }) => {
  const { perfil } = useAuth();
  if (normalizeRole(perfil?.role) !== 'super_admin') return <Navigate to="/" replace />;
  return children;
};

const TenantAdminGuard = ({ children }: { children: ReactElement }) => {
  const { perfil } = useAuth();
  if (!['admin', 'super_admin'].includes(normalizeRole(perfil?.role))) return <Navigate to="/" replace />;
  return children;
};

const TenantBillingGuard = ({ allowAdminOnly = false, children }: { allowAdminOnly?: boolean; children: ReactElement }) => {
  const { perfil } = useAuth();
  const { data: assinatura, isLoading } = useTenantAssinatura(perfil?.tenant_id || undefined);
  const normalizedRole = normalizeRole(perfil?.role);

  if (normalizedRole === 'super_admin') return children;
  if (isLoading) return <RouteLoader />;

  const billing = getBillingAccessState(assinatura?.proximo_vencimento);
  if (!billing.isRestricted) return children;

  if (allowAdminOnly && normalizedRole === 'admin') return children;
  return <Navigate to="/acesso-limitado" replace />;
};

const ModuleGuard = ({ module, children }: { module: SaaSModuleSlug; children: ReactElement }) => {
  const { perfil } = useAuth();
  const { data: modulos, isLoading: modulosLoading } = useTenantModulos(perfil?.tenant_id || undefined);
  const { data: assinatura, isLoading: assinaturaLoading } = useTenantAssinatura(perfil?.tenant_id || undefined);
  const normalizedRole = normalizeRole(perfil?.role);

  if (normalizedRole === 'super_admin') return children;
  if (modulosLoading || assinaturaLoading) return <RouteLoader />;

  const billing = getBillingAccessState(assinatura?.proximo_vencimento);
  if (billing.isRestricted) {
    if (normalizedRole !== 'admin') return <Navigate to="/acesso-limitado" replace />;
    return <Navigate to="/assinatura" replace />;
  }

  const enabled = modulos?.find((item) => item.modulo === module)?.enabled;
  if (enabled === false) return <Navigate to="/" replace />;

  return children;
};

const PrivateRoutes = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/acesso-limitado" element={withSuspense(<AccessLimitedPage />)} />
      <Route index element={<ModuleGuard module="dashboard">{withSuspense(<DashboardPage />)}</ModuleGuard>} />
      <Route path="/perfil" element={<ModuleGuard module="perfil">{withSuspense(<PerfilPage />)}</ModuleGuard>} />
      <Route path="/rh" element={<ModuleGuard module="rh">{withSuspense(<RHPage />)}</ModuleGuard>} />
      <Route path="/visitas" element={<ModuleGuard module="visitas">{withSuspense(<VisitasPage />)}</ModuleGuard>} />
      <Route path="/requisicoes" element={<ModuleGuard module="requisicoes">{withSuspense(<RequisicoesPage />)}</ModuleGuard>} />
      <Route path="/financeiro" element={<ModuleGuard module="financeiro">{withSuspense(<FinanceiroPage />)}</ModuleGuard>} />
      <Route path="/clientes" element={<ModuleGuard module="clientes">{withSuspense(<ClientesPage />)}</ModuleGuard>} />
      <Route path="/reembolsos" element={<ModuleGuard module="reembolsos">{withSuspense(<ReembolsosPage />)}</ModuleGuard>} />
      <Route path="/validades" element={<ModuleGuard module="validades">{withSuspense(<ValidadesPage />)}</ModuleGuard>} />
      <Route path="/servicos" element={<ModuleGuard module="servicos">{withSuspense(<ServicosPage />)}</ModuleGuard>} />
      <Route path="/chamados" element={<ModuleGuard module="chamados">{withSuspense(<ChamadosPage />)}</ModuleGuard>} />
      <Route path="/ajuda" element={<TenantBillingGuard allowAdminOnly>{withSuspense(<AjudaPage />)}</TenantBillingGuard>} />
      <Route path="/seguranca" element={<TenantBillingGuard>{withSuspense(<SegurancaPage />)}</TenantBillingGuard>} />
      <Route path="/configuracoes" element={<TenantBillingGuard allowAdminOnly><TenantAdminGuard>{withSuspense(<ConfiguracoesPage />)}</TenantAdminGuard></TenantBillingGuard>} />
      <Route path="/assinatura" element={<TenantBillingGuard allowAdminOnly><TenantAdminGuard>{withSuspense(<AssinaturaPage />)}</TenantAdminGuard></TenantBillingGuard>} />
      <Route path="/superadmin" element={<SuperAdminGuard>{withSuspense(<SaasDashboardPage />)}</SuperAdminGuard>} />
      <Route path="/superadmin/assinaturas" element={<SuperAdminGuard>{withSuspense(<AssinaturasSaasPage />)}</SuperAdminGuard>} />
      <Route path="/superadmin/tenants" element={<SuperAdminGuard>{withSuspense(<TenantsPage />)}</SuperAdminGuard>} />
      <Route path="/superadmin/planos" element={<SuperAdminGuard>{withSuspense(<PlanosPage />)}</SuperAdminGuard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
