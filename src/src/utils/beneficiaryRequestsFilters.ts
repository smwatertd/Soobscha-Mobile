import { BenRequestCardData } from '../components/beneficiary/BenRequestCard';

export type BeneficiaryRequestsTypeFilter = 'all' | 'social' | 'material';

export type BeneficiaryRequestsSortOrder = 'new' | 'old' | 'urgent' | 'progress' | 'deadline';

export type BeneficiaryCreatedPreset =
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | 'all'
  | 'custom';

export type BeneficiarySpecialFilter =
  | 'needs_action'
  | 'close_deadline'
  | 'can_payout'
  | 'missing_report';

export const BENEFICIARY_STATUS_FILTER_OPTIONS: { code: string; label: string }[] = [
  { code: 'PENDING_MODERATION', label: 'На модерации' },
  { code: 'RETURNED_TO_REWORK', label: 'На доработке' },
  { code: 'VOLUNTEER_RECRUITING', label: 'Идёт набор' },
  { code: 'COLLECTING_FUNDS', label: 'Идёт сбор' },
  { code: 'IN_PROGRESS', label: 'В процессе' },
  { code: 'WAITING_REPORT', label: 'Ожидает отчёта' },
  { code: 'REPORT_ON_MODERATION', label: 'Отчёт на проверке' },
  { code: 'REPORT_ON_REVIEW', label: 'Отчёт на проверке' },
  { code: 'COMPLETED', label: 'Завершено' },
  { code: 'REJECTED', label: 'Отклонено' },
  { code: 'INTERRUPTED', label: 'Прервано' },
];

export const BENEFICIARY_SPECIAL_FILTER_OPTIONS: {
  id: BeneficiarySpecialFilter;
  title: string;
  sub: string;
  icon: 'warn' | 'clock' | 'wallet' | 'document';
  color: string;
}[] = [
  {
    id: 'needs_action',
    title: 'Требуют действия',
    sub: 'Нужны правки или ответ',
    icon: 'warn',
    color: '#C75653',
  },
  {
    id: 'close_deadline',
    title: 'Близкий дедлайн',
    sub: 'До конца сбора < 3 дней',
    icon: 'clock',
    color: '#8B5E10',
  },
  {
    id: 'can_payout',
    title: 'Можно запросить выплату',
    sub: 'Собрано полностью',
    icon: 'wallet',
    color: '#3D6940',
  },
  {
    id: 'missing_report',
    title: 'Без отчёта',
    sub: 'Работа завершена, отчёт ещё не составлен',
    icon: 'document',
    color: '#446D9E',
  },
];

export const BENEFICIARY_CREATED_PRESETS: { id: BeneficiaryCreatedPreset; label: string }[] = [
  { id: 'week', label: 'За неделю' },
  { id: 'month', label: 'За месяц' },
  { id: 'quarter', label: 'За 3 месяца' },
  { id: 'year', label: 'За год' },
  { id: 'all', label: 'Всё время' },
  { id: 'custom', label: 'Выбрать' },
];

export const SUM_FILTER_MIN_RUB = 1_000;
export const SUM_FILTER_MAX_RUB = 5_000_000;
export const DEFAULT_SUM_MIN_RUB = 10_000;
export const DEFAULT_SUM_MAX_RUB = 300_000;

export type BeneficiaryRequestsFilters = {
  typeFilter: BeneficiaryRequestsTypeFilter;
  sortOrder: BeneficiaryRequestsSortOrder;
  categoryCodes: string[];
  statusCodes: string[];
  specialFilters: BeneficiarySpecialFilter[];
  createdPreset: BeneficiaryCreatedPreset;
  createdFromIso?: string | null;
  createdToIso?: string | null;
  sumMinRub: number;
  sumMaxRub: number;
};

export const DEFAULT_BENEFICIARY_REQUESTS_FILTERS: BeneficiaryRequestsFilters = {
  typeFilter: 'all',
  sortOrder: 'new',
  categoryCodes: [],
  statusCodes: [],
  specialFilters: [],
  createdPreset: 'all',
  createdFromIso: null,
  createdToIso: null,
  sumMinRub: DEFAULT_SUM_MIN_RUB,
  sumMaxRub: DEFAULT_SUM_MAX_RUB,
};

export function typeFilterToApi(
  typeFilter: BeneficiaryRequestsTypeFilter,
): 'MATERIAL' | 'SOCIAL' | undefined {
  if (typeFilter === 'social') return 'SOCIAL';
  if (typeFilter === 'material') return 'MATERIAL';
  return undefined;
}

function parseIsoDate(iso: string): Date | null {
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function matchesCreatedPreset(
  createdAtIso: string | undefined,
  preset: BeneficiaryCreatedPreset,
  range?: { fromIso?: string | null; toIso?: string | null },
): boolean {
  if (preset === 'all') return true;
  if (preset === 'custom') {
    const from = range?.fromIso ? parseIsoDate(range.fromIso) : null;
    const to = range?.toIso ? parseIsoDate(range.toIso) : null;
    if (!from && !to) return true;
    if (!createdAtIso) return false;
    const created = new Date(createdAtIso);
    if (Number.isNaN(created.getTime())) return false;
    if (from && created < startOfDay(from)) return false;
    if (to && created > endOfDay(to)) return false;
    return true;
  }
  if (!createdAtIso) return false;
  const created = new Date(createdAtIso);
  if (Number.isNaN(created.getTime())) return false;

  const now = new Date();
  const daysAgo = (now.getTime() - created.getTime()) / (24 * 60 * 60 * 1000);

  switch (preset) {
    case 'week':
      return daysAgo <= 7;
    case 'month':
      return daysAgo <= 31;
    case 'quarter':
      return daysAgo <= 92;
    case 'year':
      return daysAgo <= 366;
    default:
      return true;
  }
}

function matchesSpecialFilter(item: BenRequestCardData, filter: BeneficiarySpecialFilter): boolean {
  const status = item.apiStatus ?? '';

  switch (filter) {
    case 'needs_action':
      return (
        Boolean(item.needsAction) ||
        status === 'RETURNED_TO_REWORK' ||
        status === 'REJECTED'
      );
    case 'close_deadline':
      if (item.type !== 'material' || status !== 'COLLECTING_FUNDS' || !item.progress) {
        return false;
      }
      return item.progress.max > 0 && item.progress.value / item.progress.max >= 0.97;
    case 'can_payout':
      return status === 'FUNDED';
    case 'missing_report':
      return ['WAITING_REPORT', 'REPORT_OVERDUE', 'REPORT_ON_REVIEW'].includes(status);
    default:
      return true;
  }
}

function isDefaultSumRange(minRub: number, maxRub: number): boolean {
  return minRub === DEFAULT_SUM_MIN_RUB && maxRub === DEFAULT_SUM_MAX_RUB;
}

function matchesSumRange(item: BenRequestCardData, minRub: number, maxRub: number): boolean {
  if (item.type !== 'material') return true;
  const requested = item.amountRequestedKopeks ?? 0;
  if (requested <= 0) return true;
  const rub = Math.round(requested / 100);
  if (isDefaultSumRange(minRub, maxRub)) return true;
  return rub >= minRub && rub <= maxRub;
}

function sortBeneficiaryRequests(
  items: BenRequestCardData[],
  sortOrder: BeneficiaryRequestsSortOrder,
): BenRequestCardData[] {
  const copy = [...items];

  if (sortOrder === 'urgent') {
    return copy.sort((a, b) => Number(Boolean(b.needsAction)) - Number(Boolean(a.needsAction)));
  }

  if (sortOrder === 'progress') {
    return copy.sort((a, b) => progressRatio(b) - progressRatio(a));
  }

  if (sortOrder === 'deadline') {
    return copy.sort((a, b) => deadlineScore(a) - deadlineScore(b));
  }

  if (sortOrder === 'old') {
    return copy.sort(
      (a, b) =>
        new Date(a.createdAtIso ?? 0).getTime() - new Date(b.createdAtIso ?? 0).getTime(),
    );
  }

  return copy.sort((a, b) => {
    const action = Number(Boolean(b.needsAction)) - Number(Boolean(a.needsAction));
    if (action !== 0) return action;
    return (
      new Date(b.createdAtIso ?? 0).getTime() - new Date(a.createdAtIso ?? 0).getTime()
    );
  });
}

function progressRatio(item: BenRequestCardData): number {
  if (!item.progress || item.progress.max <= 0) return -1;
  return item.progress.value / item.progress.max;
}

function deadlineScore(item: BenRequestCardData): number {
  if (item.type !== 'material' || item.apiStatus !== 'COLLECTING_FUNDS') return 999;
  const ratio = progressRatio(item);
  return ratio < 0 ? 999 : 1 - ratio;
}

export function applyBeneficiaryRequestFilters(
  items: BenRequestCardData[],
  filters: BeneficiaryRequestsFilters,
  searchQuery: string,
): BenRequestCardData[] {
  let result = items;

  if (filters.typeFilter === 'social') {
    result = result.filter((item) => item.type === 'social');
  } else if (filters.typeFilter === 'material') {
    result = result.filter((item) => item.type === 'material');
  }

  if (filters.categoryCodes.length > 0) {
    result = result.filter(
      (item) => item.categoryCode && filters.categoryCodes.includes(item.categoryCode),
    );
  }

  if (filters.statusCodes.length > 0) {
    result = result.filter(
      (item) => item.apiStatus && filters.statusCodes.includes(item.apiStatus),
    );
  }

  if (filters.specialFilters.length > 0) {
    result = result.filter((item) =>
      filters.specialFilters.some((flag) => matchesSpecialFilter(item, flag)),
    );
  }

  result = result.filter((item) =>
    matchesCreatedPreset(item.createdAtIso, filters.createdPreset, {
      fromIso: filters.createdFromIso,
      toIso: filters.createdToIso,
    }),
  );

  if (!isDefaultSumRange(filters.sumMinRub, filters.sumMaxRub)) {
    result = result.filter((item) =>
      matchesSumRange(item, filters.sumMinRub, filters.sumMaxRub),
    );
  }

  const query = searchQuery.trim().toLowerCase();
  if (query) {
    result = result.filter((item) => {
      const haystack = `${item.title} ${item.sub} ${item.footer}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  return sortBeneficiaryRequests(result, filters.sortOrder);
}

export function countSpecialFilterMatches(
  items: BenRequestCardData[],
  filter: BeneficiarySpecialFilter,
): number {
  return items.filter((item) => matchesSpecialFilter(item, filter)).length;
}

export function hasActiveBeneficiaryRequestFilters(filters: BeneficiaryRequestsFilters): boolean {
  return !beneficiaryRequestFiltersEqual(filters, DEFAULT_BENEFICIARY_REQUESTS_FILTERS);
}

export function countStatusMatchesOnTab(
  items: BenRequestCardData[],
  statusCodes: string[],
): number {
  if (!statusCodes.length) return items.length;
  return items.filter((item) => item.apiStatus && statusCodes.includes(item.apiStatus)).length;
}

export function beneficiaryRequestFiltersEqual(
  a: BeneficiaryRequestsFilters,
  b: BeneficiaryRequestsFilters,
): boolean {
  return (
    a.typeFilter === b.typeFilter &&
    a.sortOrder === b.sortOrder &&
    a.createdPreset === b.createdPreset &&
    a.createdFromIso === b.createdFromIso &&
    a.createdToIso === b.createdToIso &&
    a.sumMinRub === b.sumMinRub &&
    a.sumMaxRub === b.sumMaxRub &&
    a.categoryCodes.length === b.categoryCodes.length &&
    a.categoryCodes.every((code, index) => code === b.categoryCodes[index]) &&
    a.statusCodes.length === b.statusCodes.length &&
    a.statusCodes.every((code, index) => code === b.statusCodes[index]) &&
    a.specialFilters.length === b.specialFilters.length &&
    a.specialFilters.every((code, index) => code === b.specialFilters[index])
  );
}
