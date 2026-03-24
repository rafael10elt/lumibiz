import { BadgeHelp, LockKeyhole, ShieldAlert } from 'lucide-react';

export function AccessLimitedPage() {
  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-orange/15 bg-brand-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-orange dark:text-orange-200">
            <ShieldAlert size={14} />
            Acesso temporariamente limitado
          </span>
          <h2 className="section-title mt-4">Seu ambiente está em revisão</h2>
          <p className="section-copy">
            No momento, este usuário está com acesso reduzido. Se precisar de apoio, fale com o administrador do tenant ou use a Central de Ajuda.
          </p>
        </div>
      </section>

      <section className="surface-panel p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/12 text-brand-blue dark:text-blue-200">
            <LockKeyhole size={22} />
          </div>
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-app-primary">O que fazer agora</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-app-secondary">
              <p>Peça ao administrador do tenant para revisar a situação do acesso.</p>
              <p>Se necessário, utilize a área de ajuda para falar com o suporte.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 surface-subtle flex items-center gap-3 px-4 py-4">
          <BadgeHelp size={18} className="text-brand-orange" />
          <p className="text-sm text-app-primary">A Central de Ajuda continua disponível para orientações gerais.</p>
        </div>
      </section>
    </div>
  );
}
