export type VolunteerFeedSort = 'near' | 'urgent' | 'new';

export type VolunteerFeedDatePreset =
  | 'today'
  | 'tomorrow'
  | 'this_week'
  | 'next_week'
  | 'this_month'
  | 'custom';

export type VolunteerFeedFilters = {
  social: boolean;
  material: boolean;
  /** Коды категорий социальных заявок */
  socialCategories: string[];
  /** Коды категорий материальных сборов */
  materialCategories: string[];
  /** Коды категории благополучателя */
  beneficiaryCategories: string[];
  datePreset: VolunteerFeedDatePreset | null;
  /** Период для пресета «Выбрать дату» (ISO yyyy-mm-dd) */
  customDateFromIso?: string | null;
  customDateToIso?: string | null;
  sort: VolunteerFeedSort;
  maxDistanceKm: number;
};

export const DEFAULT_VOLUNTEER_FEED_FILTERS: VolunteerFeedFilters = {
  social: true,
  material: true,
  socialCategories: [],
  materialCategories: [],
  beneficiaryCategories: [],
  datePreset: null,
  customDateFromIso: null,
  customDateToIso: null,
  sort: 'new',
  maxDistanceKm: 30,
};

export type VolunteerFeedFiltersInput = Partial<VolunteerFeedFilters> & {
  /** @deprecated — переносится в socialCategories */
  categories?: string[];
};

export function normalizeVolunteerFeedFilters(
  partial?: VolunteerFeedFiltersInput,
): VolunteerFeedFilters {
  if (!partial) return { ...DEFAULT_VOLUNTEER_FEED_FILTERS };
  const { categories: legacyCategories, ...rest } = partial;
  return {
    ...DEFAULT_VOLUNTEER_FEED_FILTERS,
    ...rest,
    socialCategories: rest.socialCategories ?? legacyCategories ?? [],
    materialCategories: rest.materialCategories ?? [],
  };
}

export function countActiveFeedFilters(filters: VolunteerFeedFilters): number {
  let count = 0;
  if (!filters.social || !filters.material) count += 1;
  if (filters.socialCategories.length) count += 1;
  if (filters.materialCategories.length) count += 1;
  if (filters.beneficiaryCategories.length) count += 1;
  if (filters.datePreset) count += 1;
  if (filters.sort !== DEFAULT_VOLUNTEER_FEED_FILTERS.sort) count += 1;
  if (filters.maxDistanceKm !== DEFAULT_VOLUNTEER_FEED_FILTERS.maxDistanceKm) count += 1;
  return count;
}
