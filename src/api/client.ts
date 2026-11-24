import { API_URL } from '../config';
import { loadSession, saveSession } from '../auth/session';
import { translate } from '../i18n';
import type {
  Exercise,
  ExerciseCategory,
  LoginResponse,
  PageInfo,
  Progress,
  TrainingSession,
  User,
  Workout,
} from '../types';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const TOKEN_EXPIRED = 'El token ha caducado';

async function parse(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function toError(status: number, body: unknown): ApiError {
  const message =
    body && typeof body === 'object' && 'message' in body ? String(body.message) : null;
  return new ApiError(status, message ?? translate('errors.generic'));
}

async function send(path: string, init: RequestInit, token?: string): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  try {
    return await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, translate('errors.network'));
  }
}

async function publicRequest<T>(path: string, body: unknown): Promise<T> {
  const response = await send(path, { method: 'POST', body: JSON.stringify(body) });
  const data = await parse(response);
  if (!response.ok) throw toError(response.status, data);
  return data as T;
}

let refreshing: Promise<string> | null = null;

function refreshToken(): Promise<string> {
  refreshing ??= (async () => {
    const session = loadSession();
    if (!session) throw new ApiError(401, translate('errors.noSession'));
    try {
      const { token } = await publicRequest<{ token: string }>('/auth/refresh', {
        refreshToken: session.refreshToken,
      });
      saveSession({ ...session, token });
      return token;
    } catch (error) {
      // Un 401/403 significa que la sesión ya no sirve: se borra para que la UI no siga
      // creyendo que hay sesión. Un fallo de red, un 5xx o un 429 (demasiados intentos)
      // son pasajeros y la sesión se conserva.
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        saveSession(null);
      }
      throw error;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = loadSession();
  if (!session) {
    // Sin sesión guardada (otra pestaña la borró, o quedó inválida) hay que avisar a la
    // UI: si no, queda logueada para siempre mientras todas las peticiones dan 401.
    saveSession(null);
    throw new ApiError(401, translate('errors.noSession'));
  }

  let response = await send(path, init, session.token);
  let data = await parse(response);

  if (response.status === 401 && (data as { message?: string } | null)?.message === TOKEN_EXPIRED) {
    const token = await refreshToken();
    response = await send(path, init, token);
    data = await parse(response);
  }

  if (!response.ok) {
    if (response.status === 401) saveSession(null);
    throw toError(response.status, data);
  }
  return data as T;
}

export const api = {
  register: (input: { name: string; email: string; password: string }) =>
    publicRequest<{ user: User }>('/auth/register', input),
  login: (input: { email: string; password: string }) =>
    publicRequest<LoginResponse>('/auth/login', input),
  // Cerrar sesión en el servidor sube el `tokenVersion` del usuario, así que deja de
  // servir tanto el access token como el refresh token. Sin esta llamada, el refresh
  // token seguiría siendo válido días después de que el usuario crea que ha salido.
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<{ user: User }>('/users/me'),
  myWorkouts: () => request<{ workouts: Workout[] }>('/users/me/workouts'),
  myProgress: () => request<{ progress: Progress }>('/users/me/progress'),
  // 100 es el máximo que da la API en una página
  mySessions: () =>
    request<{ sessions: TrainingSession[]; pagination: PageInfo }>('/users/me/sessions?limit=100'),
  createMyWorkout: (name: string) =>
    request<{ workout: Workout }>('/users/me/workouts', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  myWorkout: (id: string) => request<{ workout: Workout }>(`/users/me/workouts/${id}`),
  exercise: (id: string) => request<{ exercise: Exercise }>(`/exercises/${id}`),
  updateMyWorkout: (
    id: string,
    input: {
      name: string;
      description?: string;
      days?: string[];
      exercises: Array<{ exercise: string; sets: number; reps: number }>;
    },
  ) =>
    request<{ workout: Workout }>(`/users/me/workouts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  exercises: (params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: ExerciseCategory | '';
  } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    const qs = query.toString();
    return request<{ exercises: Exercise[]; pagination: PageInfo }>(`/exercises${qs ? `?${qs}` : ''}`);
  },
  deleteMyWorkout: (id: string) => request<null>(`/users/me/workouts/${id}`, { method: 'DELETE' }),
};
