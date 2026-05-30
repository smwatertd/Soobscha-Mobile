import { VolunteerFeedDatePreset, VolunteerFeedFilters } from '../types/volunteerFeedFilters';

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

function startOfWeekMonday(d: Date): Date {
  const copy = startOfDay(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function parseIsoDate(iso: string): Date | null {
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toApiDateTime(date: Date): string {
  return date.toISOString();
}

export function buildHelpRequestsDateRange(
  filters: Pick<
    VolunteerFeedFilters,
    'datePreset' | 'customDateFromIso' | 'customDateToIso'
  >,
  now = new Date(),
): { dateFrom?: string; dateTo?: string } {
  if (!filters.datePreset) return {};

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  switch (filters.datePreset) {
    case 'today':
      return { dateFrom: toApiDateTime(todayStart), dateTo: toApiDateTime(todayEnd) };
    case 'tomorrow': {
      const tomorrow = new Date(todayStart);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { dateFrom: toApiDateTime(tomorrow), dateTo: toApiDateTime(endOfDay(tomorrow)) };
    }
    case 'this_week': {
      const weekStart = startOfWeekMonday(now);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return { dateFrom: toApiDateTime(weekStart), dateTo: toApiDateTime(endOfDay(weekEnd)) };
    }
    case 'next_week': {
      const thisWeekStart = startOfWeekMonday(now);
      const nextWeekStart = new Date(thisWeekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
      return {
        dateFrom: toApiDateTime(nextWeekStart),
        dateTo: toApiDateTime(endOfDay(nextWeekEnd)),
      };
    }
    case 'this_month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { dateFrom: toApiDateTime(monthStart), dateTo: toApiDateTime(monthEnd) };
    }
    case 'custom': {
      const from = filters.customDateFromIso ? parseIsoDate(filters.customDateFromIso) : null;
      const to = filters.customDateToIso ? parseIsoDate(filters.customDateToIso) : null;
      return {
        dateFrom: from ? toApiDateTime(startOfDay(from)) : undefined,
        dateTo: to ? toApiDateTime(endOfDay(to)) : undefined,
      };
    }
    default:
      return {};
  }
}
