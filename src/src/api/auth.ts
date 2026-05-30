import { getApiBaseUrl } from '../config/api';
import { getRoleFromAccessToken } from '../utils/jwt';
import { apiRequest } from './client';
import {
  AuthSession,
  LoginRequest,
  LogoutRequest,
  RegisterBeneficiaryRequest,
  RegisterVolunteerRequest,
  ResendVerificationCodeRequest,
  TokensResponse,
  UserProfile,
  UserRole,
  VerificationPhoneResponse,
  VerifyPhoneRequest,
} from './types';

export type ResolveSessionOptions = {
  hintRole?: UserRole;
};

export async function login(credentials: LoginRequest): Promise<TokensResponse> {
  return apiRequest<TokensResponse>('/api/auth/login', {
    method: 'POST',
    body: credentials,
  });
}

export { refreshTokens } from './tokenRefresh';

export async function logoutApi(refreshToken: string, accessToken?: string | null): Promise<void> {
  const body: LogoutRequest = { refresh_token: refreshToken };
  await apiRequest<null>('/api/auth/logout', {
    method: 'POST',
    body,
    token: accessToken ?? undefined,
    skipAuthRefresh: true,
  });
}

export async function registerVolunteer(
  data: RegisterVolunteerRequest,
): Promise<VerificationPhoneResponse> {
  return apiRequest<VerificationPhoneResponse>('/api/volunteers', {
    method: 'POST',
    body: data,
  });
}

export async function registerBeneficiary(
  data: RegisterBeneficiaryRequest,
): Promise<VerificationPhoneResponse> {
  return apiRequest<VerificationPhoneResponse>('/api/beneficiaries', {
    method: 'POST',
    body: data,
  });
}

export async function verifyPhone(data: VerifyPhoneRequest): Promise<void> {
  await apiRequest<null>('/api/auth/verify-phone', {
    method: 'POST',
    body: data,
  });
}

export async function resendVerificationCode(
  verificationId: string,
): Promise<VerificationPhoneResponse> {
  const body: ResendVerificationCodeRequest = { verification_id: verificationId };
  return apiRequest<VerificationPhoneResponse>('/api/auth/resend-verification-code', {
    method: 'POST',
    body,
  });
}

/** Пытается получить код из resend (Mock SMS на бекенде). */
export async function tryFetchVerificationCode(
  verificationId: string,
): Promise<string | undefined> {
  try {
    const response = await resendVerificationCode(verificationId);
    const code = response.verification_code?.trim();
    return code && code.length === 6 ? code : undefined;
  } catch {
    return undefined;
  }
}

async function fetchProfileMe(path: string, token: string): Promise<UserProfile | null> {
  const url = `${getApiBaseUrl()}${path}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text) as UserProfile;
  } catch {
    return null;
  }
}

async function fetchProfileForRole(token: string, role: UserRole): Promise<UserProfile> {
  const path = role === 'BENEFICIARY' ? '/api/beneficiaries/me' : '/api/volunteers/me';
  const profile = await fetchProfileMe(path, token);
  if (profile) return profile;

  throw new Error(
    role === 'BENEFICIARY'
      ? 'Не удалось загрузить профиль получателя помощи'
      : 'Не удалось загрузить профиль волонтёра',
  );
}

async function probeSessionRole(token: string): Promise<{ role: UserRole; profile: UserProfile } | null> {
  const roleHint = getRoleFromAccessToken(token);

  if (roleHint === 'VOLUNTEER') {
    const volunteer = await fetchProfileMe('/api/volunteers/me', token);
    if (volunteer) return { role: 'VOLUNTEER', profile: volunteer };
  }

  if (roleHint === 'BENEFICIARY') {
    const beneficiary = await fetchProfileMe('/api/beneficiaries/me', token);
    if (beneficiary) return { role: 'BENEFICIARY', profile: beneficiary };
  }

  const volunteer = await fetchProfileMe('/api/volunteers/me', token);
  if (volunteer) return { role: 'VOLUNTEER', profile: volunteer };

  const beneficiary = await fetchProfileMe('/api/beneficiaries/me', token);
  if (beneficiary) return { role: 'BENEFICIARY', profile: beneficiary };

  return null;
}

export async function resolveSession(
  tokens: TokensResponse,
  options?: ResolveSessionOptions,
): Promise<AuthSession> {
  const { access_token, refresh_token } = tokens;
  const role = options?.hintRole ?? getRoleFromAccessToken(access_token);

  if (role === 'BENEFICIARY' || role === 'VOLUNTEER') {
    const profile = await fetchProfileForRole(access_token, role);
    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      role,
      profile,
    };
  }

  const probed = await probeSessionRole(access_token);
  if (probed) {
    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      role: probed.role,
      profile: probed.profile,
    };
  }

  throw new Error('Не удалось определить роль пользователя');
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case 'VOLUNTEER':
      return 'Волонтёр';
    case 'BENEFICIARY':
      return 'Получатель помощи';
    case 'ADMIN':
      return 'Администратор';
    case 'PARTNER':
      return 'Партнёр';
    case 'ORGANIZATION':
      return 'Организация';
    default:
      return role;
  }
}

export function registrationRoleToUserRole(role: 'volunteer' | 'beneficiary'): UserRole {
  return role === 'volunteer' ? 'VOLUNTEER' : 'BENEFICIARY';
}
