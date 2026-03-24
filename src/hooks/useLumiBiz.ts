import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

export type Cliente = Database['public']['Tables']['clientes']['Row'];
export type Tenant = Database['public']['Tables']['tenants']['Row'];
export type Plano = Database['public']['Tables']['planos']['Row'];
export type Receita = Database['public']['Tables']['receitas']['Row'];
export type Custo = Database['public']['Tables']['custos']['Row'];
export type Requisicao = Database['public']['Tables']['requisicoes']['Row'];
export type ItemCatalogo = Database['public']['Tables']['itens_catalogo']['Row'];
export type Reembolso = Database['public']['Tables']['reembolsos']['Row'];
export type Validade = Database['public']['Tables']['validades']['Row'];
export type Servico = Database['public']['Tables']['servicos']['Row'];
export type Chamado = Database['public']['Tables']['chamados']['Row'];
export type Perfil = Database['public']['Tables']['perfis']['Row'];
export type Ferias = Database['public']['Tables']['ferias']['Row'];
export type Atestado = Database['public']['Tables']['atestados']['Row'];
export type EpiEntrega = Database['public']['Tables']['epi_entregas']['Row'];
export type AtivoColaborador = Database['public']['Tables']['ativos_colaboradores']['Row'];
export type ConviteUsuario = Database['public']['Tables']['convites_usuarios']['Row'];
export type TenantModulo = Database['public']['Tables']['tenant_modulos']['Row'];
export type TenantAssinatura = Database['public']['Tables']['tenant_assinaturas']['Row'];
export type TenantPagamento = Database['public']['Tables']['tenant_pagamentos']['Row'];
export type AjudaDocumento = Database['public']['Tables']['ajuda_documentos']['Row'];

export type VisitaComRelacionamentos = Database['public']['Tables']['visitas']['Row'] & {
  clientes: Pick<Cliente, 'nome'> | null;
  perfis: Pick<Perfil, 'nome'> | null;
};

export type TenantComPlano = Tenant & {
  planos: Pick<Plano, 'nome' | 'preco_mensal'> | null;
};

export type RHJoin<T> = T & {
  perfis: Pick<Perfil, 'nome' | 'email'> | null;
};

export type AssinaturaComRelacoes = TenantAssinatura & {
  tenants: Pick<Tenant, 'nome_fantasia' | 'status' | 'user_limit'> | null;
  planos: Pick<Plano, 'nome' | 'preco_mensal' | 'user_limit'> | null;
};

async function withTimeout<T>(promise: PromiseLike<T>, label: string, timeoutMs = 12000): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Tempo limite excedido ao carregar ${label}.`)), timeoutMs);
    })
  ]);
}

async function fetchVisitas(): Promise<VisitaComRelacionamentos[]> {
  const { data, error } = await supabase
    .from('visitas')
    .select(`
      *,
      clientes ( nome ),
      perfis ( nome )
    `)
    .order('data_visita', { ascending: true })
    .order('hora_inicio', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as VisitaComRelacionamentos[];
}

async function fetchClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase.from('clientes').select('*').order('nome', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as Cliente[];
}

async function fetchPerfis(): Promise<Perfil[]> {
  const { data, error } = await withTimeout(
    supabase.from('perfis').select('*').order('nome', { ascending: true }),
    'perfis'
  );
  if (error) throw new Error(error.message);
  return (data || []) as Perfil[];
}

async function fetchPerfisAtivos(): Promise<Perfil[]> {
  const { data, error } = await supabase.from('perfis').select('*').eq('status', 'ativo').order('nome', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as Perfil[];
}

async function fetchPlanos(): Promise<Plano[]> {
  const { data, error } = await supabase.from('planos').select('*').order('preco_mensal', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as Plano[];
}

async function fetchTenants(): Promise<TenantComPlano[]> {
  const { data, error } = await supabase
    .from('tenants')
    .select(`
      *,
      planos ( nome, preco_mensal )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as TenantComPlano[];
}

async function fetchTenantById(tenantId: string): Promise<Tenant | null> {
  const { data, error } = await supabase.from('tenants').select('*').eq('id', tenantId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data || null) as Tenant | null;
}

async function fetchReceitas(): Promise<Receita[]> {
  const { data, error } = await supabase
    .from('receitas')
    .select('*')
    .order('data_lancamento', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Receita[];
}

async function fetchCustos(): Promise<Custo[]> {
  const { data, error } = await supabase
    .from('custos')
    .select('*')
    .order('data_lancamento', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Custo[];
}

async function fetchRequisicoes(): Promise<Requisicao[]> {
  const { data, error } = await supabase.from('requisicoes').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Requisicao[];
}

async function fetchItensCatalogo(): Promise<ItemCatalogo[]> {
  const { data, error } = await supabase.from('itens_catalogo').select('*').order('nome', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as ItemCatalogo[];
}

async function fetchReembolsos(): Promise<Reembolso[]> {
  const { data, error } = await supabase.from('reembolsos').select('*').order('data_solicitacao', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Reembolso[];
}

async function fetchValidades(): Promise<Validade[]> {
  const { data, error } = await supabase.from('validades').select('*').order('data_validade', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as Validade[];
}

async function fetchServicos(): Promise<Servico[]> {
  const { data, error } = await supabase.from('servicos').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Servico[];
}

async function fetchChamados(): Promise<Chamado[]> {
  const { data, error } = await supabase.from('chamados').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Chamado[];
}

async function fetchFerias(): Promise<RHJoin<Ferias>[]> {
  const { data, error } = await supabase
    .from('ferias')
    .select(`
      *,
      perfis ( nome, email )
    `)
    .order('data_inicio', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as RHJoin<Ferias>[];
}

async function fetchAtestados(): Promise<RHJoin<Atestado>[]> {
  const { data, error } = await supabase
    .from('atestados')
    .select(`
      *,
      perfis ( nome, email )
    `)
    .order('data_inicio', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as RHJoin<Atestado>[];
}

async function fetchEpiEntregas(): Promise<RHJoin<EpiEntrega>[]> {
  const { data, error } = await supabase
    .from('epi_entregas')
    .select(`
      *,
      perfis ( nome, email )
    `)
    .order('data_entrega', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as RHJoin<EpiEntrega>[];
}

async function fetchAtivosColaboradores(): Promise<RHJoin<AtivoColaborador>[]> {
  const { data, error } = await supabase
    .from('ativos_colaboradores')
    .select(`
      *,
      perfis ( nome, email )
    `)
    .order('data_entrega', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as RHJoin<AtivoColaborador>[];
}

async function fetchConvitesUsuarios(): Promise<ConviteUsuario[]> {
  const { data, error } = await withTimeout(
    supabase
      .from('convites_usuarios')
      .select('*')
      .order('created_at', { ascending: false }),
    'convites de usuarios'
  );

  if (error) throw new Error(error.message);
  return (data || []) as ConviteUsuario[];
}

async function fetchTenantAssinaturas(): Promise<AssinaturaComRelacoes[]> {
  const { data, error } = await supabase
    .from('tenant_assinaturas')
    .select(`
      *,
      tenants ( nome_fantasia, status, user_limit ),
      planos ( nome, preco_mensal, user_limit )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as AssinaturaComRelacoes[];
}

async function fetchTenantAssinaturaByTenant(tenantId: string): Promise<AssinaturaComRelacoes | null> {
  const { data, error } = await supabase
    .from('tenant_assinaturas')
    .select(`
      *,
      tenants ( nome_fantasia, status, user_limit ),
      planos ( nome, preco_mensal, user_limit )
    `)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data || null) as AssinaturaComRelacoes | null;
}

async function fetchTenantPagamentos(): Promise<TenantPagamento[]> {
  const { data, error } = await supabase.from('tenant_pagamentos').select('*').order('data_pagamento', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as TenantPagamento[];
}

async function fetchTenantPagamentosByTenant(tenantId: string): Promise<TenantPagamento[]> {
  const { data, error } = await supabase.from('tenant_pagamentos').select('*').eq('tenant_id', tenantId).order('data_pagamento', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as TenantPagamento[];
}

async function fetchTenantModulos(): Promise<TenantModulo[]> {
  const { data, error } = await supabase.from('tenant_modulos').select('*').order('modulo', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as TenantModulo[];
}

async function fetchTenantModulosByTenant(tenantId: string): Promise<TenantModulo[]> {
  const { data, error } = await supabase.from('tenant_modulos').select('*').eq('tenant_id', tenantId).order('modulo', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as TenantModulo[];
}

async function fetchAjudaDocumentos(): Promise<AjudaDocumento[]> {
  const { data, error } = await supabase.from('ajuda_documentos').select('*').order('ordem', { ascending: true }).order('titulo', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as AjudaDocumento[];
}

export function useVisitas() {
  return useQuery({ queryKey: ['visitas'], queryFn: fetchVisitas });
}

export function useClientes() {
  return useQuery({ queryKey: ['clientes'], queryFn: fetchClientes });
}

export function usePerfis() {
  return useQuery({ queryKey: ['perfis'], queryFn: fetchPerfis });
}

export function usePerfisAtivos() {
  return useQuery({ queryKey: ['perfis', 'ativos'], queryFn: fetchPerfisAtivos });
}

export function usePlanos() {
  return useQuery({ queryKey: ['planos'], queryFn: fetchPlanos });
}

export function useTenants() {
  return useQuery({ queryKey: ['tenants'], queryFn: fetchTenants });
}

export function useTenant(tenantId?: string) {
  return useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => fetchTenantById(tenantId!),
    enabled: Boolean(tenantId)
  });
}

export function useReceitas() {
  return useQuery({ queryKey: ['receitas'], queryFn: fetchReceitas });
}

export function useCustos() {
  return useQuery({ queryKey: ['custos'], queryFn: fetchCustos });
}

export function useRequisicoes() {
  return useQuery({ queryKey: ['requisicoes'], queryFn: fetchRequisicoes });
}

export function useItensCatalogo() {
  return useQuery({ queryKey: ['itens-catalogo'], queryFn: fetchItensCatalogo });
}

export function useReembolsos() {
  return useQuery({ queryKey: ['reembolsos'], queryFn: fetchReembolsos });
}

export function useValidades() {
  return useQuery({ queryKey: ['validades'], queryFn: fetchValidades });
}

export function useServicos() {
  return useQuery({ queryKey: ['servicos'], queryFn: fetchServicos });
}

export function useChamados() {
  return useQuery({ queryKey: ['chamados'], queryFn: fetchChamados });
}

export function useFerias() {
  return useQuery({ queryKey: ['rh', 'ferias'], queryFn: fetchFerias });
}

export function useAtestados() {
  return useQuery({ queryKey: ['rh', 'atestados'], queryFn: fetchAtestados });
}

export function useEpiEntregas() {
  return useQuery({ queryKey: ['rh', 'epis'], queryFn: fetchEpiEntregas });
}

export function useAtivosColaboradores() {
  return useQuery({ queryKey: ['rh', 'ativos'], queryFn: fetchAtivosColaboradores });
}

export function useConvitesUsuarios() {
  return useQuery({ queryKey: ['perfis', 'convites'], queryFn: fetchConvitesUsuarios });
}

export function useTenantAssinaturas() {
  return useQuery({ queryKey: ['saas', 'assinaturas'], queryFn: fetchTenantAssinaturas });
}

export function useTenantAssinatura(tenantId?: string) {
  return useQuery({
    queryKey: ['saas', 'assinaturas', tenantId],
    queryFn: () => fetchTenantAssinaturaByTenant(tenantId!),
    enabled: Boolean(tenantId)
  });
}

export function useTenantPagamentos(tenantId?: string) {
  return useQuery({
    queryKey: ['saas', 'pagamentos', tenantId ?? 'all'],
    queryFn: () => (tenantId ? fetchTenantPagamentosByTenant(tenantId) : fetchTenantPagamentos()),
    enabled: tenantId === undefined || Boolean(tenantId)
  });
}

export function useTenantModulos(tenantId?: string) {
  return useQuery({
    queryKey: ['saas', 'modulos', tenantId ?? 'all'],
    queryFn: () => (tenantId ? fetchTenantModulosByTenant(tenantId) : fetchTenantModulos()),
    enabled: tenantId === undefined || Boolean(tenantId)
  });
}

export function useAjudaDocumentos() {
  return useQuery({ queryKey: ['ajuda', 'documentos'], queryFn: fetchAjudaDocumentos });
}
