import { describe, expect, it } from 'vitest';
import { evaluatePassword } from './passwordStrength';

describe('evaluatePassword', () => {
  it('contraseña vacía devuelve débil con puntuación 0 y todos los criterios pendientes', () => {
    const res = evaluatePassword('');
    expect(res.strength).toBe('weak');
    expect(res.score).toBe(0);
    expect(res.missing).toEqual(['minChars', 'uppercase', 'lowercase', 'numbers', 'symbols']);
  });

  it('contraseña corta (< 8 caracteres) siempre es débil e indica que faltan caracteres', () => {
    const res = evaluatePassword('Ab1!');
    expect(res.strength).toBe('weak');
    expect(res.score).toBe(1);
    expect(res.missing).toContain('minChars');
    expect(res.missing).not.toContain('uppercase');
    expect(res.missing).not.toContain('lowercase');
    expect(res.missing).not.toContain('numbers');
    expect(res.missing).not.toContain('symbols');
  });

  it('contraseña de 8 caracteres con solo una variedad es débil', () => {
    const res = evaluatePassword('abcdefgh');
    expect(res.strength).toBe('weak');
    expect(res.score).toBe(1);
    expect(res.missing).toEqual(['uppercase', 'numbers', 'symbols']);
  });

  it('contraseña de 8 caracteres con mayúsculas y minúsculas es media', () => {
    const res = evaluatePassword('Abcdefgh');
    expect(res.strength).toBe('medium');
    expect(res.score).toBe(2);
    expect(res.missing).toEqual(['numbers', 'symbols']);
  });

  it('contraseña de 8 caracteres con letras y números es media', () => {
    const res = evaluatePassword('Abcdef12');
    expect(res.strength).toBe('medium');
    expect(res.score).toBe(2);
    expect(res.missing).toEqual(['symbols']);
  });

  it('contraseña de 8 o más caracteres con mayúsculas, minúsculas, números y símbolos es fuerte', () => {
    const res = evaluatePassword('Spotter#2026');
    expect(res.strength).toBe('strong');
    expect(res.score).toBe(3);
    expect(res.missing).toHaveLength(0);
  });

  it('identifica correctamente qué le falta de forma concreta cuando no es fuerte', () => {
    const soloNumeros = evaluatePassword('12345678');
    expect(soloNumeros.missing).toEqual(['uppercase', 'lowercase', 'symbols']);

    const sinMayusculas = evaluatePassword('spotter123!');
    expect(sinMayusculas.missing).toEqual(['uppercase']);

    const sinNumeros = evaluatePassword('Spotter!gym');
    expect(sinNumeros.missing).toEqual(['numbers']);
  });
});
