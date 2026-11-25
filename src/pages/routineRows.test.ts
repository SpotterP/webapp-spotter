import { describe, expect, it } from 'vitest';
import type { Exercise } from '../types';
import {
  MISSING_EXERCISE_NAME,
  referenceId,
  resolveRow,
  toPayload,
  toRows,
  unrepresentableRows,
  unresolvedIds,
} from './routineRows';

const bench: Exercise = { _id: 'e1', name: 'Press banca' };

// El backend puede devolver la referencia vacía aunque el tipo diga `Exercise | string`.
const brokenReference = null as unknown as string;

describe('referenceId', () => {
  it('devuelve el id de una referencia poblada', () => {
    expect(referenceId(bench)).toBe('e1');
  });

  it('devuelve el id suelto cuando la referencia no se populó', () => {
    expect(referenceId('e9')).toBe('e9');
  });

  it('devuelve cadena vacía si no hay referencia', () => {
    expect(referenceId(brokenReference)).toBe('');
  });
});

describe('toRows', () => {
  it('conserva la fila de un ejercicio poblado sin marcarla como missing', () => {
    const rows = toRows([{ exercise: bench, sets: 4, reps: 10 }]);

    expect(rows).toEqual([{ exercise: bench, sets: 4, reps: 10 }]);
    expect(rows[0].missing).toBeUndefined();
  });

  it('conserva una referencia sin popular como fila missing en vez de descartarla', () => {
    const rows = toRows([{ exercise: 'e9', sets: 3, reps: 12 }]);

    expect(rows).toEqual([
      {
        exercise: { _id: 'e9', name: MISSING_EXERCISE_NAME },
        sets: 3,
        reps: 12,
        missing: true,
      },
    ]);
  });

  it('conserva la fila aunque la referencia venga vacía', () => {
    const rows = toRows([{ exercise: brokenReference, sets: 2, reps: 8 }]);

    expect(rows).toHaveLength(1);
    expect(rows[0].missing).toBe(true);
    expect(rows[0].exercise._id).toBe('');
    expect(rows[0].sets).toBe(2);
  });

  it('sin ejercicios devuelve una lista vacía', () => {
    expect(toRows()).toEqual([]);
  });
});

describe('unresolvedIds', () => {
  it('devuelve una sola consulta por ejercicio repetido', () => {
    const rows = toRows([
      { exercise: 'e9', sets: 3, reps: 10 },
      { exercise: bench, sets: 3, reps: 10 },
      { exercise: 'e9', sets: 4, reps: 6 },
    ]);

    expect(unresolvedIds(rows)).toEqual(['e9']);
  });

  it('ignora las filas sin id, que la API no puede resolver', () => {
    const rows = toRows([
      { exercise: brokenReference, sets: 3, reps: 10 },
      { exercise: 'e9', sets: 3, reps: 10 },
    ]);

    expect(unresolvedIds(rows)).toEqual(['e9']);
  });
});

describe('resolveRow', () => {
  it('reemplaza la fila pendiente y respeta series y repeticiones', () => {
    const rows = toRows([
      { exercise: 'e9', sets: 5, reps: 5 },
      { exercise: bench, sets: 3, reps: 10 },
    ]);

    expect(resolveRow(rows, { _id: 'e9', name: 'Remo con barra' })).toEqual([
      { exercise: { _id: 'e9', name: 'Remo con barra' }, sets: 5, reps: 5 },
      { exercise: bench, sets: 3, reps: 10 },
    ]);
  });

  it('no toca una fila ya resuelta que comparte el id', () => {
    const rows = toRows([{ exercise: bench, sets: 3, reps: 10 }]);

    expect(resolveRow(rows, { _id: 'e1', name: 'Press banca inclinado' })).toEqual(rows);
  });
});

describe('unrepresentableRows', () => {
  it('cuenta solo las filas sin id', () => {
    const rows = toRows([
      { exercise: bench, sets: 3, reps: 10 },
      { exercise: 'e9', sets: 4, reps: 8 },
      { exercise: brokenReference, sets: 2, reps: 8 },
    ]);

    expect(unrepresentableRows(rows)).toBe(1);
  });
});

describe('toPayload', () => {
  it('manda solo las filas con id para no guardar referencias rotas', () => {
    const rows = toRows([
      { exercise: bench, sets: 3, reps: 10 },
      { exercise: brokenReference, sets: 2, reps: 8 },
    ]);

    expect(toPayload(rows)).toEqual([{ exercise: 'e1', sets: 3, reps: 10 }]);
  });
});
