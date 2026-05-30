import { ContactChannelType } from '../navigation/volunteerVerificationTypes';
import {
  extractPhoneDigits,
  formatPhoneContactDisplay,
  toApiPhone,
  validatePhoneDigits,
} from './phone';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const TELEGRAM_PATTERN = /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/;

export function validateContactValue(type: ContactChannelType, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Укажите контакт';

  switch (type) {
    case 'whatsapp':
    case 'max':
      return validatePhoneDigits(trimmed);
    case 'email':
      return EMAIL_PATTERN.test(trimmed) ? null : 'Некорректный email';
    case 'telegram':
      return TELEGRAM_PATTERN.test(trimmed)
        ? null
        : 'Формат: @username (латиница, от 5 символов)';
    default:
      return null;
  }
}

export function normalizeContactValue(type: ContactChannelType, value: string): string {
  const trimmed = value.trim();
  switch (type) {
    case 'whatsapp':
    case 'max':
      return toApiPhone(trimmed);
    case 'email':
      return trimmed.toLowerCase();
    case 'telegram':
      return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
    default:
      return trimmed;
  }
}

export function formatContactForDisplay(type: ContactChannelType, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  switch (type) {
    case 'whatsapp':
    case 'max':
      return formatPhoneContactDisplay(trimmed);
    default:
      return trimmed;
  }
}

export function contactEditorPhoneDigits(type: ContactChannelType, value: string): string {
  if (type !== 'whatsapp' && type !== 'max') return '';
  return extractPhoneDigits(value);
}
