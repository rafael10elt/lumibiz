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
  '/superadmin/planos': 'Planos',
  '/superadmin/tenants': 'Tenants'
};

export function AppLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const currentPageTitle = pageTitles[location.pathname] || 'LumiBiz';

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
      {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-20 bg-black/50 lg:hidden" />}

      <div
        className={`fixed inset-y-0 left-0 z-30 transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar toggleSidebar={() => setSidebarOpen((current) => !current)} pageTitle={currentPageTitle} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
