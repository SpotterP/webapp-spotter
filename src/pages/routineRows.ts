import type { Exercise, WorkoutExercise } from '../types';

export interface RoutineRow {
  exercise: Exercise;
  sets: number;
  reps: number;
  /**
   * La rutina guarda una referencia a un ejercicio que el catálogo ya no devuelve
   * (o que llegó como id suelto y no se pudo resolver). La fila se muestra igual
   * para no borrarla sin que el usuario lo vea.
   */
  missing?: boolean;
}

export const MISSING_EXERCISE_NAME = 'Ejercicio no disponible';

/** Id de una referencia, venga populada (objeto) o como id suelto. */
export function referenceId(reference: WorkoutExercise['exercise']): string {
  return typeof reference === 'string' ? reference : (reference?._id ?? '');
}

/**
 * Convierte los ejercicios que devuelve la API en filas del editor sin descartar
 * ninguna: una referencia que no se pudo popular se conserva marcada como `missing`.
 */
export function toRows(exercises: WorkoutExercise[] = []): RoutineRow[] {
  return exercises.map((item) => {
    const reference = item.exercise;

    if (reference && typeof reference === 'object') {
      return { exercise: reference, sets: item.sets, reps: item.reps };
    }

    return {
      exercise: { _id: referenceId(reference), name: MISSING_EXERCISE_NAME },
      sets: item.sets,
      reps: item.reps,
      missing: true,
    };
  });
}

/** Ids de las filas sin resolver que todavía se pueden recuperar consultando la API. */
export function unresolvedIds(rows: RoutineRow[]): string[] {
  const ids = rows.filter((row) => row.missing && row.exercise._id).map((row) => row.exercise._id);
  // Un mismo id puede repetirse: basta con una consulta por ejercicio.
  return [...new Set(ids)];
}

/** Reemplaza una fila sin resolver por el ejercicio real que devolvió la API. */
export function resolveRow(rows: RoutineRow[], exercise: Exercise): RoutineRow[] {
  return rows.map((row) =>
    row.missing && row.exercise._id === exercise._id
      ? { exercise, sets: row.sets, reps: row.reps }
      : row,
  );
}

/** Filas que no se pueden guardar: sin id no hay forma de conservar la referencia. */
export function unrepresentableRows(rows: RoutineRow[]): number {
  return rows.filter((row) => !row.exercise._id).length;
}

/** Payload del PUT: solo filas con id, para que una referencia rota nunca se pierda en silencio. */
export function toPayload(
  rows: RoutineRow[],
): Array<{ exercise: string; sets: number; reps: number }> {
  return rows
    .filter((row) => row.exercise._id)
    .map((row) => ({ exercise: row.exercise._id, sets: row.sets, reps: row.reps }));
}
