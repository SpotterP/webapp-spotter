import { evaluatePassword, type PasswordCriterionId } from '../auth/passwordStrength';
import { useI18n } from '../i18n';
import type { MessageKey } from '../i18n/es';

interface PasswordStrengthMeterProps {
  password: string;
}

const CRITERION_LABEL_KEYS: Record<PasswordCriterionId, MessageKey> = {
  minChars: 'register.strength.minChars',
  uppercase: 'register.strength.uppercase',
  lowercase: 'register.strength.lowercase',
  numbers: 'register.strength.numbers',
  symbols: 'register.strength.symbols',
};

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { t } = useI18n();

  if (!password) {
    return null;
  }

  const evaluation = evaluatePassword(password);

  const strengthLabels = {
    weak: t('register.strength.weak'),
    medium: t('register.strength.medium'),
    strong: t('register.strength.strong'),
  };

  const missingLabels = evaluation.missing.map((id) => t(CRITERION_LABEL_KEYS[id]));

  return (
    <div className="password-strength" aria-live="polite">
      <div className="password-strength__header">
        <span className="caption muted">{t('register.strength.label')}</span>
        <span
          className={`password-strength__badge password-strength__badge--${evaluation.strength}`}
        >
          {strengthLabels[evaluation.strength]}
        </span>
      </div>

      <div
        className="password-strength__bars"
        role="meter"
        aria-label={t('register.strength.label')}
        aria-valuenow={evaluation.score}
        aria-valuemin={0}
        aria-valuemax={3}
      >
        <div
          className={`password-strength__bar ${
            evaluation.score >= 1 ? `is-active is-${evaluation.strength}` : ''
          }`}
        />
        <div
          className={`password-strength__bar ${
            evaluation.score >= 2 ? `is-active is-${evaluation.strength}` : ''
          }`}
        />
        <div
          className={`password-strength__bar ${
            evaluation.score >= 3 ? `is-active is-${evaluation.strength}` : ''
          }`}
        />
      </div>

      {evaluation.strength !== 'strong' ? (
        <p className="password-strength__feedback password-strength__feedback--missing">
          <span>{t('register.strength.missingPrefix')} </span>
          <strong>{missingLabels.join(', ')}.</strong>
        </p>
      ) : (
        <p className="password-strength__feedback password-strength__feedback--ok">
          ✓ {t('register.strength.allGood')}
        </p>
      )}
    </div>
  );
}
