export type PasswordStrength = 'weak' | 'medium' | 'strong';

export type PasswordCriterionId =
  | 'minChars'
  | 'uppercase'
  | 'lowercase'
  | 'numbers'
  | 'symbols';

export interface PasswordCriterion {
  id: PasswordCriterionId;
  met: boolean;
}

export interface PasswordEvaluation {
  strength: PasswordStrength;
  /** Puntuación visual de 0 a 3: 0 (vacía), 1 (débil), 2 (media), 3 (fuerte) */
  score: 0 | 1 | 2 | 3;
  criteria: PasswordCriterion[];
  /** Requisitos concretos que faltan para ser fuerte */
  missing: PasswordCriterionId[];
}

/**
 * Evalúa la fortaleza de una contraseña y determina qué le falta para ser más segura.
 *
 * Criterios:
 * - Mínimo 8 caracteres
 * - Mezclar mayúsculas ([A-Z])
 * - Mezclar minúsculas ([a-z])
 * - Incluir números ([0-9])
 * - Incluir símbolos ([^A-Za-z0-9])
 *
 * Clasificación:
 * - Débil: menos de 8 caracteres o solo 1 variedad de caracteres.
 * - Media: al menos 8 caracteres y 2 o 3 variedades de caracteres.
 * - Fuerte: al menos 8 caracteres y las 4 variedades de caracteres (mayúsculas, minúsculas, números y símbolos).
 */
export function evaluatePassword(password: string): PasswordEvaluation {
  const hasMinChars = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const criteria: PasswordCriterion[] = [
    { id: 'minChars', met: hasMinChars },
    { id: 'uppercase', met: hasUpper },
    { id: 'lowercase', met: hasLower },
    { id: 'numbers', met: hasNumber },
    { id: 'symbols', met: hasSymbol },
  ];

  const missing = criteria.filter((c) => !c.met).map((c) => c.id);

  if (password.length === 0) {
    return {
      strength: 'weak',
      score: 0,
      criteria,
      missing,
    };
  }

  const varietyCount =
    (hasUpper ? 1 : 0) +
    (hasLower ? 1 : 0) +
    (hasNumber ? 1 : 0) +
    (hasSymbol ? 1 : 0);

  if (!hasMinChars || varietyCount <= 1) {
    return {
      strength: 'weak',
      score: 1,
      criteria,
      missing,
    };
  }

  if (varietyCount === 4) {
    return {
      strength: 'strong',
      score: 3,
      criteria,
      missing,
    };
  }

  return {
    strength: 'medium',
    score: 2,
    criteria,
    missing,
  };
}
