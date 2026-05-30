import { describe, expect, it } from 'vitest';
import { toIso } from './dateIso';

describe('toIso', () => {
  it('pads month and day', () => {
    expect(toIso(2026, 0, 5)).toBe('2026-01-05');
  });

  it('converts zero-based month correctly', () => {
    expect(toIso(2026, 11, 31)).toBe('2026-12-31');
  });
});
