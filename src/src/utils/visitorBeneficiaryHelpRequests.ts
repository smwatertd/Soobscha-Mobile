import { HelpRequestSummary } from '../api/helpRequests';
import { VolunteerFeedItem } from '../screens/volunteer/volunteerFeedTypes';

/** Открытые заявки — волонтёр может их видеть (без модерации и черновиков). */
export const VISITOR_BENEFICIARY_ACTIVE_STATUSES = [
  'VOLUNTEER_RECRUITING',
  'WAITING_RELEVANCE_CONFIRMATION',
  'WAITING_START',
  'IN_PROGRESS',
  'WAITING_REPORT',
  'REPORT_ON_MODERATION',
  'REPORT_ON_REVIEW',
  'REPORT_OVERDUE',
  'COLLECTING_FUNDS',
  'FUNDED',
] as const;

/** Завершённые заявки. */
export const VISITOR_BENEFICIARY_COMPLETED_STATUSES = ['COMPLETED'] as const;

/** Все статусы, доступные волонтёру в публичном профиле благополучателя. */
export const VISITOR_BENEFICIARY_VISIBLE_STATUSES = [
  ...VISITOR_BENEFICIARY_ACTIVE_STATUSES,
  ...VISITOR_BENEFICIARY_COMPLETED_STATUSES,
] as const;

const ACTIVE_STATUS_SET = new Set<string>(VISITOR_BENEFICIARY_ACTIVE_STATUSES);
const COMPLETED_STATUS_SET = new Set<string>(VISITOR_BENEFICIARY_COMPLETED_STATUSES);
const VISIBLE_STATUS_SET = new Set<string>(VISITOR_BENEFICIARY_VISIBLE_STATUSES);

export type VisitorBeneficiaryRequestsBuckets = {
  active: VolunteerFeedItem[];
  completed: VolunteerFeedItem[];
  visible: VolunteerFeedItem[];
};

function readStatus(item: HelpRequestSummary): string {
  const raw = item as Record<string, unknown>;
  return typeof raw.status === 'string' ? raw.status : '';
}

export function isVisitorVisibleHelpRequestStatus(status: string): boolean {
  return VISIBLE_STATUS_SET.has(status);
}

export function filterVisitorVisibleHelpRequests(
  items: HelpRequestSummary[],
): HelpRequestSummary[] {
  return items.filter((item) => isVisitorVisibleHelpRequestStatus(readStatus(item)));
}

function bucketByStatus<T extends { status: string }>(items: T[]): VisitorBeneficiaryRequestsBuckets {
  const active: T[] = [];
  const completed: T[] = [];
  for (const item of items) {
    if (ACTIVE_STATUS_SET.has(item.status)) active.push(item);
    else if (COMPLETED_STATUS_SET.has(item.status)) completed.push(item);
  }
  return { active, completed, visible: [...active, ...completed] };
}

export function classifyVisitorBeneficiaryFeedItems(
  items: VolunteerFeedItem[],
): VisitorBeneficiaryRequestsBuckets {
  return bucketByStatus(items);
}
