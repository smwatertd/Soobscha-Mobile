import {
  DEFAULT_VOLUNTEER_FEED_FILTERS,
  VolunteerFeedFilters,
} from '../types/volunteerFeedFilters';
import { getVolunteerSocialHelpTypeLabel } from '../constants/volunteerSocialHelpTypeFilters';
import { VolunteerFeedItem } from '../screens/volunteer/volunteerFeedTypes';
import { matchesVolunteerFeedDatePreset } from './volunteerFeedDateFilter';

function matchesHelpTypeCategory(item: VolunteerFeedItem, codes: string[]): boolean {
  if (!codes.length) return true;
  return codes.some((code) => {
    if (item.categoryCode === code) return true;
    const label = getVolunteerSocialHelpTypeLabel(code);
    return item.reqCategory.toLowerCase() === label.toLowerCase();
  });
}

export function applyVolunteerFeedFilters(
  items: VolunteerFeedItem[],
  filters: VolunteerFeedFilters,
  search: string,
): VolunteerFeedItem[] {
  let result = items;

  if (!filters.social) {
    result = result.filter((item) => item.type !== 'social');
  }
  if (!filters.material) {
    result = result.filter((item) => item.type !== 'material');
  }

  if (filters.socialCategories.length) {
    result = result.filter((item) =>
      item.type !== 'social' ? true : matchesHelpTypeCategory(item, filters.socialCategories),
    );
  }
  if (filters.materialCategories.length) {
    result = result.filter((item) =>
      item.type !== 'material'
        ? true
        : item.categoryCode != null && filters.materialCategories.includes(item.categoryCode),
    );
  }

  if (filters.beneficiaryCategories.length) {
    result = result.filter(
      (item) =>
        item.benCategoryCode != null &&
        filters.beneficiaryCategories.includes(item.benCategoryCode),
    );
  }

  if (filters.datePreset) {
    result = result.filter((item) => {
      if (item.type !== 'social' || !item.startAtIso) return false;
      return matchesVolunteerFeedDatePreset(item.startAtIso, filters.datePreset!, new Date(), {
        fromIso: filters.customDateFromIso,
        toIso: filters.customDateToIso,
      });
    });
  }

  if (filters.maxDistanceKm !== DEFAULT_VOLUNTEER_FEED_FILTERS.maxDistanceKm) {
    result = result.filter(
      (item) => item.distanceKm == null || item.distanceKm <= filters.maxDistanceKm,
    );
  }

  const query = search.trim().toLowerCase();
  if (query) {
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query) ||
        item.reqCategory.toLowerCase().includes(query),
    );
  }

  if (filters.sort === 'urgent') {
    result = [...result].sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));
  }

  if (filters.sort === 'near') {
    result = [...result].sort(
      (a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999),
    );
  }

  return result;
}
