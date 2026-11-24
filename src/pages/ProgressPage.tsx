import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { connectRealtime } from '../api/realtime';
import type { Progress, TrainingSession } from '../types';

// Fecha y hora de un entrenamiento, por ejemplo "miércoles, 18 de noviembre de 2026, 18:00"
function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Las series de un ejercicio, por ejemplo "10 × 60 kg · 8 × 65 kg"
function formatSets(sets: TrainingSession['exercises'][number]['sets']): string {
  return sets.map((s) => `${s.reps} × ${s.weight} kg`).join(' · ');
}

export function ProgressPage() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  // Nombre de cada rutina por su id, para enseñar la rutina de cada entrenamiento
  const [workoutNames, setWorkoutNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Pide el resumen, los entrenamientos y los nombres de las rutinas a la vez
  const load = useCallback(
    () =>
      Promise.all([api.myProgress(), api.mySessions(), api.myWorkouts()])
        .then(([{ progress }, { sessions }, { workouts }]) => {
          setProgress(progress);
          setSessions(sessions);
          setWorkoutNames(Object.fromEntries(workouts.map((w) => [w._id, w.name])));
          setError(null);
        })
        .catch((e) => {
          setError(e instanceof ApiError ? e.message : 'No se ha podido cargar el progreso');
        }),
    [],
  );

  useEffect(() => {
    let closeRealtime: (() => void) | undefined;
    let cancelled = false;

    // Primero cargamos los datos y después abrimos la conexión en tiempo real:
    // si el token había caducado, la carga lo renueva y el socket se conecta ya con uno que vale.
    // Cuando llega un entrenamiento nuevo, volvemos a pedir el resumen y la lista.
    load().then(() => {
      if (!cancelled) closeRealtime = connectRealtime(load);
    });

    // Al salir de la pantalla (o cerrar sesión) se cierra la conexión
    return () => {
      cancelled = true;
      closeRealtime?.();
    };
  }, [load]);

  // Nombre de la rutina de un entrenamiento. Sin rutina, es un entrenamiento libre.
  // Si tiene rutina pero ya no está en la lista, es que se borró.
  function routineName(session: TrainingSession): string {
    if (!session.workout) return 'Entrenamiento libre';
    return workoutNames[session.workout] ?? 'Rutina borrada';
  }

  return (
    <>
      <h1 className="display-lg">Progreso</h1>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
      {!error && !progress && <p className="muted">Cargando…</p>}

      {progress && (
        <>
          <ul className="stats">
            <li className="stat">
              <span className="stat__value">{progress.totalSessions}</span>
              <span className="stat__label">Entrenamientos</span>
            </li>
            <li className="stat">
              <span className="stat__value">{progress.trainedDays.length}</span>
              <span className="stat__label">Días entrenados</span>
            </li>
            <li className="stat">
              <span className="stat__value">{progress.exercises.length}</span>
              <span className="stat__label">Ejercicios distintos</span>
            </li>
          </ul>

          {progress.exercises.length > 0 && (
            <>
              <h2 className="display-sm section-title">Ejercicios hechos</h2>
              <ul className="cards">
                {progress.exercises.map((item) => (
                  <li key={item.exercise._id} className="card card--row">
                    <span>{item.exercise.name}</span>
                    <span className="status">
                      {item.timesDone} {item.timesDone === 1 ? 'vez' : 'veces'}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2 className="display-sm section-title">Mis entrenamientos</h2>
          {sessions.length === 0 ? (
            <p className="empty">Todavía no has terminado ningún entrenamiento.</p>
          ) : (
            <ul className="cards">
              {sessions.map((session) => (
                <li key={session._id} className="card">
                  <h3 className="display-sm">{routineName(session)}</h3>
                  <p className="body-sm muted">{formatDate(session.startedAt)}</p>
                  {session.exercises
                    .filter((item) => item.exercise)
                    .map((item) => (
                      <p key={item.exercise!._id} className="body-sm">
                        <strong>{item.exercise!.name}</strong>
                        {item.sets.length > 0 && <span className="muted"> · {formatSets(item.sets)}</span>}
                      </p>
                    ))}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
