import { describe, expect, it } from 'vitest';
import { extractPhoneDigits, toApiPhone, validatePhoneDigits } from './phone';

describe('phone utils', () => {
  it('normalizes russian numbers to 10 digits', () => {
    expect(extractPhoneDigits('+7 (999) 123-45-67')).toBe('9991234567');
    expect(extractPhoneDigits('89991234567')).toBe('9991234567');
  });

  it('formats api phone as E.164 +7', () => {
    expect(toApiPhone('9991234567')).toBe('+79991234567');
  });

  it('validates complete phone', () => {
    expect(validatePhoneDigits('9991234567')).toBeNull();
    expect(validatePhoneDigits('123')).toBeTruthy();
  });
});
