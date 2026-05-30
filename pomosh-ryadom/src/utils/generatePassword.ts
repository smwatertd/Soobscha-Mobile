const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghjkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SPECIAL = '!@#$%^&*-_=+';
const ALL = UPPER + LOWER + DIGITS + SPECIAL;

function pick(chars: string): string {
  return chars[Math.floor(Math.random() * chars.length)] ?? chars[0];
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function generateSecurePassword(length = 14): string {
  const size = Math.max(8, length);
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SPECIAL)];

  while (chars.length < size) {
    chars.push(pick(ALL));
  }

  return shuffle(chars).join('');
}

export const IOS_PASSWORD_RULES =
  'minlength: 8; required: lower; required: upper; required: digit; required: special;';
