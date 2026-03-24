import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BadgeHelp,
  Briefcase,
  Building2,
  CalendarCheck,
  ClipboardList,
  Cog,
  Settings,
  CreditCard,
  Handshake,
  Headset,
  LayoutDashboard,
  LockKeyhole,
  Receipt,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenantAssinatura, useTenantModulos } from '../../hooks/useLumiBiz';
import { getBillingAccessState, normalizeRole } from '../../lib/support';
import { cn } from '../../lib/utils';
import { BrandMark } from './BrandMark';

const baseLinks = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', module: 'dashboard' },
  { to: '/perfil', icon: UserCog, label: 'Perfil', module: 'perfil' },
  { to: '/rh', icon: Briefcase, label: 'RH', module: 'rh' },
  { to: '/visitas', icon: CalendarCheck, label: 'Visitas', module: 'visitas' },
  { to: '/requisicoes', icon: ClipboardList, label: 'Requisicoes', module: 'requisicoes' },
  { to: '/financeiro', icon: Wallet, label: 'Financeiro', module: 'financeiro' },
  { to: '/clientes', icon: Handshake, label: 'Clientes', module: 'clientes' },
  { to: '/reembolsos', icon: Receipt, label: 'Reembolsos', module: 'reembolsos' },
  { to: '/validades', icon: ShieldCheck, label: 'Validades', module: 'validades' },
  { to: '/servicos', icon: Cog, label: 'Servicos', module: 'servicos' },
  { to: '/chamados', icon: Headset, label: 'Chamados', module: 'chamados' }
];

const supportLinks = [
  { to: '/configuracoes', icon: Settings, label: 'Configuracoes', roles: ['admin', 'super_admin'] },
  { to: '/assinatura', icon: CreditCard, label: 'Assinatura', roles: ['admin', 'super_admin'] },
  { to: '/ajuda', icon: BadgeHelp, label: 'Ajuda' },
  { to: '/seguranca', icon: LockKeyhole, label: 'Seguranca' }
];

const superAdminLinks = [
  { to: '/superadmin', icon: LayoutDashboard, label: 'Dashboard SaaS' },
  { to: '/superadmin/assinaturas', icon: CreditCard, label: 'Assinaturas SaaS' },
  { to: '/superadmin/tenants', icon: Building2, label: 'Tenants' },
  { to: '/superadmin/planos', icon: SlidersHorizontal, label: 'Planos' }
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { perfil } = useAuth();
  const { data: modulos } = useTenantModulos(perfil?.tenant_id || undefined);
  const { data: assinatura } = useTenantAssinatura(perfil?.tenant_id || undefined);

  const moduleMap = new Map((modulos || []).map((item) => [item.modulo, item.enabled]));
  const billing = getBillingAccessState(assinatura?.proximo_vencimento);
  const normalizedRole = normalizeRole(perfil?.role);

  const operationalLinks =
    normalizedRole === 'super_admin'
      ? baseLinks
      : billing.isRestricted
        ? []
        : baseLinks.filter((link) => moduleMap.get(link.module) !== false);

  const visibleSupportLinks = supportLinks.filter((link) => {
    if (billing.isRestricted) {
      return (
        link.to === '/ajuda' ||
        ((link.to === '/assinatura' || link.to === '/configuracoes') && ['admin', 'super_admin'].includes(normalizedRole))
      );
    }
    return !link.roles || link.roles.includes(normalizedRole);
  });

  const tenantName = normalizedRole === 'super_admin' ? 'Painel SaaS' : perfil?.tenants?.nome_fantasia || 'Tenant atual';
  const roleLabel =
    normalizedRole === 'super_admin'
      ? 'Super Admin'
      : normalizedRole === 'admin'
        ? 'Admin'
        : normalizedRole === 'gestor'
          ? 'Gestor'
          : 'Usuario';

  return (
    <aside className="flex h-full w-[18.5rem] flex-col gap-6 border-r border-border-subtle/60 bg-[rgba(var(--surface-panel),0.92)] px-4 py-5 text-app-primary shadow-panel backdrop-blur xl:w-80">
      <BrandMark logoUrl={perfil?.tenants?.logo_url || null} />

      <div className="surface-subtle px-4 py-3">
        <p className="text-xs uppercase tracking-[0.24em] text-app-muted">Workspace</p>
        <p className="mt-2 text-base font-semibold text-app-primary">{tenantName}</p>
        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-app-muted">{roleLabel}</p>
      </div>

      {normalizedRole === 'super_admin' && (
        <div className="space-y-3">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-app-muted">Gestao do SaaS</p>
          <nav className="flex w-full flex-col gap-2">
            {superAdminLinks.map((link) => (
              <SidebarLink key={link.to} {...link} onNavigate={onNavigate} subtitle="Acesso exclusivo do super admin" />
            ))}
          </nav>
        </div>
      )}

      {billing.isRestricted && normalizedRole !== 'super_admin' && (
        <div className="surface-subtle px-4 py-4 text-sm text-app-secondary">
          Algumas areas deste ambiente estao temporariamente indisponiveis.
        </div>
      )}

      <nav className="flex w-full flex-1 flex-col gap-2 overflow-y-auto">
        {operationalLinks.map((link) => (
          <SidebarLink key={link.to} {...link} onNavigate={onNavigate} />
        ))}
      </nav>

      <nav className="flex w-full flex-col gap-2 border-t border-border-subtle pt-4">
        {visibleSupportLinks.map((link) => (
          <SidebarLink key={link.to} {...link} onNavigate={onNavigate} subtitle={link.to === '/assinatura' ? 'Gestao da assinatura do tenant' : undefined} />
        ))}
      </nav>
    </aside>
  );
}

function SidebarLink({
  to,
  icon: Icon,
  label,
  subtitle,
  onNavigate
}: {
  to: string;
  icon: ComponentType<{ size?: number }>;
  label: string;
  subtitle?: string;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={to === '/' || to === '/superadmin'}
      title={label}
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
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <span className="block truncate text-sm font-semibold">{label}</span>
        {subtitle ? <span className="block truncate text-xs text-app-muted">{subtitle}</span> : null}
      </div>
    </NavLink>
  );
}
