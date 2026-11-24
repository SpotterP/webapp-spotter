import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useI18n } from '../i18n';
import { EXERCISE_CATEGORIES } from '../types';
import type { Exercise, ExerciseCategory, PageInfo } from '../types';

const PAGE_SIZE = 8;

export function ExercisePicker({
  open,
  excludeIds = [],
  onPick,
  onClose,
}: {
  open: boolean;
  excludeIds?: string[];
  onPick: (exercise: Exercise) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ExerciseCategory | ''>('');
  const [page, setPage] = useState(1);
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [pagination, setPagination] = useState<PageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(text.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [text]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api
      .exercises({ page, limit: PAGE_SIZE, search, category })
      .then((result) => {
        if (cancelled) return;
        setExercises(result.exercises);
        setPagination(result.pagination);
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : t('errors.loadCatalog'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, page, search, category, t]);

  return (
    <dialog
      ref={ref}
      className="dialog dialog--wide"
      onCancel={onClose}
      aria-labelledby="picker-title"
    >
      <h2 id="picker-title" className="display-sm">
        {t('picker.title')}
      </h2>

      <div className="picker__filters">
        <div className="field">
          <label htmlFor="picker-search">{t('picker.search')}</label>
          <input
            id="picker-search"
            type="search"
            placeholder={t('picker.searchPlaceholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="picker-category">{t('picker.category')}</label>
          <select
            id="picker-category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as ExerciseCategory | '');
              setPage(1);
            }}
          >
            <option value="">{t('picker.all')}</option>
            {EXERCISE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`category.${c}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
      {!error && !exercises && <p className="muted">{t('common.loading')}</p>}
      {!error && exercises && exercises.length === 0 && (
        <p className="empty">{t('picker.empty')}</p>
      )}
      {exercises && exercises.length > 0 && (
        <ul className="picker__list">
          {exercises.map((ex) => {
            const added = excludeIds.includes(ex._id);
            return (
              <li key={ex._id}>
                <button
                  type="button"
                  className="picker__item"
                  disabled={added}
                  onClick={() => onPick(ex)}
                >
                  <span>{ex.name}</span>
                  <span className="status">
                    {added
                      ? t('picker.added')
                      : ex.category
                        ? t(`category.${ex.category}`)
                        : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="picker__pager">
          <button
            type="button"
            className="button button--secondary button--small"
            disabled={!pagination.hasPrevPage}
            onClick={() => setPage(page - 1)}
          >
            {t('picker.prev')}
          </button>
          <span className="body-sm muted">
            {t('picker.page', { page: pagination.page, total: pagination.totalPages })}
          </span>
          <button
            type="button"
            className="button button--secondary button--small"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage(page + 1)}
          >
            {t('picker.next')}
          </button>
        </div>
      )}

      <div className="dialog__actions">
        <button type="button" className="button button--secondary" onClick={onClose}>
          {t('common.close')}
        </button>
      </div>
    </dialog>
  );
}
