import {
  DEFAULT_VOLUNTEER_FEED_FILTERS,
  VolunteerFeedDatePreset,
  VolunteerFeedFilters,
} from '../types/volunteerFeedFilters';
import { getBeneficiaryFilterCategoryLabel } from '../constants/beneficiaryFilterCategories';
import { getVolunteerSocialHelpTypeLabel } from '../constants/volunteerSocialHelpTypeFilters';

export type VolunteerFeedFilterChip = {
  id: string;
  label: string;
};

const SORT_LABELS: Record<VolunteerFeedFilters['sort'], string> = {
  near: 'Ближе',
  urgent: 'Срочные',
  new: 'Новые',
};

const DATE_LABELS: Record<VolunteerFeedDatePreset, string> = {
  today: 'Сегодня',
  tomorrow: 'Завтра',
  this_week: 'Эта неделя',
  next_week: 'След. неделя',
  this_month: 'В этом месяце',
  custom: 'Выбрать дату',
};

export function buildVolunteerFeedFilterChips(
  filters: VolunteerFeedFilters,
  categoryLabels: Record<string, string> = {},
  searchQuery?: string,
): VolunteerFeedFilterChip[] {
  const chips: VolunteerFeedFilterChip[] = [];

  if (filters.social && !filters.material) {
    chips.push({ id: 'type-social', label: 'Делом' });
  }
  if (filters.material && !filters.social) {
    chips.push({ id: 'type-material', label: 'Деньгами' });
  }

  for (const code of filters.socialCategories) {
    chips.push({
      id: `social-category-${code}`,
      label: categoryLabels[code] ?? getVolunteerSocialHelpTypeLabel(code),
    });
  }

  for (const code of filters.materialCategories) {
    chips.push({
      id: `material-category-${code}`,
      label: categoryLabels[code] ?? code,
    });
  }

  for (const code of filters.beneficiaryCategories) {
    chips.push({
      id: `ben-${code}`,
      label: getBeneficiaryFilterCategoryLabel(code) ?? code,
    });
  }

  if (filters.datePreset) {
    if (
      filters.datePreset === 'custom' &&
      filters.customDateFromIso &&
      filters.customDateToIso
    ) {
      const from = new Date(`${filters.customDateFromIso}T12:00:00`).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      });
      const to = new Date(`${filters.customDateToIso}T12:00:00`).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      });
      chips.push({ id: 'date', label: `${from} — ${to}` });
    } else {
      chips.push({ id: 'date', label: DATE_LABELS[filters.datePreset] });
    }
  }

  if (filters.sort !== DEFAULT_VOLUNTEER_FEED_FILTERS.sort) {
    chips.push({ id: 'sort', label: SORT_LABELS[filters.sort] });
  }

  if (filters.maxDistanceKm !== DEFAULT_VOLUNTEER_FEED_FILTERS.maxDistanceKm) {
    chips.push({ id: 'distance', label: `до ${filters.maxDistanceKm} км` });
  }

  const query = searchQuery?.trim();
  if (query) {
    chips.push({ id: 'search', label: `«${query.length > 18 ? `${query.slice(0, 18)}…` : query}»` });
  }

  return chips;
}
