import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

// Mock users for demo
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const entry = MOCK_USERS[email.toLowerCase()];
    if (!entry || entry.password !== password) {
      setIsLoading(false);
      throw new Error('Invalid email or password');
    }
    setUser(entry.user);
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
