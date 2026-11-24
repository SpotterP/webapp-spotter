import { API_URL } from '../config';
import { loadSession, saveSession } from '../auth/session';
import type { Exercise, ExerciseCategory, LoginResponse, PageInfo, User, Workout } from '../types';

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
  return new ApiError(status, message ?? 'No se ha podido completar la operación');
}

async function send(path: string, init: RequestInit, token?: string): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  try {
    return await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'No se puede conectar con el servidor');
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
    if (!session) throw new ApiError(401, 'Sesión no iniciada');
    try {
      const { token } = await publicRequest<{ token: string }>('/auth/refresh', {
        refreshToken: session.refreshToken,
      });
      saveSession({ ...session, token });
      return token;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) saveSession(null);
      throw error;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = loadSession();
  if (!session) throw new ApiError(401, 'Sesión no iniciada');

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
  me: () => request<{ user: User }>('/users/me'),
  myWorkouts: () => request<{ workouts: Workout[] }>('/users/me/workouts'),
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
