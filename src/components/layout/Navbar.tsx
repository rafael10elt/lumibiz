import { useState } from 'react';
import { LogOut, Menu, MoonStar, PanelLeftClose, PanelLeftOpen, SunMedium } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getFirstName } from '../../lib/utils';
import { BrandMark } from './BrandMark';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface NavbarProps {
  pageTitle: string;
  isDesktopSidebarOpen: boolean;
  toggleMobileSidebar: () => void;
  toggleDesktopSidebar: () => void;
}

export function Navbar({ pageTitle, isDesktopSidebarOpen, toggleMobileSidebar, toggleDesktopSidebar }: NavbarProps) {
  const { perfil, user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const initials = (perfil?.nome || 'LB')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join('');
  const displayName = getFirstName(perfil?.nome || user?.user_metadata?.nome || 'Usuario') || 'Usuario';

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border-subtle/60 bg-[rgba(var(--app-bg),0.72)] px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <BrandMark compact logoUrl={perfil?.tenants?.logo_url || null} />
          </div>

          <button onClick={toggleMobileSidebar} className="btn-ghost h-12 w-12 rounded-2xl border border-border-subtle bg-surface-panel lg:hidden" aria-label="Abrir menu">
            <Menu size={20} />
          </button>

          <div className="hidden lg:block">
            <button
              onClick={toggleDesktopSidebar}
              className="btn-ghost h-12 w-12 rounded-2xl border border-border-subtle bg-surface-panel"
              aria-label={isDesktopSidebarOpen ? 'Ocultar menu lateral' : 'Mostrar menu lateral'}
              title={isDesktopSidebarOpen ? 'Ocultar menu lateral' : 'Mostrar menu lateral'}
            >
              {isDesktopSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
          </div>

          <div className="min-w-0">
            <p className="truncate text-xl font-semibold tracking-tight text-app-primary sm:text-2xl">{pageTitle}</p>
            <p className="truncate text-sm text-app-secondary">Operacao multitenant com foco em mobilidade e produtividade</p>
          </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="btn-secondary h-12 px-3 sm:px-4"
              title={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
              aria-label="Alternar tema"
            >
              {theme === 'light' ? <MoonStar size={18} /> : <SunMedium size={18} />}
              <span className="hidden sm:inline">{theme === 'light' ? 'Escuro' : 'Claro'}</span>
            </button>

            <div className="hidden items-center gap-3 rounded-3xl border border-border-subtle bg-surface-panel px-3 py-2 shadow-soft md:flex">
              <div className="text-right">
                <p className="text-sm font-semibold text-app-primary">{displayName}</p>
                <p className="text-xs capitalize text-app-muted">{perfil?.role || 'usuario'}</p>
              </div>
              {perfil?.foto_url ? (
                <img className="h-11 w-11 rounded-2xl object-cover" src={perfil.foto_url} alt="Avatar do usuario" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-orange text-sm font-bold text-white">
                  {initials}
                </div>
              )}
            </div>

            <button onClick={() => setConfirmingSignOut(true)} className="btn-secondary h-12 w-12 rounded-2xl px-0" title="Sair">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <ConfirmDialog
        open={confirmingSignOut}
        title="Sair do LumiBiz"
        description="Voce deseja encerrar sua sessao agora?"
        confirmText="Sair"
        confirmVariant="danger"
        onCancel={() => setConfirmingSignOut(false)}
        onConfirm={() => {
          setConfirmingSignOut(false);
          void signOut();
        }}
      />
    </>
  );
}
