import { HelpRequestType } from '../api/integrationTypes';
import { VolunteerMapFilters } from '../types/volunteerMapFilters';

export type MapQuickTypeFilter = 'all' | HelpRequestType | 'available';

export function cloneVolunteerMapFilters(filters: VolunteerMapFilters): VolunteerMapFilters {
  return {
    ...filters,
    socialCategories: [...filters.socialCategories],
    materialCategories: [...filters.materialCategories],
    beneficiaryCategories: [...filters.beneficiaryCategories],
  };
}

/** Какой быстрый чип типа соответствует применённым фильтрам (null — ни один не выбран). */
export function resolveMapQuickTypeFilter(filters: VolunteerMapFilters): MapQuickTypeFilter | null {
  if (filters.availableToMe) {
    return 'available';
  }
  if (filters.social && filters.material) {
    return 'all';
  }
  if (filters.social && !filters.material) {
    return 'SOCIAL';
  }
  if (filters.material && !filters.social) {
    return 'MATERIAL';
  }
  return null;
}

export function buildMapFiltersForQuickType(
  current: VolunteerMapFilters,
  type: MapQuickTypeFilter,
): VolunteerMapFilters {
  if (type === 'all') {
    return {
      ...current,
      availableToMe: false,
      social: true,
      material: true,
    };
  }
  if (type === 'SOCIAL') {
    return {
      ...current,
      availableToMe: false,
      social: true,
      material: false,
      socialCategories: [],
      materialCategories: [],
    };
  }
  if (type === 'MATERIAL') {
    return {
      ...current,
      availableToMe: false,
      social: false,
      material: true,
      socialCategories: [],
      materialCategories: [],
    };
  }
  return {
    ...current,
    availableToMe: true,
    social: true,
    material: false,
    materialCategories: [],
  };
}
