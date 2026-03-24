import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/perfil': 'Perfil',
  '/rh': 'Recursos Humanos',
  '/visitas': 'Visitas',
  '/requisicoes': 'Requisicoes',
  '/financeiro': 'Financeiro',
  '/clientes': 'Clientes',
  '/reembolsos': 'Reembolsos',
  '/validades': 'Validades',
  '/servicos': 'Servicos',
  '/chamados': 'Chamados',
  '/ajuda': 'Central de Ajuda',
  '/assinatura': 'Assinatura',
  '/configuracoes': 'Configuracoes',
  '/seguranca': 'Seguranca',
  '/superadmin': 'Dashboard SaaS',
  '/superadmin/assinaturas': 'Assinaturas SaaS',
  '/superadmin/planos': 'Planos',
  '/superadmin/tenants': 'Tenants'
};

export function AppLayout() {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const location = useLocation();
  const currentPageTitle = pageTitles[location.pathname] || 'LumiBiz';

  return (
    <div className="flex min-h-screen bg-app text-app-primary">
      {isMobileSidebarOpen && <div onClick={() => setMobileSidebarOpen(false)} className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm lg:hidden" />}

      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 lg:static lg:inset-auto ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDesktopSidebarOpen ? 'lg:block lg:translate-x-0' : 'lg:hidden'}`}
      >
        <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 bg-brand-radial opacity-80" />
        <Navbar
          pageTitle={currentPageTitle}
          isDesktopSidebarOpen={isDesktopSidebarOpen}
          toggleMobileSidebar={() => setMobileSidebarOpen((current) => !current)}
          toggleDesktopSidebar={() => setDesktopSidebarOpen((current) => !current)}
        />
        <main className="page-shell relative z-10 flex-1 overflow-y-auto px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-5 lg:px-8">
          <Outlet />
        </main>
        <footer className="relative z-10 border-t border-border-subtle/60 px-4 py-4 text-xs text-app-muted sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>LumiBiz by Lumitechia</p>
            <p>Gestao SaaS multitenant com foco em operacao, suporte e produtividade.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
