import { useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { Exercise } from '../types';

// Un ejercicio de la rutina que se está editando: el ejercicio del catálogo y sus series y repeticiones
interface Row {
  exercise: Exercise;
  sets: number;
  reps: number;
}

export function RoutineEditPage() {
  const { id } = useParams();

  const [name, setName] = useState('');
  // El orden de este array es el orden de los ejercicios de la rutina
  const [rows, setRows] = useState<Row[]>([]);
  // Todos los ejercicios del catálogo, para el selector
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  // Id del ejercicio elegido en el selector
  const [selected, setSelected] = useState('');

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Al abrir la pantalla cargamos la rutina y el catálogo a la vez
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([api.myWorkout(id), api.exercises()])
      .then(([{ workout }, { exercises }]) => {
        if (cancelled) return;
        setName(workout.name);
        setCatalog(exercises);
        // La rutina trae el ejercicio completo (populate). Si ya no existe en el catálogo, se salta.
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

  // En el selector solo se ofrecen los ejercicios que todavía no están en la rutina
  const available = catalog.filter((e) => !rows.some((r) => r.exercise._id === e._id));

  // Cualquier cambio en la rutina oculta el aviso de "guardado"
  function changeRows(next: Row[]) {
    setRows(next);
    setSaved(false);
  }

  // Añade el ejercicio elegido al final, con 3 series de 10 por defecto
  function addExercise() {
    const exercise = catalog.find((e) => e._id === selected);
    if (!exercise) return;
    changeRows([...rows, { exercise, sets: 3, reps: 10 }]);
    setSelected('');
  }

  // Cambia las series o las repeticiones de un ejercicio
  function updateRow(index: number, field: 'sets' | 'reps', value: number) {
    changeRows(rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  // Cambia el orden: intercambia el ejercicio con el de arriba (-1) o el de abajo (1)
  function move(index: number, direction: -1 | 1) {
    const next = [...rows];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    changeRows(next);
  }

  // Quita un ejercicio de la rutina
  function remove(index: number) {
    changeRows(rows.filter((_, i) => i !== index));
  }

  // Guarda el nombre y los ejercicios con PUT /users/me/workouts/:id.
  // El navegador ya comprueba que el nombre no está vacío y que series y repeticiones son 1 o más.
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

          {/* Selector de ejercicios del catálogo */}
          <div className="picker">
            <div className="field picker__field">
              <label htmlFor="exercise-picker">Añadir ejercicio</label>
              <select
                id="exercise-picker"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Elige un ejercicio</option>
                {available.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={addExercise}
              disabled={!selected}
            >
              Añadir
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
    </>
  );
}
