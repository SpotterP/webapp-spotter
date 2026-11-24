import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, ApiError } from '../api/client';
import { translate } from '../i18n';
import type { User } from '../types';
import { loadSession, saveSession, subscribeSession } from './session';
import type { Session } from './session';

interface AuthValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession);

  useEffect(() => subscribeSession(setSession), []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, refreshToken, user } = await api.login({ email, password });

    // Si el navegador no deja guardar la sesión (modo privado, cuota llena), el login
    // no puede dar por hecho que hay sesión: hay que decírselo al usuario.
    if (!saveSession({ token, refreshToken, user })) {
      throw new ApiError(500, translate('errors.storage'));
    }
  }, []);

  const logout = useCallback(() => saveSession(null), []);

  const value = useMemo(
    () => ({ user: session?.user ?? null, login, logout }),
    [session, login, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return value;
}
