import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { adminLogin } from './api';

interface AdminContextValue {
  isAdmin: boolean;
  /** The validated password, kept in memory only, sent with admin writes. */
  password: string | null;
  /** Returns true on success. */
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [password, setPassword] = useState<string | null>(null);

  const login = useCallback(async (candidate: string): Promise<boolean> => {
    const ok = await adminLogin(candidate);
    setPassword(ok ? candidate : null);
    return ok;
  }, []);

  const logout = useCallback(() => setPassword(null), []);

  const value = useMemo<AdminContextValue>(
    () => ({ isAdmin: password !== null, password, login, logout }),
    [password, login, logout],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within an AdminProvider');
  return ctx;
}
