import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import type { User } from '../types';

export function ProfilePage() {
  const { user: cachedUser, logout } = useAuth();
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then(({ user }) => {
        if (!cancelled) {
          setUser(user);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : t('errors.loadProfile'));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <>
      <h1 className="display-lg">{t('profile.title')}</h1>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
      {loading && <p className="muted">{t('common.loading')}</p>}

      {user && (
        <div className="card profile">
          <dl className="profile__info">
            <div>
              <dt className="overline muted">{t('common.name')}</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt className="overline muted">{t('common.email')}</dt>
              <dd>{user.email}</dd>
            </div>
          </dl>
          <button type="button" className="button button--secondary" onClick={logout}>
            {t('common.logout')}
          </button>
        </div>
      )}
    </>
  );
}
