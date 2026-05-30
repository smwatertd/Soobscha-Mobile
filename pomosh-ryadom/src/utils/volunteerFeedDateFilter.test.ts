import { describe, expect, it } from 'vitest';
import { matchesVolunteerFeedDatePreset } from './volunteerFeedDateFilter';

describe('matchesVolunteerFeedDatePreset', () => {
  const now = new Date('2026-05-27T12:00:00');

  it('matches today', () => {
    expect(matchesVolunteerFeedDatePreset('2026-05-27T18:00:00', 'today', now)).toBe(true);
    expect(matchesVolunteerFeedDatePreset('2026-05-28T10:00:00', 'today', now)).toBe(false);
  });

  it('matches tomorrow', () => {
    expect(matchesVolunteerFeedDatePreset('2026-05-28T10:00:00', 'tomorrow', now)).toBe(true);
  });

  it('matches custom range when both dates provided', () => {
    expect(
      matchesVolunteerFeedDatePreset('2026-06-01T10:00:00', 'custom', now, {
        fromIso: '2026-05-28',
        toIso: '2026-06-05',
      }),
    ).toBe(true);
    expect(
      matchesVolunteerFeedDatePreset('2026-07-01T10:00:00', 'custom', now, {
        fromIso: '2026-05-28',
        toIso: '2026-06-05',
      }),
    ).toBe(false);
  });

  it('returns false for custom without range', () => {
    expect(matchesVolunteerFeedDatePreset('2026-06-05T10:00:00', 'custom', now)).toBe(false);
  });
});
