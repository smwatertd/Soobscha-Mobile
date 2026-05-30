import {
  login,
  logoutApi,
  resolveSession,
} from '../api/auth';
import { registrationRoleToUserRole } from '../api/auth';
import {
  AuthSession,
  LoginRequest,
  RegistrationRole,
  SignInOptions,
  TokensResponse,
} from '../api/types';
import { toApiPhone } from '../utils/phone';
import { clearSession, loadSession, saveSession } from './authStorage';
import { resetHelpRequestWatchSession } from './helpRequestWatch';
import { clearVolunteerFeedSession } from './volunteerFeedSession';
import { logger } from './logger';
import { refreshSessionTokens } from './sessionTokens';
import { isTokenExpired } from '../utils/jwt';

export { isSessionExpiredError, SessionExpiredError } from './sessionTokens';

export async function restoreSession(): Promise<AuthSession | null> {
  const session = await loadSession();
  if (!session) return null;

  if (session.persistAcrossRestarts === false) {
    logger.auth.info('Ephemeral session — clearing on cold start');
    await clearSession();
    return null;
  }

  if (isTokenExpired(session.refreshToken, 0)) {
    logger.auth.warn('Refresh token expired — clearing storage');
    await clearSession();
    return null;
  }

  try {
    logger.auth.info('Restoring session');

    let accessToken = session.accessToken;
    let refreshToken = session.refreshToken;

    if (isTokenExpired(accessToken, 60)) {
      const newAccess = await refreshSessionTokens();
      if (!newAccess) {
        if (await loadSession()) {
          logger.auth.warn('Session restore failed — refresh unavailable');
        } else {
          logger.auth.warn('Session restore failed — refresh token invalid');
        }
        return null;
      }

      const updated = await loadSession();
      if (!updated) return null;
      accessToken = updated.accessToken;
      refreshToken = updated.refreshToken;
    }

    const restored = await resolveSession(
      { access_token: accessToken, refresh_token: refreshToken },
      { hintRole: session.role },
    );
    const next: AuthSession = {
      ...restored,
      accessToken,
      refreshToken,
    };
    await saveSession(next);
    logger.auth.info('Session restored', { role: next.role });
    return next;
  } catch {
    logger.auth.warn('Session restore failed — clearing storage');
    await clearSession();
    return null;
  }
}

export async function signInWithCredentials(
  credentials: LoginRequest,
  options?: SignInOptions,
): Promise<AuthSession> {
  const tokens = await login(credentials);
  return signInWithTokens(tokens, options);
}

export async function signInWithTokens(
  tokens: TokensResponse,
  options?: SignInOptions,
): Promise<AuthSession> {
  const session = await resolveSession(
    tokens,
    options?.hintRole ? { hintRole: options.hintRole } : undefined,
  );
  const persistAcrossRestarts = options?.persistAcrossRestarts !== false;
  await saveSession({ ...session, persistAcrossRestarts });
  logger.auth.info('Signed in', { role: session.role, persistAcrossRestarts });
  return { ...session, persistAcrossRestarts };
}

export async function completeRegistrationSignIn(
  phoneDigits: string,
  password: string,
  role: RegistrationRole,
): Promise<AuthSession> {
  return signInWithCredentials(
    { phone_number: toApiPhone(phoneDigits), password },
    { hintRole: registrationRoleToUserRole(role), persistAcrossRestarts: true },
  );
}

export async function signOut(): Promise<void> {
  clearVolunteerFeedSession();
  resetHelpRequestWatchSession();

  const session = await loadSession();
  if (session?.refreshToken) {
    try {
      await logoutApi(session.refreshToken, session.accessToken);
      logger.auth.info('Server logout completed');
    } catch (err) {
      logger.auth.warn('Server logout failed', {
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
  await clearSession();
}

export function homeRouteForSession(session: AuthSession): 'VolunteerMain' | 'BeneficiaryMain' {
  return session.role === 'BENEFICIARY' ? 'BeneficiaryMain' : 'VolunteerMain';
}

export function registrationOnboardingRoute(
  role: RegistrationRole,
): 'BeneficiaryOnboardingGuide' | 'VolunteerOnboardingGuide' {
  return role === 'beneficiary' ? 'BeneficiaryOnboardingGuide' : 'VolunteerOnboardingGuide';
}
