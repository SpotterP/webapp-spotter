import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { connectRealtime } from '../api/realtime';
import { useI18n } from '../i18n';
import type { Progress, TrainingSession } from '../types';

// Las series de un ejercicio, por ejemplo "10 × 60 kg · 8 × 65 kg"
function formatSets(sets: TrainingSession['exercises'][number]['sets']): string {
  return sets.map((s) => `${s.reps} × ${s.weight} kg`).join(' · ');
}

export function ProgressPage() {
  const { t } = useI18n();
  const { formatDateTime } = useI18n();
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
          setError(e instanceof ApiError ? e.message : t('errors.loadProgress'));
        }),
    [t],
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
    if (!session.workout) return t('progress.free');
    return workoutNames[session.workout] ?? t('progress.deleted');
  }

  return (
    <>
      <h1 className="display-lg">{t('progress.title')}</h1>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
      {!error && !progress && <p className="muted">{t('common.loading')}</p>}

      {progress && (
        <>
          <ul className="stats">
            <li className="stat">
              <span className="stat__value">{progress.totalSessions}</span>
              <span className="stat__label">{t('progress.sessions')}</span>
            </li>
            <li className="stat">
              <span className="stat__value">{progress.trainedDays.length}</span>
              <span className="stat__label">{t('progress.days')}</span>
            </li>
            <li className="stat">
              <span className="stat__value">{progress.exercises.length}</span>
              <span className="stat__label">{t('progress.distinct')}</span>
            </li>
          </ul>

          {progress.exercises.length > 0 && (
            <>
              <h2 className="display-sm section-title">{t('progress.done')}</h2>
              <ul className="cards">
                {progress.exercises.map((item) => (
                  <li key={item.exercise._id} className="card card--row">
                    <span>{item.exercise.name}</span>
                    <span className="status">
                      {t(item.timesDone === 1 ? 'progress.timeOne' : 'progress.timeMany', { n: item.timesDone })}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2 className="display-sm section-title">{t('progress.mine')}</h2>
          {sessions.length === 0 ? (
            <p className="empty">{t('progress.none')}</p>
          ) : (
            <ul className="cards">
              {sessions.map((session) => (
                <li key={session._id} className="card">
                  <h3 className="display-sm">{routineName(session)}</h3>
                  <p className="body-sm muted">{formatDateTime(session.startedAt)}</p>
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
