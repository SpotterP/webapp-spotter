import type { ReactNode } from 'react';
import { LanguageSelect } from './LanguageSelect';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

export function AuthShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="auth">
      <div className="auth__tools">
        <LanguageSelect id="auth-lang" compact />
        <ThemeToggle />
      </div>
      <div className="auth__card">
        <div className="auth__logo">
          <Logo height={30} />
        </div>
        <h1 className="display-md">{title}</h1>
        <p className="muted auth__intro">{intro}</p>
        {children}
      </div>
    </main>
  );
}
