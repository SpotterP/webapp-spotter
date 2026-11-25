import { describe, expect, it } from 'vitest';
import { validateRegisterForm } from './registerValidation';

describe('validateRegisterForm', () => {
  it('falla si el nombre o el email están vacíos', () => {
    const sinNombre = validateRegisterForm({
      name: '',
      email: 'marta@example.com',
      password: 'Password123!',
      confirm: 'Password123!',
    });
    expect(sinNombre.valid).toBe(false);
    expect(sinNombre.errorKey).toBe('errors.generic');

    const sinEmail = validateRegisterForm({
      name: 'Marta',
      email: '   ',
      password: 'Password123!',
      confirm: 'Password123!',
    });
    expect(sinEmail.valid).toBe(false);
    expect(sinEmail.errorKey).toBe('errors.generic');
  });

  it('no permite enviar si la contraseña tiene menos de 8 caracteres e indica que faltan caracteres', () => {
    const res = validateRegisterForm({
      name: 'Marta',
      email: 'marta@example.com',
      password: 'corta',
      confirm: 'corta',
    });
    expect(res.valid).toBe(false);
    expect(res.field).toBe('password');
    expect(res.errorKey).toBe('register.passwordTooShort');
  });

  it('no permite enviar si las dos contraseñas no coinciden', () => {
    const res = validateRegisterForm({
      name: 'Marta',
      email: 'marta@example.com',
      password: 'Password123!',
      confirm: 'Diferente123!',
    });
    expect(res.valid).toBe(false);
    expect(res.field).toBe('confirm');
    expect(res.errorKey).toBe('register.mismatch');
  });

  it('permite enviar si la contraseña tiene al menos 8 caracteres y coincide', () => {
    const res = validateRegisterForm({
      name: 'Marta',
      email: 'marta@example.com',
      password: 'Password123!',
      confirm: 'Password123!',
    });
    expect(res.valid).toBe(true);
    expect(res.errorKey).toBeUndefined();
  });
});
