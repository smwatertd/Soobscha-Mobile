import { describe, expect, it } from 'vitest';
import { BenRequestCardData } from '../components/beneficiary/BenRequestCard';
import {
  applyBeneficiaryRequestFilters,
  beneficiaryRequestFiltersEqual,
  DEFAULT_BENEFICIARY_REQUESTS_FILTERS,
  hasActiveBeneficiaryRequestFilters,
  typeFilterToApi,
} from './beneficiaryRequestsFilters';

const baseItem: BenRequestCardData = {
  id: '1',
  type: 'social',
  status: 'recruiting',
  title: 'Уборка',
  sub: 'sub',
  footer: 'footer',
  apiStatus: 'VOLUNTEER_RECRUITING',
  createdAtIso: new Date().toISOString(),
};

describe('beneficiary request filters', () => {
  it('maps type filter to API values', () => {
    expect(typeFilterToApi('social')).toBe('SOCIAL');
    expect(typeFilterToApi('material')).toBe('MATERIAL');
    expect(typeFilterToApi('all')).toBeUndefined();
  });

  it('detects active filters', () => {
    expect(hasActiveBeneficiaryRequestFilters(DEFAULT_BENEFICIARY_REQUESTS_FILTERS)).toBe(false);
    expect(
      hasActiveBeneficiaryRequestFilters({
        ...DEFAULT_BENEFICIARY_REQUESTS_FILTERS,
        statusCodes: ['COMPLETED'],
      }),
    ).toBe(true);
  });

  it('filters by status and special flags', () => {
    const items: BenRequestCardData[] = [
      baseItem,
      {
        ...baseItem,
        id: '2',
        type: 'material',
        apiStatus: 'FUNDED',
        amountRequestedKopeks: 500_000_00,
      },
    ];

    const result = applyBeneficiaryRequestFilters(
      items,
      {
        ...DEFAULT_BENEFICIARY_REQUESTS_FILTERS,
        specialFilters: ['can_payout'],
      },
      '',
    );

    expect(result.map((item) => item.id)).toEqual(['2']);
  });

  it('filters by custom created range', () => {
    const items: BenRequestCardData[] = [
      { ...baseItem, id: 'old', createdAtIso: '2026-01-10T10:00:00.000Z' },
      { ...baseItem, id: 'new', createdAtIso: '2026-05-20T10:00:00.000Z' },
    ];

    const result = applyBeneficiaryRequestFilters(
      items,
      {
        ...DEFAULT_BENEFICIARY_REQUESTS_FILTERS,
        createdPreset: 'custom',
        createdFromIso: '2026-05-01',
        createdToIso: '2026-05-31',
      },
      '',
    );

    expect(result.map((item) => item.id)).toEqual(['new']);
  });

  it('uses default sum range 10–300k without filtering all material', () => {
    const items: BenRequestCardData[] = [
      {
        ...baseItem,
        id: 'm1',
        type: 'material',
        apiStatus: 'COLLECTING_FUNDS',
        amountRequestedKopeks: 50_000_00,
      },
    ];

    const result = applyBeneficiaryRequestFilters(items, DEFAULT_BENEFICIARY_REQUESTS_FILTERS, '');
    expect(result).toHaveLength(1);
  });

  it('compares filters including arrays', () => {
    const a = {
      ...DEFAULT_BENEFICIARY_REQUESTS_FILTERS,
      categoryCodes: ['A', 'B'],
    };
    const b = { ...a };
    const c = { ...a, categoryCodes: ['B', 'A'] };
    expect(beneficiaryRequestFiltersEqual(a, b)).toBe(true);
    expect(beneficiaryRequestFiltersEqual(a, c)).toBe(false);
  });
});
