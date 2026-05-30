import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

import * as SecureStore from 'expo-secure-store';
import { loadSession, resetSessionCacheForTests, saveSession } from './authStorage';

const session = {
  accessToken: 'access',
  refreshToken: 'refresh',
  role: 'VOLUNTEER' as const,
  userId: 'u1',
  phone: '+79000000000',
};

describe('authStorage session cache', () => {
  beforeEach(() => {
    resetSessionCacheForTests();
    vi.mocked(SecureStore.getItemAsync).mockReset();
    vi.mocked(SecureStore.setItemAsync).mockReset();
  });

  it('reads SecureStore only once until cache is reset', async () => {
    vi.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(session));

    await expect(loadSession()).resolves.toEqual(session);
    await expect(loadSession()).resolves.toEqual(session);

    expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(1);
  });

  it('updates cache after save without extra reads', async () => {
    vi.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

    await saveSession(session);
    await loadSession();

    expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
  });
});
