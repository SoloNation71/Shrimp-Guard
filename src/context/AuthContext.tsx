import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { User, UserRole } from '@/types';
import { registerTokenProvider } from '@/lib/apiClient';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const USE_SUPABASE = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Mock fallback users
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'owner@shrimpguard.com': {
    password: 'demo1234',
    user: { id: '1', email: 'owner@shrimpguard.com', name: 'Jake Morrison', role: 'owner' },
  },
  'viewer@shrimpguard.com': {
    password: 'demo1234',
    user: { id: '2', email: 'viewer@shrimpguard.com', name: 'Sarah Chen', role: 'viewer' },
  },
};

async function supabaseSignIn(
  email: string,
  password: string
): Promise<{ user: User; accessToken: string }> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error_description ?? err?.msg ?? 'Login failed');
  }

  const data = await res.json();
  const meta = data.user?.user_metadata ?? {};
  const role: UserRole = (data.user?.app_metadata?.role ?? meta?.role ?? 'viewer') as UserRole;

  return {
    accessToken: data.access_token,
    user: {
      id: data.user.id,
      email: data.user.email,
      name: meta.full_name ?? meta.name ?? data.user.email,
      role,
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    registerTokenProvider(() => tokenRef.current);
  }, []);

  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (USE_SUPABASE) {
        const result = await supabaseSignIn(email, password);
        setUser(result.user);
        setAccessToken(result.accessToken);
      } else {
        await new Promise((r) => setTimeout(r, 800));
        const entry = MOCK_USERS[email.toLowerCase()];
        if (!entry || entry.password !== password) {
          throw new Error('Invalid email or password');
        }
        setUser(entry.user);
        setAccessToken('mock-token-' + Date.now());
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
