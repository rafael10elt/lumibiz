import { Suspense, lazy, type ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
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

  if (loading) {
    return <FullScreenLoader />;
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : withSuspense(<Login />)} />
      <Route path="/*" element={session ? <PrivateRoutes /> : <Navigate to="/login" replace />} />
    </Routes>
  );
};

const SuperAdminGuard = ({ children }: { children: ReactElement }) => {
  const { perfil } = useAuth();

  if (perfil?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const PrivateRoutes = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route index element={withSuspense(<DashboardPage />)} />
      <Route path="/perfil" element={withSuspense(<PerfilPage />)} />
      <Route path="/rh" element={withSuspense(<RHPage />)} />
      <Route path="/visitas" element={withSuspense(<VisitasPage />)} />
      <Route path="/requisicoes" element={withSuspense(<RequisicoesPage />)} />
      <Route path="/financeiro" element={withSuspense(<FinanceiroPage />)} />
      <Route path="/clientes" element={withSuspense(<ClientesPage />)} />
      <Route path="/reembolsos" element={withSuspense(<ReembolsosPage />)} />
      <Route path="/validades" element={withSuspense(<ValidadesPage />)} />
      <Route path="/servicos" element={withSuspense(<ServicosPage />)} />
      <Route path="/chamados" element={withSuspense(<ChamadosPage />)} />
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
