import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type PerfilUsuario = Database['public']['Tables']['perfis']['Row'];
type PerfilComTenant = PerfilUsuario & {
  tenants: Pick<Database['public']['Tables']['tenants']['Row'], 'nome_fantasia'> | null;
};

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  perfil: PerfilComTenant | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<PerfilComTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);
  const lastFetchedProfileRef = useRef<string | null>(null);

  const fetchPerfil = async (userId: string, force = false) => {
    if (!force && lastFetchedProfileRef.current === userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('perfis')
        .select(`
          *,
          tenants ( nome_fantasia )
        `)
        .eq('id', userId)
        .single();

      if (!error && data) {
        lastFetchedProfileRef.current = userId;
        setPerfil(data);
      } else {
        setPerfil(null);
      }
    } catch {
      setPerfil(null);
    } finally {
      setLoading(false);
    }
  };

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
        await fetchPerfil(currentSession.user.id, true);
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
      void fetchPerfil(nextUser.id, event !== 'INITIAL_SESSION');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    lastFetchedProfileRef.current = null;
    await supabase.auth.signOut();
  };

  return <AuthContext.Provider value={{ session, user, perfil, loading, signOut }}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
