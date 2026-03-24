import { useState } from 'react';
import { KeyRound, MailCheck, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function SegurancaPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const changePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      alert('Confirme a nova senha corretamente.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (error) {
      alert(`Erro ao atualizar senha: ${error.message}`);
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    alert('Senha atualizada com sucesso.');
  };

  const requestReset = async () => {
    if (!email.trim()) {
      alert('Informe o e-mail de acesso.');
      return;
    }

    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/nova-senha`
    });
    setSendingReset(false);

    if (error) {
      alert(`Erro ao solicitar recuperação: ${error.message}`);
      return;
    }

    alert('Enviamos um link de recuperação para o e-mail informado.');
  };

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-brand-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue dark:text-blue-200">
            <ShieldCheck size={14} />
            Acesso da conta
          </span>
          <h2 className="section-title mt-4">Segurança</h2>
          <p className="section-copy">Atualize sua própria senha ou solicite a recuperação por e-mail.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="surface-panel p-6">
          <div className="flex items-center gap-3">
            <KeyRound className="text-brand-blue" size={20} />
            <h3 className="text-2xl font-semibold tracking-tight text-app-primary">Alterar senha</h3>
          </div>

          <div className="mt-6 space-y-4">
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Senha atual" className="input-field" />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova senha" className="input-field" />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar nova senha" className="input-field" />
            <button onClick={changePassword} disabled={saving} className="btn-primary">
              {saving ? 'Atualizando...' : 'Salvar nova senha'}
            </button>
          </div>
        </section>

        <section className="surface-panel p-6">
          <div className="flex items-center gap-3">
            <MailCheck className="text-brand-orange" size={20} />
            <h3 className="text-2xl font-semibold tracking-tight text-app-primary">Recuperação por e-mail</h3>
          </div>

          <div className="mt-6 space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu e-mail de acesso" className="input-field" />
            <button onClick={requestReset} disabled={sendingReset} className="btn-secondary">
              {sendingReset ? 'Enviando...' : 'Solicitar recuperação'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
