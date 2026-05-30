import { mapFieldError } from './errors';
import type { ParsedApiError, RegistrationRole } from './types';

export type PhoneVerificationChallenge = {
  verificationId: string;
};

const PHONE_VERIFICATION_CODES = new Set([
  'PHONE_VERIFICATION_REQUIRED',
  'PHONE_NOT_VERIFIED',
  'PHONE_VERIFICATION_FAILURE',
]);

function readVerificationId(source: Record<string, unknown> | undefined): string | undefined {
  if (!source) return undefined;
  const raw = source.verification_id;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

/** Извлекает verification_id из ответа API, если вход требует подтверждения телефона. */
export function parsePhoneVerificationChallenge(
  parsed: ParsedApiError,
): PhoneVerificationChallenge | null {
  const code = parsed.code?.toUpperCase();
  const verificationId = readVerificationId(parsed.context);

  if (verificationId && code && PHONE_VERIFICATION_CODES.has(code)) {
    return { verificationId };
  }

  return null;
}

const REGISTRATION_FIELD_ALIASES: Record<string, string[]> = {
  phone_number: ['phone_number', 'phone-number', 'phone'],
  password: ['password'],
  first_name: ['first_name', 'first-name', 'firstName'],
  last_name: ['last_name', 'last-name', 'lastName'],
  middle_name: ['middle_name', 'middle-name', 'middleName'],
  gender: ['gender'],
};

export function mapRegistrationFieldError(
  fieldErrors: Record<string, string> | undefined,
  field: keyof typeof REGISTRATION_FIELD_ALIASES,
): string | undefined {
  if (!fieldErrors) return undefined;
  for (const key of REGISTRATION_FIELD_ALIASES[field]) {
    const message = mapFieldError(fieldErrors, key);
    if (message) return message;
  }
  return undefined;
}

export function registrationConflictMessage(
  parsed: ParsedApiError,
  role: RegistrationRole,
): string | undefined {
  if (parsed.status !== 400 && parsed.status !== 409) return undefined;
  const code = parsed.code?.toUpperCase();
  if (code === 'USER_REGISTRATION_FAILURE' || code === 'CONFLICT') {
    const roleLabel = role === 'volunteer' ? 'волонтёра' : 'получателя помощи';
    if (/already exists|уже существует/i.test(parsed.message)) {
      return 'Пользователь с таким номером уже зарегистрирован. Войдите или восстановите доступ.';
    }
    return parsed.message || `Не удалось зарегистрировать ${roleLabel}`;
  }
  return undefined;
}
