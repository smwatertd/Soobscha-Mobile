import { HelpRequestSummary } from '../api/helpRequests';
import {
  DEFAULT_VOLUNTEER_FEED_FILTERS,
  VolunteerFeedFilters,
} from '../types/volunteerFeedFilters';
import { getHelpRequestBeneficiaryCategoryCode } from './helpRequestBeneficiary';
import { matchesVolunteerFeedDatePreset } from './volunteerFeedDateFilter';

function readCategoryCode(item: HelpRequestSummary): string {
  const raw = item as Record<string, unknown>;
  return typeof raw.category === 'string' ? raw.category : '';
}

function readStartAt(item: HelpRequestSummary): string | undefined {
  const raw = item as Record<string, unknown>;
  return typeof raw.start_at === 'string' ? raw.start_at : undefined;
}

function readDistanceKm(item: HelpRequestSummary): number | undefined {
  const raw = item as Record<string, unknown>;
  const value = raw.distance_km ?? raw.distanceKm;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readType(item: HelpRequestSummary): string {
  const raw = item as Record<string, unknown>;
  return raw.type === 'MATERIAL' ? 'MATERIAL' : 'SOCIAL';
}

export function applyHelpRequestSummaryFilters(
  items: HelpRequestSummary[],
  filters: VolunteerFeedFilters,
): HelpRequestSummary[] {
  let result = items;

  if (!filters.social) {
    result = result.filter((item) => readType(item) !== 'SOCIAL');
  }
  if (!filters.material) {
    result = result.filter((item) => readType(item) !== 'MATERIAL');
  }

  if (filters.socialCategories.length) {
    result = result.filter((item) => {
      if (readType(item) !== 'SOCIAL') return true;
      return filters.socialCategories.includes(readCategoryCode(item));
    });
  }
  if (filters.materialCategories.length) {
    result = result.filter((item) => {
      if (readType(item) !== 'MATERIAL') return true;
      return filters.materialCategories.includes(readCategoryCode(item));
    });
  }

  if (filters.beneficiaryCategories.length) {
    result = result.filter((item) => {
      const raw = item as Record<string, unknown>;
      const code = getHelpRequestBeneficiaryCategoryCode(raw.beneficiary);
      return code != null && filters.beneficiaryCategories.includes(code);
    });
  }

  if (filters.datePreset) {
    result = result.filter((item) => {
      if (readType(item) !== 'SOCIAL') return false;
      const startAt = readStartAt(item);
      if (!startAt) return false;
      return matchesVolunteerFeedDatePreset(startAt, filters.datePreset!, new Date(), {
        fromIso: filters.customDateFromIso,
        toIso: filters.customDateToIso,
      });
    });
  }

  if (
    filters.maxDistanceKm !== DEFAULT_VOLUNTEER_FEED_FILTERS.maxDistanceKm &&
    filters.sort !== 'near'
  ) {
    result = result.filter((item) => {
      const distance = readDistanceKm(item);
      return distance == null || distance <= filters.maxDistanceKm;
    });
  }

  if (filters.sort === 'urgent') {
    result = [...result].sort((a, b) => {
      const aStart = readStartAt(a);
      const bStart = readStartAt(b);
      if (!aStart && !bStart) return 0;
      if (!aStart) return 1;
      if (!bStart) return -1;
      return new Date(aStart).getTime() - new Date(bStart).getTime();
    });
  }

  if (filters.sort === 'near') {
    result = [...result].sort(
      (a, b) => (readDistanceKm(a) ?? 999) - (readDistanceKm(b) ?? 999),
    );
  }

  return result;
}
