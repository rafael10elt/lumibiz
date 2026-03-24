import { NavLink } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  CalendarCheck,
  ClipboardList,
  Cog,
  Handshake,
  Headset,
  LayoutDashboard,
  Receipt,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { BrandMark } from './BrandMark';

const baseLinks = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/perfil', icon: UserCog, label: 'Perfil' },
  { to: '/rh', icon: Briefcase, label: 'RH' },
  { to: '/visitas', icon: CalendarCheck, label: 'Visitas' },
  { to: '/requisicoes', icon: ClipboardList, label: 'Requisicoes' },
  { to: '/financeiro', icon: Wallet, label: 'Financeiro' },
  { to: '/clientes', icon: Handshake, label: 'Clientes' },
  { to: '/reembolsos', icon: Receipt, label: 'Reembolsos' },
  { to: '/validades', icon: ShieldCheck, label: 'Validades' },
  { to: '/servicos', icon: Cog, label: 'Servicos' },
  { to: '/chamados', icon: Headset, label: 'Chamados' }
];

const superAdminLinks = [
  { to: '/superadmin/tenants', icon: Building2, label: 'Tenants' },
  { to: '/superadmin/planos', icon: SlidersHorizontal, label: 'Planos' },
  ...baseLinks
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { perfil } = useAuth();
  const links = perfil?.role === 'super_admin' ? superAdminLinks : baseLinks;

  return (
    <aside className="flex h-full w-[18.5rem] flex-col gap-6 border-r border-border-subtle/60 bg-[rgba(var(--surface-panel),0.92)] px-4 py-5 text-app-primary shadow-panel backdrop-blur xl:w-80">
      <BrandMark />

      <div className="surface-subtle px-4 py-3">
        <p className="text-xs uppercase tracking-[0.24em] text-app-muted">Workspace</p>
        <p className="mt-2 text-sm font-semibold text-app-primary">{perfil?.tenants?.nome_fantasia || 'Tenant atual'}</p>
        <p className="mt-1 text-xs capitalize text-app-secondary">{perfil?.role || 'usuario'}</p>
      </div>

      <nav className="flex w-full flex-1 flex-col gap-2 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            title={link.label}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 transition-all duration-200',
                'border border-transparent text-app-secondary hover:border-brand-blue/20 hover:bg-surface-muted hover:text-app-primary',
                isActive && 'border-brand-blue/20 bg-gradient-to-r from-brand-blue/10 to-brand-orange/10 text-app-primary shadow-soft'
              )
            }
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-elevated text-brand-blue transition group-hover:bg-white dark:group-hover:bg-slate-800">
              <link.icon size={20} />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold">{link.label}</span>
              <span className="block truncate text-xs text-app-muted">
                {link.to.startsWith('/superadmin') ? 'Gestao global' : 'Modulo operacional'}
              </span>
            </div>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
