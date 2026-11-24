import { useState } from 'react';

const STORAGE_KEY = 'theme';

function isLight(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'light';
}

export function ThemeToggle({ floating = false }: { floating?: boolean }) {
  const [light, setLight] = useState(isLight);

  function toggle() {
    const next = !light;
    if (next) document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'light' : 'dark');
    } catch {}
    setLight(next);
  }

  const label = light ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro';

  return (
    <button
      type="button"
      className={`button button--secondary theme-toggle${floating ? ' theme-toggle--floating' : ''}`}
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <svg className="icon--sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      <svg className="icon--moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  );
}
