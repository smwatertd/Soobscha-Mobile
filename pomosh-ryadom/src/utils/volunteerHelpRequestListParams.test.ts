import { describe, expect, it } from 'vitest';
import { DEFAULT_VOLUNTEER_FEED_FILTERS } from '../types/volunteerFeedFilters';
import { buildVolunteerHelpRequestsListParams } from './volunteerHelpRequestListParams';
import { VISITOR_BENEFICIARY_VISIBLE_STATUSES } from './visitorBeneficiaryHelpRequests';

describe('buildVolunteerHelpRequestsListParams', () => {
  it('limits list to volunteer-visible statuses', () => {
    const params = buildVolunteerHelpRequestsListParams('all', DEFAULT_VOLUNTEER_FEED_FILTERS, {
      page: 2,
      pageSize: 10,
    });

    expect(params.statuses).toEqual([...VISITOR_BENEFICIARY_VISIBLE_STATUSES]);
    expect(params.page).toBe(2);
    expect(params.pageSize).toBe(10);
    expect(params.type).toBeUndefined();
  });

  it('maps tab to API type filter', () => {
    expect(buildVolunteerHelpRequestsListParams('social').type).toBe('SOCIAL');
    expect(buildVolunteerHelpRequestsListParams('material').type).toBe('MATERIAL');
  });
});
