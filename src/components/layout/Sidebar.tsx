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
    <aside className="flex h-full w-64 flex-col items-center bg-brand-dark py-4 text-white lg:w-20">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg border-2 border-brand-gold/50 bg-gradient-to-br from-gray-700 to-gray-800 shadow-lg">
        <span className="text-3xl font-bold text-brand-gold">L</span>
      </div>

      <nav className="flex w-full flex-1 flex-col items-stretch gap-2 overflow-y-auto px-3 lg:items-center lg:px-0">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            title={link.label}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex h-12 w-full items-center gap-3 rounded-lg px-3 transition-colors lg:w-12 lg:justify-center lg:px-0',
                'text-gray-400 hover:bg-brand-gold hover:text-white',
                isActive && 'bg-brand-gold text-white'
              )
            }
          >
            <link.icon size={22} />
            <span className="text-base lg:hidden">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
