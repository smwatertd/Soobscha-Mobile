import { HelpRequestDetail } from '../../../api/integrationTypes';
import { formatHelpRequestDate } from '../../../utils/helpRequestStatus';

export function formatKopeks(kopeks: number): string {
  return `${Math.round(kopeks / 100).toLocaleString('ru-RU')} ₽`;
}

export function getMaterialAmounts(request: HelpRequestDetail) {
  const financials = request.financials;
  return {
    requested:
      financials?.requested_kopeks ??
      financials?.amount_requested_kopeks ??
      request.amount_requested_kopeks ??
      0,
    collected:
      financials?.collected_kopeks ??
      financials?.amount_collected_kopeks ??
      request.amount_collected_kopeks ??
      0,
    withdrawn: financials?.withdrawn_kopeks ?? 0,
    available: financials?.available_for_withdrawal_kopeks ?? 0,
  };
}

export function participantDisplayName(firstName: string, lastName: string): string {
  const lastInitial = lastName.trim() ? `${lastName.trim()[0]}.` : '';
  return `${firstName.trim()} ${lastInitial}`.trim();
}

export function formatSocialHelpRequestWhenWhere(
  startAt: string,
  locationLabel: string | null,
): string {
  const date = new Date(startAt);
  if (Number.isNaN(date.getTime())) {
    return locationLabel ?? startAt;
  }

  const weekdayRaw = date.toLocaleDateString('ru-RU', { weekday: 'short' });
  const weekday = weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1);
  const dayMonth = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const when = `${weekday}, ${dayMonth} в ${time}`;

  return locationLabel ? `${when} · ${locationLabel}` : when;
}

export function formatRecruitmentDeadline(startAt: string): string {
  const date = new Date(startAt);
  if (Number.isNaN(date.getTime())) return formatHelpRequestDate(startAt);

  const deadline = new Date(date);
  deadline.setDate(deadline.getDate() - 2);
  return formatHelpRequestDate(deadline.toISOString());
}

export function volunteerShortageLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'волонтёр';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'волонтёра';
  return 'волонтёров';
}

export function formatSocialScheduleMeta(startAt: string): { when: string; endTime?: string } {
  const date = new Date(startAt);
  if (Number.isNaN(date.getTime())) {
    return { when: startAt };
  }

  const weekdayRaw = date.toLocaleDateString('ru-RU', { weekday: 'short' });
  const weekday = weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1);
  const dayMonth = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return { when: `${weekday}, ${dayMonth} · ${time}` };
}

export function formatSocialWhenFact(
  startAt: string,
  durationMinutes?: number | null,
): { value: string; sub?: string } {
  const date = new Date(startAt);
  if (Number.isNaN(date.getTime())) {
    return { value: startAt };
  }

  const weekdayRaw = date.toLocaleDateString('ru-RU', { weekday: 'short' });
  const weekday = weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1);
  const dayMonth = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const startTime = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  if (durationMinutes && durationMinutes > 0) {
    const end = new Date(date.getTime() + durationMinutes * 60_000);
    const endTime = end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return {
      value: `${weekday}, ${dayMonth}`,
      sub: `с ${startTime} до ${endTime}`,
    };
  }

  return { value: `${weekday}, ${dayMonth}`, sub: startTime };
}

export function formatDurationLabel(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '—';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `~${hours} ч ${mins} мин`;
  if (hours > 0) return `~${hours} ч`;
  return `~${mins} мин`;
}

export function formatDonorsCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} человек`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} человека`;
  return `${count} человек`;
}

export function formatDonationWhen(isoDate: string | undefined): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${diffMin} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays === 1) {
    return `вчера, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (diffDays < 7) {
    const label = diffDays >= 5 ? `${diffDays} дней` : `${diffDays} дня`;
    return `${label} назад`;
  }
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function formatPayoutsCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} выплата`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} выплаты`;
  return `${count} выплат`;
}

export function getPayoutStatusMeta(status: string): {
  label: string;
  kind: 'success' | 'warning' | 'danger' | 'info' | 'default';
} {
  switch (status) {
    case 'SUCCEEDED':
      return { label: 'Выплачено', kind: 'success' };
    case 'PROCESSING':
      return { label: 'В обработке', kind: 'info' };
    case 'REQUESTED':
      return { label: 'Запрошена', kind: 'warning' };
    case 'FAILED':
      return { label: 'Ошибка', kind: 'danger' };
    case 'CANCELLED':
      return { label: 'Отменена', kind: 'default' };
    default:
      return { label: status, kind: 'default' };
  }
}

export function getPayoutMethodIcon(type?: string): 'wallet' | 'qr' {
  return type === 'SBP' ? 'qr' : 'wallet';
}
