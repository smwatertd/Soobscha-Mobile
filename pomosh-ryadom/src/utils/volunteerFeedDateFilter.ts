import { VolunteerFeedDatePreset } from '../types/volunteerFeedFilters';

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

export function matchesVolunteerFeedDatePreset(
  startAtIso: string | undefined,
  preset: VolunteerFeedDatePreset,
  now = new Date(),
  customRange?: { fromIso?: string | null; toIso?: string | null },
): boolean {
  if (!startAtIso) return false;
  const start = new Date(startAtIso);
  if (Number.isNaN(start.getTime())) return false;

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  switch (preset) {
    case 'today':
      return start >= todayStart && start <= todayEnd;
    case 'tomorrow': {
      const tomorrow = new Date(todayStart);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowEnd = endOfDay(tomorrow);
      return start >= tomorrow && start <= tomorrowEnd;
    }
    case 'this_week': {
      const weekStart = startOfWeekMonday(now);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return start >= weekStart && start <= endOfDay(weekEnd);
    }
    case 'next_week': {
      const thisWeekStart = startOfWeekMonday(now);
      const nextWeekStart = new Date(thisWeekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
      return start >= nextWeekStart && start <= endOfDay(nextWeekEnd);
    }
    case 'this_month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return start >= monthStart && start <= monthEnd;
    }
    case 'custom': {
      const from = customRange?.fromIso ? parseIsoDate(customRange.fromIso) : null;
      const to = customRange?.toIso ? parseIsoDate(customRange.toIso) : null;
      if (from && to) {
        return start >= startOfDay(from) && start <= endOfDay(to);
      }
      if (from) return start >= startOfDay(from);
      if (to) return start <= endOfDay(to);
      return false;
    }
    default:
      return true;
  }
}
