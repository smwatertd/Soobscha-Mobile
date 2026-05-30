import {
  countActiveFeedFilters,
  DEFAULT_VOLUNTEER_FEED_FILTERS,
  VolunteerFeedFilters,
} from './volunteerFeedFilters';

export type VolunteerMapFilters = VolunteerFeedFilters & {
  availableToMe: boolean;
};

export const DEFAULT_VOLUNTEER_MAP_FILTERS: VolunteerMapFilters = {
  ...DEFAULT_VOLUNTEER_FEED_FILTERS,
  social: true,
  material: false,
  materialCategories: [],
  availableToMe: false,
};

/** Карта показывает только социальные заявки с адресом; сборы без геометки не отображаются. */
export function mapFiltersForSocialRequests(filters: VolunteerMapFilters): VolunteerMapFilters {
  return {
    ...filters,
    social: true,
    material: false,
    materialCategories: [],
  };
}

export function countActiveMapFilters(filters: VolunteerMapFilters): number {
  return countActiveFeedFilters(filters) + (filters.availableToMe ? 1 : 0);
}
