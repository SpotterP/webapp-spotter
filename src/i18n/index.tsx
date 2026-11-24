import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ca } from './ca';
import { en } from './en';
import { es } from './es';
import type { MessageKey } from './es';

export const LANGUAGES = {
  es: { name: 'Español', locale: 'es-ES' },
  ca: { name: 'Català', locale: 'ca-ES' },
  en: { name: 'English', locale: 'en-GB' },
} as const;

export type Lang = keyof typeof LANGUAGES;
export type { MessageKey };

const MESSAGES: Record<Lang, Record<MessageKey, string>> = { es, ca, en };
const STORAGE_KEY = 'spotter.lang';
const DEFAULT_LANG: Lang = 'es';

function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && value in LANGUAGES;
}

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {}
  const browser = navigator.language.slice(0, 2).toLowerCase();
  return isLang(browser) ? browser : DEFAULT_LANG;
}

let currentLang: Lang = initialLang();

type Params = Record<string, string | number>;

export function translate(key: MessageKey, params?: Params): string {
  const text = MESSAGES[currentLang][key];
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: MessageKey, params?: Params) => string;
  formatDateTime: (iso: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(currentLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    currentLang = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    setLangState(next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: translate,
      formatDateTime: (iso) =>
        new Date(iso).toLocaleString(LANGUAGES[lang].locale, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
    }),
    [lang, setLang],
  );

  return <I18nContext value={value}>{children}</I18nContext>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n debe usarse dentro de I18nProvider');
  return value;
}
