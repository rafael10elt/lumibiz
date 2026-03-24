import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const savePassword = async () => {
    if (!password || password !== confirmPassword) {
      alert('Confirme a nova senha corretamente.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      alert(`Erro ao redefinir senha: ${error.message}`);
      return;
    }

    alert('Senha redefinida com sucesso. Faça login novamente se necessário.');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="surface-panel w-full max-w-lg p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange/12 text-brand-orange dark:text-orange-200">
            <KeyRound size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-app-primary">Nova senha</h1>
            <p className="text-sm text-app-secondary">Digite a nova senha para concluir a recuperação da conta.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nova senha" className="input-field" />
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar nova senha" className="input-field" />
          <button onClick={savePassword} disabled={saving} className="btn-primary w-full">
            {saving ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </div>
      </div>
    </div>
  );
}
