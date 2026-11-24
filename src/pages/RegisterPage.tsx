import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { AuthShell } from '../components/AuthShell';
import { useI18n } from '../i18n';

export function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t('register.mismatch'));
      return;
    }
    setBusy(true);
    try {
      await api.register({ name: name.trim(), email: email.trim(), password });
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('errors.register'));
      setBusy(false);
    }
  }

  return (
    <AuthShell title={t('register.title')} intro={t('register.intro')}>
      <form className="form" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="name">{t('common.name')}</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="password-help"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <small id="password-help" className="caption muted">
            {t('register.passwordHelp')}
          </small>
        </div>
        <div className="field">
          <label htmlFor="confirm-password">{t('register.confirm')}</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && (
          <p className="notice notice--error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="button button--primary button--block" disabled={busy}>
          {busy ? t('register.busy') : t('register.submit')}
        </button>
      </form>
      <p className="auth__alt body-sm muted">
        {t('register.haveAccount')} <Link to="/login">{t('register.toLogin')}</Link>
      </p>
    </AuthShell>
  );
}
