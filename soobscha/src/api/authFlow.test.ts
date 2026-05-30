import { describe, expect, it } from 'vitest';
import {
  mapRegistrationFieldError,
  parsePhoneVerificationChallenge,
  registrationConflictMessage,
} from './authFlow';
import type { ParsedApiError } from './types';

describe('parsePhoneVerificationChallenge', () => {
  it('returns verification id when code and context match', () => {
    const parsed: ParsedApiError = {
      status: 403,
      code: 'PHONE_VERIFICATION_REQUIRED',
      message: 'Confirm phone',
      context: { verification_id: 'abc-123' },
    };
    expect(parsePhoneVerificationChallenge(parsed)).toEqual({
      verificationId: 'abc-123',
    });
  });

  it('returns null without verification_id in context', () => {
    const parsed: ParsedApiError = {
      status: 403,
      code: 'PHONE_VERIFICATION_REQUIRED',
      message: 'Confirm phone',
    };
    expect(parsePhoneVerificationChallenge(parsed)).toBeNull();
  });
});

describe('mapRegistrationFieldError', () => {
  it('maps backend validation field names', () => {
    const message = mapRegistrationFieldError(
      { phone_number: 'Invalid phone format' },
      'phone_number',
    );
    expect(message).toBe('Invalid phone format');
  });
});

describe('registrationConflictMessage', () => {
  it('detects duplicate phone registration', () => {
    const message = registrationConflictMessage(
      {
        status: 400,
        code: 'USER_REGISTRATION_FAILURE',
        message: 'User with phone number +7999 already exists',
      },
      'volunteer',
    );
    expect(message).toContain('уже зарегистрирован');
  });
});
