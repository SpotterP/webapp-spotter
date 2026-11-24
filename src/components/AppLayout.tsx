import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Logo } from './Logo';

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="topbar">
        <div className="container topbar__inner">
          <NavLink to="/rutinas" className="topbar__logo" aria-label="Spotter">
            <Logo />
          </NavLink>
          <nav className="topbar__nav" aria-label="Principal">
            <NavLink to="/rutinas" className="navlink">
              Mis rutinas
            </NavLink>
            <NavLink to="/perfil" className="navlink">
              Perfil
            </NavLink>
          </nav>
          <div className="topbar__session">
            <span className="topbar__user body-sm muted">{user?.name}</span>
            <button type="button" className="button button--secondary button--small" onClick={() => void logout()}>
              Cerrar sesión
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
