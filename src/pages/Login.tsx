import { useState } from 'react';
import { MoonStar, ShieldCheck, Sparkles, SunMedium } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { BrandMark } from '../components/layout/BrandMark';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert('Erro ao fazer login. Verifique suas credenciais.');
    } else {
      navigate('/');
    }

    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-brand-radial opacity-90" />

      <button onClick={toggleTheme} className="btn-secondary absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        {theme === 'light' ? <MoonStar size={18} /> : <SunMedium size={18} />}
        {theme === 'light' ? 'Tema escuro' : 'Tema claro'}
      </button>

      <div className="relative z-10 grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-panel relative overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-blue via-brand-orange to-brand-blue-deep" />
          <BrandMark className="mb-8" />

          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue dark:text-blue-200">
              <Sparkles size={14} />
              SaaS Multitenant
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-app-primary sm:text-5xl">
              Gestao operacional com visual moderno, fluido e pronta para escalar.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-app-secondary sm:text-lg">
              O LumiBiz une financeiro, visitas, RH, servicos e atendimento em uma experiencia mais clara para
              equipes que precisam operar bem no desktop e no celular.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="surface-subtle p-4">
              <p className="text-sm font-semibold text-app-primary">Visao unificada</p>
              <p className="mt-2 text-sm text-app-secondary">Dashboard, operacao e cadastros com a mesma linguagem visual.</p>
            </div>
            <div className="surface-subtle p-4">
              <p className="text-sm font-semibold text-app-primary">Mobile first</p>
              <p className="mt-2 text-sm text-app-secondary">Fluxos pensados para toque, leitura rapida e menos atrito.</p>
            </div>
            <div className="surface-subtle p-4">
              <p className="text-sm font-semibold text-app-primary">Seguranca tenant</p>
              <p className="mt-2 text-sm text-app-secondary">Arquitetura preparada para multitenancy e controle por perfis.</p>
            </div>
          </div>
        </section>

        <section className="surface-panel p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-orange to-brand-orange-deep text-white shadow-soft">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-app-primary">Entrar no LumiBiz</h2>
              <p className="text-sm text-app-secondary">Use sua conta para acessar o workspace do tenant.</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-app-primary">E-mail</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="voce@empresa.com.br" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-app-primary">Senha</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Sua senha" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'Entrar no sistema'}
            </button>

            <div className="surface-subtle p-4">
              <p className="text-sm font-medium text-app-primary">Tema atual: {theme === 'light' ? 'Claro' : 'Escuro'}</p>
              <p className="mt-1 text-sm text-app-secondary">
                O tema fica salvo no navegador e vale para todo o sistema, com contraste ajustado para leitura.
              </p>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
