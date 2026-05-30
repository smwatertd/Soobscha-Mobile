import { describe, expect, it } from 'vitest';
import { VolunteerFeedItem } from '../screens/volunteer/volunteerFeedTypes';
import { formatVisitorBeneficiaryRequestMeta } from './visitorBeneficiaryRequestMeta';

const base: VolunteerFeedItem = {
  id: '1',
  type: 'social',
  title: 'Test',
  author: 'Author',
  categoryCode: 'cleaning',
  reqCategory: 'Уборка',
  benCategory: null,
  benCategoryCode: null,
  status: 'VOLUNTEER_RECRUITING',
};

describe('formatVisitorBeneficiaryRequestMeta', () => {
  it('combines category, date and volunteers for social', () => {
    expect(
      formatVisitorBeneficiaryRequestMeta({
        ...base,
        date: 'пн, 12 мая, 14:00',
        volunteers: { current: 2, min: 1, max: 4 },
      }),
    ).toBe('Уборка · пн, 12 мая, 14:00 · 2/4 волонтёров');
  });

  it('shows collection progress for material', () => {
    expect(
      formatVisitorBeneficiaryRequestMeta({
        ...base,
        type: 'material',
        reqCategory: 'Лекарства',
        goal: 10000,
        collected: 3500,
      }),
    ).toMatch(/Лекарства · 3.500 ₽ из 10.000 ₽/);
  });
});
