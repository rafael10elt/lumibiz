export const LUMITECHIA_SUPPORT = {
  whatsappNumber: '+5581993166476',
  whatsappDisplay: '+55 81 99316-6476',
  email: 'contato@lumitechia.com'
};

export const BILLING_GRACE_DAYS = 5;

export const SAAS_MODULES = [
  { slug: 'dashboard', label: 'Dashboard' },
  { slug: 'perfil', label: 'Perfil' },
  { slug: 'rh', label: 'RH' },
  { slug: 'visitas', label: 'Visitas' },
  { slug: 'requisicoes', label: 'Requisicoes' },
  { slug: 'financeiro', label: 'Financeiro' },
  { slug: 'clientes', label: 'Clientes' },
  { slug: 'reembolsos', label: 'Reembolsos' },
  { slug: 'validades', label: 'Validades' },
  { slug: 'servicos', label: 'Servicos' },
  { slug: 'chamados', label: 'Chamados' }
] as const;

export type SaaSModuleSlug = (typeof SAAS_MODULES)[number]['slug'];

export function normalizeRole(role?: string | null) {
  return (role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function getBillingAccessState(nextDueDate?: string | null) {
  if (!nextDueDate) {
    return {
      isOverdue: false,
      isGracePeriod: false,
      isRestricted: false,
      overdueDays: 0
    };
  }

  const dueDate = new Date(`${nextDueDate}T00:00:00`);
  const now = new Date();
  const diffMs = now.getTime() - dueDate.getTime();
  const overdueDays = diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;
  const isOverdue = overdueDays > 0;
  const isGracePeriod = isOverdue && overdueDays <= BILLING_GRACE_DAYS;
  const isRestricted = overdueDays > BILLING_GRACE_DAYS;

  return { isOverdue, isGracePeriod, isRestricted, overdueDays };
}
