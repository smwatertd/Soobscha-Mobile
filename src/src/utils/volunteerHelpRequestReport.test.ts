import { describe, expect, it } from 'vitest';
import { canVolunteerViewHelpRequestReport } from './volunteerHelpRequestReport';

describe('canVolunteerViewHelpRequestReport', () => {
  it('allows report only for completed requests', () => {
    expect(canVolunteerViewHelpRequestReport('COMPLETED')).toBe(true);
    expect(canVolunteerViewHelpRequestReport('CANCELLED')).toBe(false);
    expect(canVolunteerViewHelpRequestReport('IN_PROGRESS')).toBe(false);
  });
});
