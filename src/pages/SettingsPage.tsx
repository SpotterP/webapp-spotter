import { useSyncExternalStore } from 'react';
import { LanguageSelect } from '../components/LanguageSelect';
import { useI18n } from '../i18n';
import { getTheme, setTheme, subscribeTheme } from '../theme';
import type { Theme } from '../theme';

export function SettingsPage() {
  const { t } = useI18n();
  const theme = useSyncExternalStore(subscribeTheme, getTheme);

  const themes: Array<{ value: Theme; label: string }> = [
    { value: 'dark', label: t('settings.themeDark') },
    { value: 'light', label: t('settings.themeLight') },
  ];

  return (
    <>
      <h1 className="display-lg">{t('settings.title')}</h1>

      <div className="card settings">
        <div className="field">
          <label htmlFor="settings-lang">{t('settings.language')}</label>
          <LanguageSelect id="settings-lang" />
          <small className="caption muted">{t('settings.languageHelp')}</small>
        </div>

        <fieldset className="field settings__theme">
          <legend>{t('settings.theme')}</legend>
          <div className="segmented">
            {themes.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`button button--secondary${theme === option.value ? ' is-active' : ''}`}
                aria-pressed={theme === option.value}
                onClick={() => setTheme(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <small className="caption muted">{t('settings.themeHelp')}</small>
        </fieldset>
      </div>
    </>
  );
}
