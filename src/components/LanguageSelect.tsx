import { LANGUAGES, useI18n } from '../i18n';
import type { Lang } from '../i18n';

export function LanguageSelect({ id, compact = false }: { id: string; compact?: boolean }) {
  const { lang, setLang, t } = useI18n();

  return (
    <select
      id={id}
      className={compact ? 'lang-select' : undefined}
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      aria-label={compact ? t('lang.label') : undefined}
    >
      {(Object.keys(LANGUAGES) as Lang[]).map((code) => (
        <option key={code} value={code}>
          {LANGUAGES[code].name}
        </option>
      ))}
    </select>
  );
}
