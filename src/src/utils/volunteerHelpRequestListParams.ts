import { GetHelpRequestsParams } from '../api/helpRequests';
import { MapPoint } from '../api/integrationTypes';
import { VolunteerFeedTabId } from '../screens/volunteer/volunteerFeedTypes';
import {
  DEFAULT_VOLUNTEER_FEED_FILTERS,
  VolunteerFeedFilters,
} from '../types/volunteerFeedFilters';
import { buildHelpRequestsListQuery } from './helpRequestsListQuery';
import { feedTypeFilter } from './volunteerFeedCounts';
import { VISITOR_BENEFICIARY_VISIBLE_STATUSES } from './visitorBeneficiaryHelpRequests';

export function serializeVolunteerFeedFiltersKey(filters: VolunteerFeedFilters): string {
  return JSON.stringify(filters);
}

export function buildVolunteerHelpRequestsListParams(
  tab: VolunteerFeedTabId,
  filters: VolunteerFeedFilters = DEFAULT_VOLUNTEER_FEED_FILTERS,
  options?: { page?: number; pageSize?: number; userLocation?: MapPoint | null },
): GetHelpRequestsParams {
  const listQuery = buildHelpRequestsListQuery(filters, options?.userLocation ?? null);

  return {
    page: options?.page ?? 1,
    pageSize: options?.pageSize,
    type: feedTypeFilter(tab),
    statuses: [...VISITOR_BENEFICIARY_VISIBLE_STATUSES],
    orderBy: listQuery.orderBy,
    orderDesc: listQuery.orderDesc,
    dateFrom: listQuery.dateFrom,
    dateTo: listQuery.dateTo,
    latitude: listQuery.latitude,
    longitude: listQuery.longitude,
    maxDistanceKm: listQuery.maxDistanceKm,
    availableToMe: listQuery.availableToMe,
  };
}
