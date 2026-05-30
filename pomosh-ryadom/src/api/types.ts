export type UserRole = 'BENEFICIARY' | 'VOLUNTEER' | 'PARTNER' | 'ADMIN' | 'ORGANIZATION';

export type RegistrationRole = 'volunteer' | 'beneficiary';

export type Gender = 'male' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export type LoginRequest = {
  phone_number?: string | null;
  email?: string | null;
  password: string;
};

export type TokensResponse = {
  access_token: string;
  refresh_token: string;
};

export type RefreshTokensRequest = {
  refresh_token: string;
};

export type LogoutRequest = {
  refresh_token: string;
};

export type RegisterVolunteerRequest = {
  phone_number: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  gender: Gender;
};

export type RegisterBeneficiaryRequest = {
  phone_number: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  gender: Gender;
};

export type VerificationPhoneResponse = {
  verification_id: string;
  is_phone_verified: boolean;
  /** Может приходить из /resend-verification-code в dev-сборках бекенда */
  verification_code?: string;
};

export type VerifyPhoneRequest = {
  verification_id: string;
  code: string;
};

export type ResendVerificationCodeRequest = {
  verification_id: string;
};

export type UserProfile = {
  user_id: string;
  full_name: string;
  full_name_source: string;
  city?: string | null;
  phone_number?: string | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  role: UserRole;
  profile: UserProfile;
  /** false — сессия только до перезапуска приложения (чекбокс «Запомнить меня»). */
  persistAcrossRestarts?: boolean;
};

export type SignInOptions = {
  hintRole?: UserRole;
  /** Сохранять вход после перезапуска приложения. По умолчанию true. */
  persistAcrossRestarts?: boolean;
};

export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    context?: Record<string, unknown>;
    details?: Record<string, unknown>;
  };
  detail?: Array<{ loc: (string | number)[]; msg: string; type: string }> | string;
};

export type ParsedApiError = {
  status: number;
  code?: string;
  message: string;
  fieldErrors?: Record<string, string>;
  context?: Record<string, unknown>;
  isNetworkError?: boolean;
};
