import { describe, expect, it } from 'vitest';
import {
  classifyVisitorBeneficiaryFeedItems,
  filterVisitorVisibleHelpRequests,
  isVisitorVisibleHelpRequestStatus,
} from './visitorBeneficiaryHelpRequests';
import { VolunteerFeedItem } from '../screens/volunteer/volunteerFeedTypes';

function item(status: string): VolunteerFeedItem {
  return {
    id: status,
    type: 'social',
    title: status,
    author: 'A',
    categoryCode: 'CLEANING',
    reqCategory: 'Уборка',
    benCategory: null,
    benCategoryCode: null,
    status,
  };
}

describe('visitor beneficiary request visibility', () => {
  it('hides moderation and archive statuses', () => {
    expect(isVisitorVisibleHelpRequestStatus('PENDING_MODERATION')).toBe(false);
    expect(isVisitorVisibleHelpRequestStatus('RETURNED_TO_REWORK')).toBe(false);
    expect(isVisitorVisibleHelpRequestStatus('REJECTED')).toBe(false);
    expect(isVisitorVisibleHelpRequestStatus('CANCELLED')).toBe(false);
    expect(isVisitorVisibleHelpRequestStatus('VOLUNTEER_RECRUITING')).toBe(true);
    expect(isVisitorVisibleHelpRequestStatus('COMPLETED')).toBe(true);
  });

  it('splits active and completed only', () => {
    const result = classifyVisitorBeneficiaryFeedItems([
      item('VOLUNTEER_RECRUITING'),
      item('COMPLETED'),
      item('PENDING_MODERATION'),
      item('CANCELLED'),
    ]);
    expect(result.active.map((x) => x.id)).toEqual(['VOLUNTEER_RECRUITING']);
    expect(result.completed.map((x) => x.id)).toEqual(['COMPLETED']);
    expect(result.visible.map((x) => x.id)).toEqual(['VOLUNTEER_RECRUITING', 'COMPLETED']);
  });

  it('filters summaries for API layer', () => {
    const filtered = filterVisitorVisibleHelpRequests([
      { id: '1', status: 'COLLECTING_FUNDS' },
      { id: '2', status: 'REJECTED' },
    ] as never);
    expect(filtered.map((x) => (x as { id: string }).id)).toEqual(['1']);
  });
});
