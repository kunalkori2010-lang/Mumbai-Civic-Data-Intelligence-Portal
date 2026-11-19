import React, { createContext, useContext, useState } from 'react';
import type { UserRole } from '../shared/types.ts';

interface RoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  apiFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('Administrator');

  const apiFetch = async (input: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers || {});
    headers.set('x-user-role', role);
    return fetch(input, { ...init, headers });
  };

  return (
    <RoleContext.Provider value={{ role, setRole, apiFetch }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside RoleProvider');
  return ctx;
}
