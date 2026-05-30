/** 10 digits without country code. */
export function extractPhoneDigits(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('7') || digits.startsWith('8')) {
    return digits.slice(1, 11);
  }
  return digits.slice(0, 10);
}

export function formatPhoneDisplay(digits: string): string {
  const d = extractPhoneDigits(digits);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
}

export function toApiPhone(digits: string): string {
  return `+7${extractPhoneDigits(digits)}`;
}

export function validatePhoneDigits(digits: string): string | null {
  if (extractPhoneDigits(digits).length !== 10) {
    return 'Введите номер из 10 цифр';
  }
  return null;
}

export function formatPhoneContactDisplay(value: string): string {
  const digits = extractPhoneDigits(value);
  if (digits.length !== 10) return value.trim();
  return `+7 ${formatPhoneDisplay(digits)}`;
}
