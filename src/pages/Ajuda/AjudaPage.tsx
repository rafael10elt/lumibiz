import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpenText, FileText, HelpCircle, LifeBuoy, Mail, MessageCircle, ShieldCheck, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAjudaDocumentos } from '../../hooks/useLumiBiz';
import { supabase } from '../../lib/supabase';
import { LUMITECHIA_SUPPORT } from '../../lib/support';

export function AjudaPage() {
  const queryClient = useQueryClient();
  const { perfil } = useAuth();
  const { data: documentos, isLoading, isError, error } = useAjudaDocumentos();
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('manual');
  const [descricao, setDescricao] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const isSuperAdmin = perfil?.role === 'super_admin';

  const uploadDocumento = async () => {
    if (!isSuperAdmin || !titulo.trim() || !file) {
      alert('Informe titulo e arquivo.');
      return;
    }

    setSaving(true);
    const extension = file.name.split('.').pop() || 'pdf';
    const safeName = `${Date.now()}-${titulo.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${extension}`;
    const storagePath = `${categoria}/${safeName}`;

    const uploadResult = await supabase.storage.from('help-center').upload(storagePath, file, { upsert: true });
    if (uploadResult.error) {
      setSaving(false);
      alert(`Erro ao enviar arquivo: ${uploadResult.error.message}`);
      return;
    }

    const { data } = supabase.storage.from('help-center').getPublicUrl(storagePath);
    const insertResult = await supabase.from('ajuda_documentos').insert({
      titulo: titulo.trim(),
      categoria,
      descricao: descricao.trim() || null,
      arquivo_url: data.publicUrl,
      storage_path: storagePath,
      icone: categoria === 'juridico' ? 'shield' : 'book'
    } as never);

    setSaving(false);

    if (insertResult.error) {
      alert(`Erro ao registrar documento: ${insertResult.error.message}`);
      return;
    }

    setTitulo('');
    setCategoria('manual');
    setDescricao('');
    setFile(null);
    await queryClient.invalidateQueries({ queryKey: ['ajuda', 'documentos'] });
  };

  const docsByCategory = {
    manual: (documentos || []).filter((item) => item.categoria === 'manual'),
    juridico: (documentos || []).filter((item) => item.categoria === 'juridico'),
    politica: (documentos || []).filter((item) => item.categoria === 'politica')
  };

  const whatsappUrl = `https://wa.me/${LUMITECHIA_SUPPORT.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Preciso de suporte no LumiBiz.')}`;

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-brand-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue dark:text-blue-200">
            <HelpCircle size={14} />
            Suporte e documentacao
          </span>
          <h2 className="section-title mt-4">Central de ajuda</h2>
          <p className="section-copy">Como podemos ajudar você hoje?</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="surface-panel p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-300">
              <LifeBuoy size={22} />
            </div>
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-app-primary">Fale com o suporte</h3>
              <p className="text-sm text-app-secondary">Atendimento direto via WhatsApp ou E-mail para tirar dúvidas ou reportar problemas.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-emerald-500">
              <MessageCircle size={18} />
              Iniciar conversa no WhatsApp
            </a>
            <a href={`mailto:${LUMITECHIA_SUPPORT.email}`} className="btn-secondary w-full">
              <Mail size={18} />
              {LUMITECHIA_SUPPORT.email}
            </a>
          </div>
        </section>

        <section className="surface-panel p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/12 text-brand-blue dark:text-blue-200">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-app-primary">Juridico e manuais</h3>
              <p className="text-sm text-app-secondary">Documentação legal, políticas de uso e manuais da plataforma.</p>
            </div>
          </div>

          {isLoading && <div className="mt-6 text-sm text-app-secondary">Carregando documentos...</div>}
          {isError && <div className="mt-6 text-sm text-rose-600 dark:text-rose-300">Erro ao carregar documentos: {error?.message}</div>}

          <div className="mt-6 space-y-3">
            {[...docsByCategory.manual, ...docsByCategory.juridico, ...docsByCategory.politica].map((doc) => (
              <a key={doc.id} href={doc.arquivo_url || '#'} target="_blank" rel="noreferrer" className="surface-subtle flex items-center gap-3 px-4 py-4 transition hover:border-brand-blue/30">
                {doc.categoria === 'manual' ? <BookOpenText size={18} className="text-brand-blue" /> : <FileText size={18} className="text-brand-orange" />}
                <div>
                  <p className="font-medium text-app-primary">{doc.titulo}</p>
                  {doc.descricao ? <p className="text-sm text-app-secondary">{doc.descricao}</p> : null}
                </div>
              </a>
            ))}

            {!isLoading && (documentos || []).length === 0 && <div className="surface-subtle px-4 py-5 text-sm text-app-secondary">Nenhum documento cadastrado ainda.</div>}
          </div>
        </section>
      </div>

      {isSuperAdmin && (
        <section className="surface-panel p-6">
          <h3 className="text-2xl font-semibold tracking-tight text-app-primary">Gerenciar documentos da ajuda</h3>
          <p className="mt-1 text-sm text-app-secondary">Area exclusiva do Super Admin para upload e publicacao de materiais.</p>

          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1fr_1fr_1.2fr_auto]">
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Titulo do documento" className="input-field" />
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="input-field">
              <option value="manual">Manual</option>
              <option value="juridico">Juridico</option>
              <option value="politica">Politica</option>
            </select>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input-field py-3" />
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descricao opcional" className="input-field" />
            <button onClick={uploadDocumento} disabled={saving} className="btn-primary">
              <Upload size={18} />
              {saving ? 'Enviando...' : 'Publicar'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
