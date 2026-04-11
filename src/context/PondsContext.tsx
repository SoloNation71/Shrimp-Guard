import React, { createContext, useContext, useCallback } from 'react';
import { usePersistedState } from '@/hooks/usePersistedState';
import { MOCK_PONDS } from '@/api/mock-data';
import type { Pond } from '@/types';

interface PondsState {
  ponds: Pond[];
  setPonds: (value: Pond[] | ((prev: Pond[]) => Pond[])) => void;
  getPond: (id: number) => Pond | undefined;
}

const PondsContext = createContext<PondsState | undefined>(undefined);

export function PondsProvider({ children }: { children: React.ReactNode }) {
  const [ponds, setPonds] = usePersistedState<Pond[]>('shrimpguard:ponds', [...MOCK_PONDS]);

  const getPond = useCallback((id: number) => ponds.find((p) => p.id === id), [ponds]);

  return (
    <PondsContext.Provider value={{ ponds, setPonds, getPond }}>
      {children}
    </PondsContext.Provider>
  );
}

export function usePonds() {
  const ctx = useContext(PondsContext);
  if (!ctx) throw new Error('usePonds must be used within PondsProvider');
  return ctx;
}
