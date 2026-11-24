import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, ApiError } from '../api/client';
import type { User } from '../types';
import { loadSession, saveSession, subscribeSession } from './session';
import type { Session } from './session';

interface AuthValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
      throw new ApiError(500, 'El navegador no ha dejado guardar la sesión. Revisa el almacenamiento del sitio.');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Avisar al servidor invalida los tokens: sin esto, el refresh token seguiría
      // sirviendo aunque el usuario ya crea que ha cerrado sesión.
      await api.logout();
    } catch {
      // Si el servidor no contesta (red, 5xx) no hay nada más que hacer, pero tampoco
      // se puede impedir que el usuario salga por eso.
    } finally {
      // Pase lo que pase, la sesión local se borra: si no, el usuario se queda pegado
      // en una pantalla que ya no sirve. Sin sesión guardada, `request()` lanza 401
      // antes de enviar nada y este mismo camino lo absorbe.
      saveSession(null);
    }
  }, []);

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
