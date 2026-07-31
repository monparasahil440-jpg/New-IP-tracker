import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isMockUser: boolean;
  loginMockUser: (email?: string, name?: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isMockUser: false,
  loginMockUser: () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMockUser, setIsMockUser] = useState<boolean>(false);

  useEffect(() => {
    const mockUserData = localStorage.getItem('cyber_mock_user');
    if (mockUserData) {
      try {
        const parsed = JSON.parse(mockUserData);
        setUser(parsed);
        setIsMockUser(true);
        setLoading(false);
        return;
      } catch (e) {
        console.error('Failed parsing mock user', e);
      }
    }

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setIsMockUser(false);
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const loginMockUser = (email = 'operator@cyber-hub.io', name = 'Agent Cyber-01') => {
    const fakeUser: any = {
      id: 'mock-user-' + Date.now(),
      email: email,
      user_metadata: { name: name },
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('cyber_mock_user', JSON.stringify(fakeUser));
    setUser(fakeUser);
    setIsMockUser(true);
  };

  const logout = async () => {
    localStorage.removeItem('cyber_mock_user');
    setIsMockUser(false);
    setUser(null);
    setSession(null);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isMockUser, loginMockUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
