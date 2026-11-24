import { useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { ExercisePicker } from '../components/ExercisePicker';
import type { Exercise } from '../types';
import {
  MISSING_EXERCISE_NAME,
  resolveRow,
  toPayload,
  toRows,
  unrepresentableRows,
  unresolvedIds,
} from './routineRows';
import type { RoutineRow } from './routineRows';

export function RoutineEditPage() {
  const { id } = useParams();

  const [name, setName] = useState('');
  const [rows, setRows] = useState<RoutineRow[]>([]);
  const [picking, setPicking] = useState(false);

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api
      .myWorkout(id)
      .then(({ workout }) => {
        if (cancelled) return;
        setName(workout.name);
        // Ninguna referencia se descarta: las que la API no populó quedan marcadas
        // como `missing` para que el guardado no las borre sin avisar.
        const nextRows = toRows(workout.exercises);
        setRows(nextRows);
        setLoaded(true);

        // Las que llegaron como id suelto todavía se pueden recuperar del catálogo.
        for (const exerciseId of unresolvedIds(nextRows)) {
          api
            .exercise(exerciseId)
            .then(({ exercise }) => {
              if (!cancelled) setRows((current) => resolveRow(current, exercise));
            })
            .catch(() => {
              /* sigue marcada como `missing`: se muestra y se avisa al guardar */
            });
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'No se ha podido cargar la rutina');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function changeRows(next: RoutineRow[]) {
    setRows(next);
    setSaved(false);
    setError(null);
  }

  function onPickExercise(exercise: Exercise) {
    setPicking(false);
    if (rows.some((r) => r.exercise._id === exercise._id)) return;
    changeRows([...rows, { exercise, sets: 3, reps: 10 }]);
  }

  function updateRow(index: number, field: 'sets' | 'reps', value: number) {
    changeRows(rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...rows];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    changeRows(next);
  }

  function remove(index: number) {
    changeRows(rows.filter((_, i) => i !== index));
  }

  async function onSave(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;

    // Un ejercicio que ya no está en el catálogo no se puede conservar si perdimos
    // su id; guardar en ese estado lo borraría de la rutina sin decirlo.
    if (unrepresentableRows(rows) > 0) {
      setError(
        'Hay un ejercicio que ya no existe en el catálogo. Quítalo de la rutina para poder guardar.',
      );
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await api.updateMyWorkout(id, { name: name.trim(), exercises: toPayload(rows) });
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se han podido guardar los cambios');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Link to="/rutinas" className="body-sm">
        ← Mis rutinas
      </Link>
      <h1 className="display-lg">Editar rutina</h1>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
      {!loaded && !error && <p className="muted">Cargando…</p>}

      {loaded && (
        <form className="editor" onSubmit={onSave}>
          <div className="field">
            <label htmlFor="routine-name">Nombre</label>
            <input
              id="routine-name"
              type="text"
              required
              maxLength={80}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
            />
          </div>

          <h2 className="display-sm">Ejercicios</h2>

          {rows.length === 0 && (
            <p className="empty">Esta rutina no tiene ejercicios. Añade el primero.</p>
          )}

          <ol className="exercise-list">
            {rows.map((row, index) => (
              <li
                key={row.exercise._id || `missing-${index}`}
                className={`exercise-row${row.missing ? ' exercise-row--missing' : ''}`}
              >
                <span className="exercise-row__name">
                  {row.missing ? MISSING_EXERCISE_NAME : row.exercise.name}
                </span>
                <div className="field exercise-row__num">
                  <label htmlFor={`sets-${index}`}>Series</label>
                  <input
                    id={`sets-${index}`}
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={row.sets}
                    onChange={(e) => updateRow(index, 'sets', e.target.valueAsNumber)}
                  />
                </div>
                <div className="field exercise-row__num">
                  <label htmlFor={`reps-${index}`}>Reps</label>
                  <input
                    id={`reps-${index}`}
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={row.reps}
                    onChange={(e) => updateRow(index, 'reps', e.target.valueAsNumber)}
                  />
                </div>
                <div className="exercise-row__actions">
                  <button
                    type="button"
                    className="button button--secondary button--small"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Subir ${row.exercise.name}`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="button button--secondary button--small"
                    onClick={() => move(index, 1)}
                    disabled={index === rows.length - 1}
                    aria-label={`Bajar ${row.exercise.name}`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="button button--secondary button--small"
                    onClick={() => remove(index)}
                    aria-label={`Quitar ${row.exercise.name}`}
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ol>

          {rows.some((row) => row.missing) && (
            <p className="notice notice--error" role="alert">
              Algún ejercicio de esta rutina ya no está en el catálogo. Se muestra para que no se
              pierda sin que lo veas: quítalo si ya no lo quieres.
            </p>
          )}

          <div>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setPicking(true)}
            >
              Añadir ejercicio
            </button>
          </div>

          {saved && (
            <p className="notice notice--ok" role="status">
              Cambios guardados.
            </p>
          )}

          <div>
            <button type="submit" className="button button--primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}

      <ExercisePicker
        open={picking}
        excludeIds={rows.map((r) => r.exercise._id)}
        onPick={onPickExercise}
        onClose={() => setPicking(false)}
      />
    </>
  );
}
