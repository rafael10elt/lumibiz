import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Autenticação nativa do Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Erro ao fazer login. Verifique suas credenciais.');
    } else {
      navigate('/'); // Vai para o Dashboard se der certo
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg dark:bg-gray-800">
        
        {/* Logo LumiBiz */}
        <div className="flex flex-col items-center mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-dark to-gray-600 rounded-xl flex items-center justify-center shadow-lg mb-4 border-2 border-brand-gold">
            <span className="text-brand-gold text-4xl font-bold">L</span>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-brand-dark dark:text-white">LumiBiz</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gestao Multitenant</p>
          </div>
        </div>
        
        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="shadow-sm rounded-md">
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-t-md focus:outline-none focus:ring-brand-gold focus:border-brand-gold dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              placeholder="E-mail de Acesso" 
            />
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 border-t-0 rounded-b-md focus:outline-none focus:ring-brand-gold focus:border-brand-gold dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              placeholder="Senha" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full px-4 py-3 text-sm font-medium text-white bg-brand-dark rounded-md hover:bg-brand-gold focus:outline-none transition-colors flex justify-center items-center"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            ) : (
              'Entrar no Sistema'
            )}
          </button>
        </form>

      </div>
    </div>
  );
};