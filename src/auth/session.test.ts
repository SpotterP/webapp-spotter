import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadSession, saveSession, subscribeSession } from './session';
import type { Session } from './session';

const KEY = 'spotter.session';

const validSession: Session = {
  token: 'token-1',
  refreshToken: 'refresh-1',
  user: { _id: 'u1', name: 'Ana', email: 'ana@example.com', role: 'USER' },
};

class MemoryStorage {
  private readonly data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}

function useStorage(storage: unknown): void {
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
}

let storage: MemoryStorage;
const unsubscribes: Array<() => void> = [];

beforeEach(() => {
  storage = new MemoryStorage();
  useStorage(storage);
});

afterEach(() => {
  while (unsubscribes.length > 0) unsubscribes.pop()?.();
  Reflect.deleteProperty(globalThis, 'localStorage');
});

describe('loadSession', () => {
  it('no devuelve nada si no hay sesión guardada', () => {
    expect(loadSession()).toBeNull();
  });

  it('devuelve la sesión cuando trae los cuatro campos', () => {
    storage.setItem(KEY, JSON.stringify(validSession));

    expect(loadSession()).toEqual(validSession);
  });

  it('descarta y borra un JSON que no se puede leer', () => {
    storage.setItem(KEY, '{no es json');

    expect(loadSession()).toBeNull();
    expect(storage.getItem(KEY)).toBeNull();
  });

  it('descarta y borra una sesión sin refreshToken', () => {
    const partial: Partial<Session> = { token: 'token-1', user: validSession.user };
    storage.setItem(KEY, JSON.stringify(partial));

    expect(loadSession()).toBeNull();
    expect(storage.getItem(KEY)).toBeNull();
  });

  it('descarta una sesión con un rol desconocido', () => {
    storage.setItem(
      KEY,
      JSON.stringify({ ...validSession, user: { ...validSession.user, role: 'ROOT' } }),
    );

    expect(loadSession()).toBeNull();
    expect(storage.getItem(KEY)).toBeNull();
  });

  it('no rompe cuando el almacenamiento no deja leer', () => {
    useStorage({
      getItem() {
        throw new Error('bloqueado');
      },
    });

    expect(loadSession()).toBeNull();
  });
});

describe('saveSession', () => {
  it('guarda la sesión y avisa a los suscriptores', () => {
    const seen: Array<Session | null> = [];
    unsubscribes.push(subscribeSession((session) => seen.push(session)));

    expect(saveSession(validSession)).toBe(true);

    expect(JSON.parse(storage.getItem(KEY) ?? 'null')).toEqual(validSession);
    expect(seen).toEqual([validSession]);
  });

  it('borra la sesión y avisa del cierre', () => {
    storage.setItem(KEY, JSON.stringify(validSession));
    const seen: Array<Session | null> = [];
    unsubscribes.push(subscribeSession((session) => seen.push(session)));

    expect(saveSession(null)).toBe(true);

    expect(storage.getItem(KEY)).toBeNull();
    expect(seen).toEqual([null]);
  });

  it('deja de avisar al darse de baja', () => {
    const seen: Array<Session | null> = [];
    subscribeSession((session) => seen.push(session))();

    saveSession(validSession);

    expect(seen).toEqual([]);
  });

  it('avisa del fallo sin dar la sesión por guardada cuando no se puede escribir', () => {
    useStorage({
      setItem() {
        throw new Error('sin espacio');
      },
      removeItem() {},
    });
    const seen: Array<Session | null> = [];
    unsubscribes.push(subscribeSession((session) => seen.push(session)));

    expect(saveSession(validSession)).toBe(false);
    expect(seen).toEqual([]);
  });
});
