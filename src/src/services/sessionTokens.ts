import { refreshTokens, RefreshTokenError } from '../api/tokenRefresh';
import { isTokenExpired } from '../utils/jwt';
import { clearSession, loadSession, saveSession } from './authStorage';
import { logger } from './logger';

let refreshInFlight: Promise<string | null> | null = null;

function isRefreshAuthFailure(err: unknown): boolean {
  if (err instanceof RefreshTokenError) {
    return err.parsed.status === 401;
  }
  return false;
}

function refreshFailureMessage(err: unknown): string {
  if (err instanceof RefreshTokenError) {
    return err.parsed.message;
  }
  return err instanceof Error ? err.message : String(err);
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Сессия истекла. Войдите снова.');
    this.name = 'SessionExpiredError';
  }
}

export function isSessionExpiredError(err: unknown): boolean {
  if (err instanceof SessionExpiredError) return true;
  if (err && typeof err === 'object' && 'parsed' in err) {
    const parsed = (err as { parsed?: { code?: string } }).parsed;
    return parsed?.code === 'SESSION_EXPIRED';
  }
  return false;
}

export async function refreshSessionTokens(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const session = await loadSession();
    if (!session?.refreshToken) return null;

    if (isTokenExpired(session.refreshToken, 0)) {
      logger.auth.warn('Refresh token expired');
      await clearSession();
      return null;
    }

    try {
      logger.auth.info('Refreshing session tokens');
      const tokens = await refreshTokens(session.refreshToken);
      await saveSession({
        ...session,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });
      return tokens.access_token;
    } catch (err) {
      logger.auth.warn('Token refresh failed', {
        message: refreshFailureMessage(err),
        code: err instanceof RefreshTokenError ? err.parsed.code : undefined,
      });
      if (isRefreshAuthFailure(err)) {
        await clearSession();
      }
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function getValidAccessToken(): Promise<string | null> {
  const session = await loadSession();
  if (!session) return null;

  if (isTokenExpired(session.refreshToken, 0)) {
    await clearSession();
    return null;
  }

  if (!isTokenExpired(session.accessToken, 60)) {
    return session.accessToken;
  }

  return refreshSessionTokens();
}
