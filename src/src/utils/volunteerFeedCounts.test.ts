import { describe, expect, it } from 'vitest';
import { mergeVolunteerFeedCounts } from './volunteerFeedCounts';

const empty = { all: 0, social: 0, material: 0 };

describe('mergeVolunteerFeedCounts', () => {
  it('updates only the all tab total', () => {
    const merged = mergeVolunteerFeedCounts(
      'all',
      {
        page: 1,
        page_size: 50,
        total_count: 3,
        has_more: false,
        items: [],
      },
      { all: 0, social: 7, material: 4 },
    );

    expect(merged).toEqual({ all: 3, social: 7, material: 4 });
  });

  it('uses total_count for filtered social tab', () => {
    const merged = mergeVolunteerFeedCounts(
      'social',
      {
        page: 1,
        page_size: 50,
        total_count: 12,
        has_more: true,
        items: [{ type: 'SOCIAL', id: '1' }],
      },
      { all: 20, social: 0, material: 5 },
    );

    expect(merged).toEqual({ all: 20, social: 12, material: 5 });
  });
});
