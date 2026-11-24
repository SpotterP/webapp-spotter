import type { User } from '../types';

const KEY = 'spotter.session';

export interface Session {
  token: string;
  refreshToken: string;
  user: User;
}

type Listener = (session: Session | null) => void;
const listeners = new Set<Listener>();

export function loadSession(): Session | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    forgetStoredSession();
    return null;
  }

  if (!isSession(parsed)) {
    // Un JSON válido con otra forma (versión vieja, campos a medias) dejaría la UI
    // medio logueada y todas las peticiones en 401: mejor pedir login otra vez.
    forgetStoredSession();
    return null;
  }

  return parsed;
}

/**
 * Una sesión solo se escribe al hacer login, así que tiene que traer los cuatro campos.
 * Sin `refreshToken` el refresh no puede funcionar y sin `role` el tipo `User` miente.
 */
function isSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Session>;
  return (
    isFilled(candidate.token) &&
    isFilled(candidate.refreshToken) &&
    isUser(candidate.user)
  );
}

function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<User>;
  return (
    isFilled(candidate._id) &&
    isFilled(candidate.name) &&
    isFilled(candidate.email) &&
    (candidate.role === 'ADMIN' || candidate.role === 'USER')
  );
}

function isFilled(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/** Borra una sesión guardada que no se puede usar, sin avisar a los listeners (aún no hay UI montada). */
function forgetStoredSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* empty */
  }
}

export function saveSession(session: Session | null): boolean {
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  } catch {
    // Si no se pudo guardar, la sesión en memoria no existe en disco: avisar de ella
    // dejaría la UI logueada hasta el próximo F5. Se informa al llamador para que
    // pueda enseñar el error en vez de dejar el login en silencio.
    if (session) return false;
  }
  listeners.forEach((listener) => listener(session));
  return true;
}

export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Otra pestaña puede iniciar o cerrar sesión: sin esto, esta pestaña se queda con
// el estado anterior mientras todas sus peticiones fallan con 401.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== KEY) return;
    listeners.forEach((listener) => listener(loadSession()));
  });
}
