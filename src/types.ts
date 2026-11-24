export type UserRole = 'ADMIN' | 'USER';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

// Los nombres visibles de cada categoría están en src/i18n (claves `category.*`)
export const EXERCISE_CATEGORIES = [
  'CHEST',
  'BACK',
  'LEGS',
  'SHOULDERS',
  'ARMS',
  'CORE',
  'CARDIO',
] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export interface Exercise {
  _id: string;
  name: string;
  description?: string;
  category?: ExerciseCategory;
}

export interface PageInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface WorkoutExercise {
  exercise: Exercise | string;
  sets: number;
  reps: number;
}

export interface Workout {
  _id: string;
  name: string;
  description?: string;
  days: DayOfWeek[];
  exercises: WorkoutExercise[];
}

export interface ProgressExercise {
  exercise: { _id: string; name: string };
  timesDone: number;
}

/** Resumen del progreso del usuario (GET /users/me/progress). */
export interface Progress {
  totalSessions: number;
  /** Días en los que entrenó, como AAAA-MM-DD y sin repetir. */
  trainedDays: string[];
  exercises: ProgressExercise[];
}

export interface SessionSet {
  reps: number;
  weight: number;
}

export interface SessionExercise {
  /** Es null si el ejercicio ya no existe en el catálogo. */
  exercise: Exercise | null;
  sets: SessionSet[];
}

/** Un entrenamiento realizado (GET /users/me/sessions). */
export interface TrainingSession {
  _id: string;
  /** Id de la rutina que se hizo. No existe si el entrenamiento se empezó de cero. */
  workout?: string;
  startedAt: string;
  finishedAt: string;
  exercises: SessionExercise[];
}
