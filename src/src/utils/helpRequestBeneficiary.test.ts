import { describe, expect, it } from 'vitest';
import {
  formatBeneficiaryDisplayName,
  getHelpRequestBeneficiaryCategoryCode,
  getHelpRequestBeneficiaryCategoryLabel,
  getHelpRequestBeneficiaryName,
} from './helpRequestBeneficiary';

describe('helpRequestBeneficiary', () => {
  it('formats name as last name then first name', () => {
    expect(
      getHelpRequestBeneficiaryName({
        first_name: 'Нина',
        last_name: 'Кузнецова',
      }),
    ).toBe('Кузнецова Нина');
  });

  it('includes middle name when present', () => {
    expect(
      formatBeneficiaryDisplayName({
        lastName: 'Кузнецова',
        firstName: 'Нина',
        middleName: 'Петровна',
      }),
    ).toBe('Кузнецова Нина Петровна');
  });

  it('reads category from base_category', () => {
    expect(
      getHelpRequestBeneficiaryCategoryCode({ base_category: 'ELDERLY' }),
    ).toBe('ELDERLY');
    expect(getHelpRequestBeneficiaryCategoryLabel({ base_category: 'ELDERLY' })).toBeTruthy();
  });

  it('falls back to legacy category field', () => {
    expect(getHelpRequestBeneficiaryCategoryCode({ category: 'SICK' })).toBe('SICK');
  });

  it('reads camelCase baseCategory', () => {
    expect(getHelpRequestBeneficiaryCategoryCode({ baseCategory: 'ELDERLY' })).toBe('ELDERLY');
  });
});
