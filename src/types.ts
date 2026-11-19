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

export const EXERCISE_CATEGORY_LABELS = {
  CHEST: 'Pecho',
  BACK: 'Espalda',
  LEGS: 'Piernas',
  SHOULDERS: 'Hombros',
  ARMS: 'Brazos',
  CORE: 'Core',
  CARDIO: 'Cardio',
} as const;
export type ExerciseCategory = keyof typeof EXERCISE_CATEGORY_LABELS;
export const EXERCISE_CATEGORIES = Object.keys(EXERCISE_CATEGORY_LABELS) as ExerciseCategory[];

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
