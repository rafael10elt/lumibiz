import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type PerfilUsuario = Database['public']['Tables']['perfis']['Row'];
type PerfilComTenant = PerfilUsuario & {
  tenants: Pick<Database['public']['Tables']['tenants']['Row'], 'nome_fantasia' | 'logo_url' | 'email' | 'telefone' | 'endereco'> | null;
};

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  perfil: PerfilComTenant | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<PerfilComTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);
  const lastFetchedProfileRef = useRef<string | null>(null);

  const buildFallbackPerfil = useCallback((authUser: User): PerfilComTenant => {
    const metadata = authUser.user_metadata || {};
    return {
      id: authUser.id,
      tenant_id: (metadata.tenant_id as string | null) || null,
      nome: (metadata.nome as string | null) || authUser.email?.split('@')[0] || 'Usuario',
      email: authUser.email || null,
      foto_url: (metadata.foto_url as string | null) || null,
      role: (metadata.role as string | null) || 'usuario',
      status: 'ativo',
      telefone: null,
      data_nascimento: null,
      data_inicio_vinculo: null,
      data_fim_vinculo: null,
      cnpj: null,
      razao_social: null,
      valor_hora: null,
      endereco: null,
      observacoes: null,
      created_at: new Date().toISOString(),
      tenants: metadata.tenant_nome
        ? {
            nome_fantasia: metadata.tenant_nome as string,
            logo_url: (metadata.tenant_logo_url as string | null) || null,
            email: null,
            telefone: null,
            endereco: null
          }
        : null
    };
  }, []);

  const fetchPerfil = useCallback(
    async (authUser: User, force = false) => {
      if (!force && lastFetchedProfileRef.current === authUser.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('perfis')
          .select(`
          *,
          tenants ( nome_fantasia, logo_url, email, telefone, endereco )
        `)
          .eq('id', authUser.id)
          .maybeSingle();

        if (!error && data) {
          lastFetchedProfileRef.current = authUser.id;
          setPerfil(data);
        } else {
          setPerfil(buildFallbackPerfil(authUser));
        }
      } catch {
        setPerfil(buildFallbackPerfil(authUser));
      } finally {
        setLoading(false);
      }
    },
    [buildFallbackPerfil]
  );

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    const bootstrap = async () => {
      const {
        data: { session: currentSession }
      } = await supabase.auth.getSession();

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchPerfil(currentSession.user, true);
      } else {
        setLoading(false);
      }
    };

    void bootstrap();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const nextUser = nextSession?.user ?? null;
      setSession(nextSession);
      setUser(nextUser);

      if (!nextUser) {
        lastFetchedProfileRef.current = null;
        setPerfil(null);
        setLoading(false);
        return;
      }

      if (event === 'INITIAL_SESSION' && lastFetchedProfileRef.current === nextUser.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      void fetchPerfil(nextUser, event !== 'INITIAL_SESSION');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchPerfil]);

  const signOut = async () => {
    lastFetchedProfileRef.current = null;
    await supabase.auth.signOut();
  };

  const refreshPerfil = async () => {
    if (!user) return;
    setLoading(true);
    lastFetchedProfileRef.current = null;
    await fetchPerfil(user, true);
  };

  return <AuthContext.Provider value={{ session, user, perfil, loading, signOut, refreshPerfil }}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
