import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

export function AppLayout() {
  const { user, logout } = useAuth();
  const { t } = useI18n();

  return (
    <>
      <header className="topbar">
        <div className="container topbar__inner">
          <NavLink to="/rutinas" className="topbar__logo" aria-label="Spotter">
            <Logo />
          </NavLink>
          <nav className="topbar__nav" aria-label={t('nav.main')}>
            <NavLink to="/rutinas" className="navlink">
              {t('nav.routines')}
            </NavLink>
            <NavLink to="/progreso" className="navlink">
              {t('nav.progress')}
            </NavLink>
            <NavLink to="/perfil" className="navlink">
              {t('nav.profile')}
            </NavLink>
            <NavLink to="/ajustes" className="navlink">
              {t('nav.settings')}
            </NavLink>
          </nav>
          <div className="topbar__session">
            <ThemeToggle />
            <span className="topbar__user body-sm muted">{user?.name}</span>
            <button type="button" className="button button--secondary button--small" onClick={logout}>
              {t('common.logout')}
            </button>
          </div>
        </div>
      </header>
      <main className="container page">
        <Outlet />
      </main>
    </>
  );
}
