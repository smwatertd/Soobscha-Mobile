import { describe, expect, it } from 'vitest';
import { buildSkillLabelMap, formatVolunteerSkillCodes, resolveSkillLabel } from './volunteerSkillLabels';

describe('formatVolunteerSkillCodes', () => {
  it('returns human-readable skill labels', () => {
    const map = buildSkillLabelMap([
      { code: 'GARDENING', label: 'Работа на участке', group: 'OUT', group_label: 'Out', requires_verified: false },
    ]);

    expect(formatVolunteerSkillCodes(['GARDENING'], map)).toBe('Работа на участке');
  });

  it('returns fallback when no skills', () => {
    expect(formatVolunteerSkillCodes([], new Map())).toBe('Навыки не указаны');
  });

  it('humanizes unknown codes when catalog has no match', () => {
    expect(resolveSkillLabel('PHYSICAL_LABOR', new Map())).toBe('Physical Labor');
  });

  it('resolves alias codes', () => {
    const map = buildSkillLabelMap([
      { code: 'COMPANION', label: 'Сопровождение', group: 'CARE', group_label: 'Забота', requires_verified: false },
    ]);
    expect(resolveSkillLabel('COMPANIONSHIP', map)).toBe('Сопровождение');
  });
});
