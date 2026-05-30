const STATUS_TO_BADGE: Record<string, string> = {
  PENDING_MODERATION: 'moderation',
  RETURNED_TO_REWORK: 'rework',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  VOLUNTEER_RECRUITING: 'recruiting',
  WAITING_RELEVANCE_CONFIRMATION: 'waiting_start',
  WAITING_START: 'waiting_start',
  IN_PROGRESS: 'in_progress',
  WAITING_REPORT: 'report',
  REPORT_ON_MODERATION: 'report',
  REPORT_ON_REVIEW: 'report_on_review',
  REPORT_OVERDUE: 'report_overdue',
  COMPLETED: 'completed',
  INTERRUPTED: 'interrupted',
  COLLECTING_FUNDS: 'collecting',
  FUNDED: 'funded',
};

/** Статусы «в процессе» по OpenAPI (SocialHelpRequestStatus + MaterialHelpRequestStatus). */
export const IN_PROGRESS_SOCIAL_STATUSES = [
  'VOLUNTEER_RECRUITING',
  'WAITING_RELEVANCE_CONFIRMATION',
  'WAITING_START',
  'IN_PROGRESS',
] as const;

export const IN_PROGRESS_MATERIAL_STATUSES = ['COLLECTING_FUNDS'] as const;

export const IN_PROGRESS_HELP_REQUEST_STATUSES = [
  ...IN_PROGRESS_SOCIAL_STATUSES,
  ...IN_PROGRESS_MATERIAL_STATUSES,
] as const;

/** Все незавершённые заявки (вкладка «Активные»). */
export const ACTIVE_HELP_REQUEST_STATUSES = [
  'PENDING_MODERATION',
  'RETURNED_TO_REWORK',
  'VOLUNTEER_RECRUITING',
  'WAITING_RELEVANCE_CONFIRMATION',
  'WAITING_START',
  'IN_PROGRESS',
  'WAITING_REPORT',
  'REPORT_ON_MODERATION',
  'COLLECTING_FUNDS',
  'FUNDED',
  'REPORT_ON_REVIEW',
  'REPORT_OVERDUE',
] as const;

export const DONE_HELP_REQUEST_STATUSES = ['COMPLETED'] as const;

export const ARCHIVE_HELP_REQUEST_STATUSES = ['REJECTED', 'CANCELLED', 'INTERRUPTED'] as const;

export const SOCIAL_VOLUNTEER_PROGRESS_STATUSES = [
  'VOLUNTEER_RECRUITING',
  'WAITING_RELEVANCE_CONFIRMATION',
  'WAITING_START',
  'IN_PROGRESS',
] as const;

export type BeneficiaryRequestsTab = 'active' | 'done' | 'archive';

export function statusesForBeneficiaryRequestsTab(tab: BeneficiaryRequestsTab): readonly string[] {
  switch (tab) {
    case 'active':
      return ACTIVE_HELP_REQUEST_STATUSES;
    case 'done':
      return DONE_HELP_REQUEST_STATUSES;
    case 'archive':
      return ARCHIVE_HELP_REQUEST_STATUSES;
  }
}

const IN_PROGRESS_STATUSES = new Set<string>(IN_PROGRESS_HELP_REQUEST_STATUSES);

export function helpRequestStatusToBadge(status: string): string {
  return STATUS_TO_BADGE[status] ?? status.toLowerCase();
}

export function isInProgressHelpRequestStatus(status: string): boolean {
  return IN_PROGRESS_STATUSES.has(status);
}

export function formatHelpRequestDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function formatHelpRequestDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time}`;
}

export function firstNameFromFullName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return fullName;
  return trimmed.split(/\s+/)[0] ?? trimmed;
}
