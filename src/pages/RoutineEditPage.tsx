import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { ExercisePicker } from '../components/ExercisePicker';
import type { Exercise, Workout } from '../types';

const DEFAULT_SETS = 3;
const DEFAULT_REPS = 10;

export function RoutineEditPage() {
  const { id } = useParams();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api
      .myWorkout(id)
      .then(({ workout }) => {
        if (!cancelled) setWorkout(workout);
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

  async function onPick(exercise: Exercise) {
    if (!id || !workout || saving) return;
    setPicking(false);
    setSaving(true);
    setError(null);
    try {
      const { workout: updated } = await api.updateMyWorkout(id, {
        name: workout.name,
        description: workout.description,
        days: workout.days,
        exercises: [
          ...workout.exercises.map((we) => ({
            exercise: typeof we.exercise === 'string' ? we.exercise : we.exercise._id,
            sets: we.sets,
            reps: we.reps,
          })),
          { exercise: exercise._id, sets: DEFAULT_SETS, reps: DEFAULT_REPS },
        ],
      });
      setWorkout(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se ha podido añadir el ejercicio');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Link to="/rutinas" className="body-sm">
        ← Mis rutinas
      </Link>
      <h1 className="display-lg">{workout?.name ?? 'Editar rutina'}</h1>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
      {!error && !workout && <p className="muted">Cargando…</p>}

      {workout && (
        <>
          {workout.exercises.length === 0 ? (
            <p className="empty">Esta rutina todavía no tiene ejercicios.</p>
          ) : (
            <ul className="exercise-list">
              {workout.exercises.map((we, i) => (
                <li key={i}>
                  <span>{typeof we.exercise === 'string' ? we.exercise : we.exercise.name}</span>
                  <span className="muted">
                    {we.sets} × {we.reps}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="button button--primary"
            onClick={() => setPicking(true)}
            disabled={saving}
          >
            {saving ? 'Añadiendo…' : 'Añadir ejercicio'}
          </button>
        </>
      )}

      <ExercisePicker open={picking} onPick={onPick} onClose={() => setPicking(false)} />
    </>
  );
}
