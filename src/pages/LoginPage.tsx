import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AuthShell } from '../components/AuthShell';
import { useI18n } from '../i18n';

interface LocationState {
  from?: string;
  registered?: boolean;
}

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const state = (useLocation().state ?? {}) as LocationState;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(state.from && state.from !== '/login' ? state.from : '/rutinas', { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('errors.login'));
      setBusy(false);
    }
  }

  return (
    <AuthShell title={t('login.title')} intro={t('login.intro')}>
      {state.registered && (
        <p className="notice notice--ok" role="status">
          {t('login.registered')}
        </p>
      )}
      <form className="form" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="email">{t('common.email')}</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="password">{t('common.password')}</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p className="notice notice--error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="button button--primary button--block" disabled={busy}>
          {busy ? t('login.busy') : t('login.submit')}
        </button>
      </form>
      <p className="auth__alt body-sm muted">
        {t('login.noAccount')} <Link to="/registro">{t('login.toRegister')}</Link>
      </p>
    </AuthShell>
  );
}
