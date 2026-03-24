import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useTenantAssinaturas } from '../../hooks/useLumiBiz';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';

export function AssinaturasSaasPage() {
  const queryClient = useQueryClient();
  const { data: assinaturas } = useTenantAssinaturas();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState('ativo');
  const [valorMensal, setValorMensal] = useState('');
  const [proximoVencimento, setProximoVencimento] = useState('');
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState('');
  const [pixCopiaCola, setPixCopiaCola] = useState('');
  const [pixChave, setPixChave] = useState('');
  const [saving, setSaving] = useState(false);

  const openEdit = (id: string) => {
    const assinatura = (assinaturas || []).find((item) => item.id === id);
    if (!assinatura) return;
    setEditingId(id);
    setStatus(assinatura.status);
    setValorMensal(String(assinatura.valor_mensal || ''));
    setProximoVencimento(assinatura.proximo_vencimento || '');
    setPixQrCodeUrl(assinatura.pix_qrcode_url || '');
    setPixCopiaCola(assinatura.pix_copia_cola || '');
    setPixChave(assinatura.pix_chave || '');
  };

  const save = async () => {
    if (!editingId) return;
    setSaving(true);
    const result = await supabase
      .from('tenant_assinaturas')
      .update({
        status,
        valor_mensal: Number(valorMensal || 0),
        proximo_vencimento: proximoVencimento || null,
        pix_qrcode_url: pixQrCodeUrl || null,
        pix_copia_cola: pixCopiaCola || null,
        pix_chave: pixChave || null
      } as never)
      .eq('id', editingId);
    setSaving(false);

    if (result.error) {
      alert(`Erro ao salvar assinatura: ${result.error.message}`);
      return;
    }

    setEditingId(null);
    await queryClient.invalidateQueries({ queryKey: ['saas', 'assinaturas'] });
  };

  const grouped = useMemo(() => assinaturas || [], [assinaturas]);

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <h2 className="section-title">Gerenciamento de assinaturas</h2>
          <p className="section-copy">Atualize cobrança, status e dados PIX de cada tenant para validação manual.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-panel p-6">
          <div className="space-y-3">
            {grouped.map((assinatura) => (
              <button key={assinatura.id} onClick={() => openEdit(assinatura.id)} className={`surface-subtle flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition ${editingId === assinatura.id ? 'border-brand-blue/30' : ''}`}>
                <div>
                  <p className="font-medium text-app-primary">{assinatura.tenants?.nome_fantasia || 'Tenant sem nome'}</p>
                  <p className="text-sm text-app-secondary">{assinatura.planos?.nome || 'Sem plano'} • {formatCurrency(Number(assinatura.valor_mensal || 0))}</p>
                </div>
                <span className="text-xs capitalize text-app-muted">{assinatura.status}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="surface-panel p-6">
          <h3 className="text-2xl font-semibold tracking-tight text-app-primary">Editar cobrança</h3>
          {!editingId && <p className="mt-4 text-sm text-app-secondary">Selecione uma assinatura para editar seus dados.</p>}

          {editingId && (
            <div className="mt-5 space-y-4">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field">
                <option value="ativo">ativo</option>
                <option value="pendente">pendente</option>
                <option value="atrasado">atrasado</option>
                <option value="suspenso">suspenso</option>
                <option value="cancelado">cancelado</option>
              </select>
              <input value={valorMensal} onChange={(e) => setValorMensal(e.target.value)} className="input-field" placeholder="Valor mensal" type="number" step="0.01" />
              <input value={proximoVencimento} onChange={(e) => setProximoVencimento(e.target.value)} className="input-field" type="date" />
              <input value={pixQrCodeUrl} onChange={(e) => setPixQrCodeUrl(e.target.value)} className="input-field" placeholder="URL do QRCode PIX" />
              <textarea value={pixCopiaCola} onChange={(e) => setPixCopiaCola(e.target.value)} className="textarea-field" rows={4} placeholder="PIX copia e cola" />
              <input value={pixChave} onChange={(e) => setPixChave(e.target.value)} className="input-field" placeholder="Chave PIX" />
              <button onClick={save} disabled={saving} className="btn-primary w-full">
                <Save size={18} />
                {saving ? 'Salvando...' : 'Salvar assinatura'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
