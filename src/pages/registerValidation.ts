export interface RegisterValidationInput {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

export interface RegisterValidationResult {
  valid: boolean;
  field?: 'name' | 'email' | 'password' | 'confirm';
  errorKey?: 'register.passwordTooShort' | 'register.mismatch' | 'errors.generic';
}

/**
 * Valida los datos del formulario de registro antes de enviar la petición a la API.
 * Comprueba que los campos obligatorios estén presentes, que la contraseña tenga
 * la longitud mínima exigida (8 caracteres) y que la confirmación coincida.
 */
export function validateRegisterForm(input: RegisterValidationInput): RegisterValidationResult {
  if (!input.name.trim() || !input.email.trim()) {
    return { valid: false, errorKey: 'errors.generic' };
  }

  if (input.password.length < 8) {
    return {
      valid: false,
      field: 'password',
      errorKey: 'register.passwordTooShort',
    };
  }

  if (input.password !== input.confirm) {
    return {
      valid: false,
      field: 'confirm',
      errorKey: 'register.mismatch',
    };
  }

  return { valid: true };
}
