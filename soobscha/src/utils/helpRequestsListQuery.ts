import { MapPoint } from '../api/integrationTypes';
import { GetHelpRequestsParams } from '../api/helpRequests';
import { DEFAULT_VOLUNTEER_FEED_FILTERS, VolunteerFeedFilters } from '../types/volunteerFeedFilters';
import { VolunteerMapFilters } from '../types/volunteerMapFilters';
import { buildHelpRequestsDateRange } from './helpRequestsDateRange';

export function buildHelpRequestsListQuery(
  filters: VolunteerFeedFilters | VolunteerMapFilters,
  userLocation?: MapPoint | null,
): Omit<GetHelpRequestsParams, 'page' | 'pageSize' | 'type' | 'statuses'> {
  const dateRange = buildHelpRequestsDateRange(filters);
  const useGeo =
    Boolean(userLocation) &&
    (filters.sort === 'near' ||
      filters.maxDistanceKm !== DEFAULT_VOLUNTEER_FEED_FILTERS.maxDistanceKm);

  const query: Omit<GetHelpRequestsParams, 'page' | 'pageSize' | 'type' | 'statuses'> = {
    orderBy: filters.sort === 'near' && userLocation ? 'distance' : 'created_at',
    orderDesc: filters.sort !== 'near',
    ...dateRange,
  };

  if (useGeo && userLocation) {
    query.latitude = userLocation.latitude;
    query.longitude = userLocation.longitude;
    query.maxDistanceKm = filters.maxDistanceKm;
  }

  if ('availableToMe' in filters && filters.availableToMe) {
    query.availableToMe = true;
  }

  return query;
}
