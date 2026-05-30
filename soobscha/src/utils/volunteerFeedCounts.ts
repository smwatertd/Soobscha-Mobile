import { PaginatedResponse } from '../api/integrationTypes';
import { VolunteerFeedTabId } from '../screens/volunteer/volunteerFeedTypes';

export type VolunteerFeedCounts = Record<VolunteerFeedTabId, number>;

export function feedTypeFilter(tab: VolunteerFeedTabId): 'SOCIAL' | 'MATERIAL' | undefined {
  if (tab === 'social') return 'SOCIAL';
  if (tab === 'material') return 'MATERIAL';
  return undefined;
}

/** Обновляет только счётчик активной вкладки; остальные не трогает. */
export function mergeVolunteerFeedCounts(
  tab: VolunteerFeedTabId,
  response: PaginatedResponse<unknown>,
  previous: VolunteerFeedCounts,
): VolunteerFeedCounts {
  const total = response.total_count;

  if (tab === 'social') {
    return { ...previous, social: total };
  }
  if (tab === 'material') {
    return { ...previous, material: total };
  }

  return { ...previous, all: total };
}
