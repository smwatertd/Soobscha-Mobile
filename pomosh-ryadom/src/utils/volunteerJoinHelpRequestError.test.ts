import { describe, expect, it } from 'vitest';
import { ParsedApiError } from '../api/types';
import { resolveVolunteerJoinHelpRequestError } from './volunteerJoinHelpRequestError';

function apiError(parsed: ParsedApiError): Error & { parsed: ParsedApiError } {
  const err = new Error(parsed.message) as Error & { parsed: ParsedApiError };
  err.parsed = parsed;
  return err;
}

describe('resolveVolunteerJoinHelpRequestError', () => {
  it('uses request status for completed help requests', () => {
    expect(
      resolveVolunteerJoinHelpRequestError(new Error('x'), { requestStatus: 'COMPLETED' }),
    ).toBe('На эту заявку нельзя записаться: она уже выполнена.');
  });

  it('maps backend completed message', () => {
    expect(
      resolveVolunteerJoinHelpRequestError(
        apiError({
          status: 409,
          code: 'join_not_allowed',
          message: 'Volunteer cannot join completed help request',
        }),
      ),
    ).toBe('На эту заявку нельзя записаться: она уже выполнена.');
  });

  it('maps already joined conflict', () => {
    expect(
      resolveVolunteerJoinHelpRequestError(
        apiError({ status: 409, message: 'Volunteer already joined' }),
      ),
    ).toBe('Вы уже записаны на эту заявку.');
  });
});
