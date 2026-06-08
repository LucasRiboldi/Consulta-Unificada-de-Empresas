import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  loadUserKeys,
  saveUserKey,
  getRetencaoDias,
  saveRetencaoDias,
  setPendingCnpj,
  takePendingCnpj,
} from '@/storage/settings.store';

function fakeChromeStorage() {
  const store = new Map<string, unknown>();
  return {
    storage: {
      local: {
        get: async (key: string) => ({ [key]: store.get(key) }),
        set: async (obj: Record<string, unknown>) => {
          for (const [k, v] of Object.entries(obj)) store.set(k, v);
        },
        remove: async (key: string) => {
          store.delete(key);
        },
      },
    },
  };
}

beforeEach(() => {
  vi.stubGlobal('chrome', fakeChromeStorage());
});

describe('settings.store — user keys (BYOK)', () => {
  test('saves and loads a user key (merging)', async () => {
    expect(await loadUserKeys()).toEqual({});
    await saveUserKey('transparencia', 'ABC');
    expect(await loadUserKeys()).toEqual({ transparencia: 'ABC' });
  });
});

describe('settings.store — retenção', () => {
  test('returns the default when unset and persists a new value', async () => {
    expect(await getRetencaoDias(180)).toBe(180);
    await saveRetencaoDias(30);
    expect(await getRetencaoDias(180)).toBe(30);
  });
});

describe('settings.store — pending CNPJ', () => {
  test('round-trips and is consumed once', async () => {
    await setPendingCnpj('00000000000191');
    expect(await takePendingCnpj()).toBe('00000000000191');
    expect(await takePendingCnpj()).toBeNull();
  });
});
