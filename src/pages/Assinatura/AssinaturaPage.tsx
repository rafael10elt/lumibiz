import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, ExternalLink, QrCode, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenantAssinatura, useTenantPagamentos } from '../../hooks/useLumiBiz';
import { supabase } from '../../lib/supabase';
import { getBillingAccessState, LUMITECHIA_SUPPORT } from '../../lib/support';
import { formatCurrency } from '../../lib/utils';

export function AssinaturaPage() {
  const queryClient = useQueryClient();
  const { perfil } = useAuth();
  const tenantId = perfil?.tenant_id || undefined;
  const { data: assinatura } = useTenantAssinatura(tenantId);
  const { data: pagamentos } = useTenantPagamentos(tenantId);
  const [observacao, setObservacao] = useState('');
  const [saving, setSaving] = useState(false);
  const billing = getBillingAccessState(assinatura?.proximo_vencimento);

  const enviarComprovante = async () => {
    if (!tenantId || !assinatura) return;

    setSaving(true);
    const insertResult = await supabase.from('tenant_pagamentos').insert({
      tenant_id: tenantId,
      assinatura_id: assinatura.id,
      valor: assinatura.valor_mensal,
      data_pagamento: new Date().toISOString().slice(0, 10),
      status: 'pendente',
      observacao: observacao.trim() || 'Comprovante enviado via WhatsApp'
    } as never);
    setSaving(false);

    if (insertResult.error) {
      alert(`Erro ao registrar envio de comprovante: ${insertResult.error.message}`);
      return;
    }

    setObservacao('');
    await queryClient.invalidateQueries({ queryKey: ['saas', 'pagamentos', tenantId] });

    const message = `Olá! Estou enviando o comprovante da assinatura do tenant ${assinatura.tenants?.nome_fantasia || tenantId}.`;
    window.open(`https://wa.me/${LUMITECHIA_SUPPORT.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const copiar = async (text: string | null | undefined) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-orange/15 bg-brand-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-orange dark:text-orange-200">
            <ShieldCheck size={14} />
            Pagamentos do tenant
          </span>
          <h2 className="section-title mt-4">Assinatura</h2>
          <p className="section-copy">Renove o acesso do tenant via PIX e acompanhe o histórico de pagamentos validados manualmente.</p>
          {billing.isOverdue ? (
            <div className={`mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${billing.isRestricted ? 'bg-rose-500/12 text-rose-600 dark:text-rose-300' : 'bg-brand-orange/12 text-brand-orange dark:text-orange-200'}`}>
              {billing.isRestricted
                ? `Assinatura vencida há ${billing.overdueDays} dias. O ambiente está em acesso reduzido.`
                : `Assinatura vencida há ${billing.overdueDays} dias. Você ainda está no período de regularização.`}
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <div className="surface-panel p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-rose-500" size={20} />
              <h3 className="text-2xl font-semibold tracking-tight text-app-primary">Detalhes da assinatura</h3>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-app-muted">Plano atual</p>
                <p className="mt-2 text-3xl font-semibold text-app-primary">{assinatura?.planos?.nome || 'Sem plano'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-app-muted">Valor mensal</p>
                <p className="mt-2 text-3xl font-semibold text-rose-500">{formatCurrency(Number(assinatura?.valor_mensal || 0))}</p>
              </div>
            </div>

            <div className="mt-6 border-t border-border-subtle pt-6">
              <p className="text-xs uppercase tracking-[0.18em] text-app-muted">Proximo vencimento</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-2xl font-semibold text-app-primary">{assinatura?.proximo_vencimento ? new Date(assinatura.proximo_vencimento).toLocaleDateString('pt-BR') : '-'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${assinatura?.status === 'ativo' ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300' : 'bg-brand-orange/12 text-brand-orange dark:text-orange-200'}`}>
                  {assinatura?.status || 'pendente'}
                </span>
              </div>
              {billing.isGracePeriod && (
                <div className="mt-4 rounded-2xl bg-brand-orange/10 px-4 py-4 text-sm text-brand-orange dark:text-orange-200">
                  O vencimento já passou, mas ainda existe uma janela de 5 dias para regularização sem bloqueio total do ambiente.
                </div>
              )}
              {billing.isRestricted && (
                <div className="mt-4 rounded-2xl bg-rose-500/10 px-4 py-4 text-sm text-rose-600 dark:text-rose-300">
                  O ambiente está em acesso reduzido até a confirmação manual do pagamento. Assim que o comprovante for validado, o acesso completo será restabelecido.
                </div>
              )}
            </div>
          </div>

          <div className="surface-panel p-6">
            <h3 className="text-2xl font-semibold tracking-tight text-app-primary">Historico de pagamentos</h3>
            <div className="mt-5 space-y-3">
              {(pagamentos || []).length === 0 && <div className="surface-subtle px-4 py-5 text-sm text-app-secondary">Nenhum pagamento registrado.</div>}
              {(pagamentos || []).map((pagamento) => (
                <div key={pagamento.id} className="surface-subtle flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                  <div>
                    <p className="font-medium text-app-primary">{new Date(pagamento.data_pagamento).toLocaleDateString('pt-BR')}</p>
                    <p className="text-sm text-app-secondary">{formatCurrency(Number(pagamento.valor || 0))}</p>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${pagamento.status === 'validado' ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300' : pagamento.status === 'recusado' ? 'bg-rose-500/12 text-rose-600 dark:text-rose-300' : 'bg-brand-orange/12 text-brand-orange dark:text-orange-200'}`}>
                      {pagamento.status}
                    </span>
                    {pagamento.observacao ? <p className="mt-2 text-xs text-app-muted">{pagamento.observacao}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="surface-panel p-6">
          <div className="flex items-center gap-3">
            <QrCode className="text-emerald-600" size={20} />
            <h3 className="text-2xl font-semibold tracking-tight text-app-primary">Pague sua mensalidade</h3>
          </div>

          <p className="mt-6 text-center text-base text-app-secondary">
            Renove seu acesso realizando o pagamento via PIX no valor de <span className="font-semibold text-app-primary">{formatCurrency(Number(assinatura?.valor_mensal || 0))}</span>
          </p>

          {assinatura?.pix_qrcode_url ? (
            <div className="mt-8 flex justify-center">
              <img src={assinatura.pix_qrcode_url} alt="QR Code PIX" className="rounded-3xl border border-dashed border-border-subtle bg-white p-4 shadow-soft" />
            </div>
          ) : null}

          <div className="mt-8 space-y-4">
            <CopyField label="PIX copia e cola" value={assinatura?.pix_copia_cola || ''} onCopy={() => copiar(assinatura?.pix_copia_cola)} />
            <CopyField label="Chave PIX alternativa" value={assinatura?.pix_chave || ''} onCopy={() => copiar(assinatura?.pix_chave)} />
            <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} className="textarea-field" rows={3} placeholder="Observacao opcional para o comprovante" />
          </div>

          <div className="mt-6 border-t border-border-subtle pt-6 text-center text-sm text-app-secondary">
            Após realizar o pagamento, envie o comprovante para ativação imediata.
          </div>

          <button onClick={enviarComprovante} disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-emerald-500">
            {saving ? 'Registrando...' : 'Enviar comprovante'}
            <ExternalLink size={18} />
          </button>
        </section>
      </div>
    </div>
  );
}

function CopyField({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-app-primary">{label}</p>
      <div className="flex overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated">
        <input value={value} readOnly className="h-12 flex-1 bg-transparent px-4 text-sm text-app-primary outline-none" />
        <button onClick={onCopy} className="inline-flex items-center justify-center border-l border-border-subtle px-4 text-app-secondary transition hover:bg-surface-muted">
          <Copy size={16} />
        </button>
      </div>
    </div>
  );
}
