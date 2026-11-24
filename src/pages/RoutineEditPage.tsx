import { useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { ExercisePicker } from '../components/ExercisePicker';
import type { Exercise } from '../types';

interface Row {
  exercise: Exercise;
  sets: number;
  reps: number;
}

export function RoutineEditPage() {
  const { id } = useParams();

  const [name, setName] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
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
        setRows(
          workout.exercises.flatMap((item) =>
            typeof item.exercise === 'object' && item.exercise
              ? [{ exercise: item.exercise, sets: item.sets, reps: item.reps }]
              : [],
          ),
        );
        setLoaded(true);
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

  function changeRows(next: Row[]) {
    setRows(next);
    setSaved(false);
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
    setError(null);
    setSaving(true);
    try {
      await api.updateMyWorkout(id, {
        name: name.trim(),
        exercises: rows.map((r) => ({ exercise: r.exercise._id, sets: r.sets, reps: r.reps })),
      });
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
              <li key={row.exercise._id} className="exercise-row">
                <span className="exercise-row__name">{row.exercise.name}</span>
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

      <ExercisePicker open={picking} onPick={onPickExercise} onClose={() => setPicking(false)} />
    </>
  );
}
