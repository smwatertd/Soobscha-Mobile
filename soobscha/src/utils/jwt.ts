import { UserRole } from '../api/types';

const USER_ROLES: UserRole[] = ['BENEFICIARY', 'VOLUNTEER', 'PARTNER', 'ADMIN', 'ORGANIZATION'];

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
}

function decodeBase64Url(value: string): string | null {
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const atobFn = globalThis.atob;
    if (typeof atobFn !== 'function') return null;
    return atobFn(padded);
  } catch {
    return null;
  }
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  const decoded = decodeBase64Url(parts[1]);
  if (!decoded) return null;

  try {
    const payload = JSON.parse(decoded);
    return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function getRoleFromAccessToken(token: string): UserRole | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const candidates = [payload.role, payload.user_role, payload.userRole];
  for (const candidate of candidates) {
    if (isUserRole(candidate)) return candidate;
  }

  return null;
}

export function getTokenExp(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return null;
  return payload.exp;
}

/** Returns true when the token is expired or will expire within skewSeconds. */
export function isTokenExpired(token: string, skewSeconds = 60): boolean {
  const exp = getTokenExp(token);
  if (exp === null) return false;
  return Date.now() >= (exp - skewSeconds) * 1000;
}
