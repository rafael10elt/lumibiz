import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const sendReset = async () => {
    if (!email.trim()) return;
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/nova-senha`
    });
    setSending(false);

    if (error) {
      alert(`Erro ao enviar recuperação: ${error.message}`);
      return;
    }

    alert('Enviamos um link de recuperação para o e-mail informado.');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="surface-panel w-full max-w-lg p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/12 text-brand-blue dark:text-blue-200">
            <MailCheck size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-app-primary">Recuperar senha</h1>
            <p className="text-sm text-app-secondary">Informe seu e-mail para receber o link de redefinição.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com.br" className="input-field" />
          <button onClick={sendReset} disabled={sending} className="btn-primary w-full">
            {sending ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </div>
      </div>
    </div>
  );
}
