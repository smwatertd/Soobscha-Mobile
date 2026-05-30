import * as SecureStore from 'expo-secure-store';
import { AuthSession } from '../api/types';

const SESSION_KEY = 'auth_session';

/** undefined = ещё не читали из SecureStore; null = сессии нет. */
let memorySession: AuthSession | null | undefined;

export function resetSessionCacheForTests(): void {
  memorySession = undefined;
}

export async function saveSession(session: AuthSession): Promise<void> {
  memorySession = session;
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<AuthSession | null> {
  if (memorySession !== undefined) {
    return memorySession;
  }

  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) {
    memorySession = null;
    return null;
  }

  try {
    memorySession = JSON.parse(raw) as AuthSession;
    return memorySession;
  } catch {
    memorySession = null;
    return null;
  }
}

export async function clearSession(): Promise<void> {
  memorySession = null;
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function getAccessToken(): Promise<string | null> {
  const session = await loadSession();
  return session?.accessToken ?? null;
}
