import { HelpRequestSummary } from '../api/helpRequests';
import { SocialHelpRequestSummary } from '../api/integrationTypes';
import { BenRequestCardData, BenRequestCardReason } from '../components/beneficiary/BenRequestCard';
import { formatShortLocation } from '../navigation/createHelpRequestTypes';
import { T } from '../theme/tokens';
import {
  formatHelpRequestDate,
  formatHelpRequestDateTime,
  helpRequestStatusToBadge,
} from './helpRequestStatus';

function asRecord(item: HelpRequestSummary): Record<string, unknown> {
  return item as Record<string, unknown>;
}

function formatRublesFromKopeks(kopeks: number): string {
  return `${Math.round(kopeks / 100).toLocaleString('ru-RU')} ₽`;
}

function truncate(text: string, max = 90): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function socialSub(item: Record<string, unknown>): string {
  const apiStatus = String(item.status ?? '');
  if (apiStatus === 'RETURNED_TO_REWORK') {
    return 'Партнёр попросил уточнить детали заявки';
  }
  if (apiStatus === 'PENDING_MODERATION') {
    return 'Отправлено на проверку модератору';
  }
  if (apiStatus === 'WAITING_REPORT' || apiStatus === 'REPORT_ON_MODERATION') {
    return 'Нужно подготовить отчёт о выполненной помощи';
  }
  if (apiStatus === 'COMPLETED') {
    return 'Помощь оказана · отчёт принят';
  }
  if (apiStatus === 'REJECTED') {
    return 'Заявка отклонена партнёром';
  }
  if (apiStatus === 'CANCELLED') {
    return 'Заявка отменена';
  }
  if (apiStatus === 'INTERRUPTED') {
    return 'Выполнение прервано';
  }

  const startAt = typeof item.start_at === 'string' ? item.start_at : '';
  const place =
    (typeof item.place_name === 'string' && item.place_name) ||
    (typeof item.address_text === 'string' && item.address_text) ||
    '';

  if (startAt) {
    const when = formatHelpRequestDateTime(startAt);
    return place ? `${when} · ${formatShortLocation(place)}` : when;
  }

  const description = typeof item.description === 'string' ? item.description : '';
  return description ? truncate(description) : '';
}

function materialSub(item: Record<string, unknown>): string {
  const apiStatus = String(item.status ?? '');
  if (apiStatus === 'RETURNED_TO_REWORK') {
    return 'Партнёр попросил уточнить детали сбора';
  }
  if (apiStatus === 'PENDING_MODERATION') {
    return 'Отправлено на проверку модератору';
  }
  if (apiStatus === 'COLLECTING_FUNDS') {
    return 'Идёт сбор средств на вашу цель';
  }
  if (apiStatus === 'FUNDED') {
    return 'Цель достигнута — запросите выплату';
  }
  if (apiStatus === 'REPORT_ON_REVIEW' || apiStatus === 'REPORT_OVERDUE') {
    return 'Нужен отчёт о расходовании средств';
  }
  if (apiStatus === 'COMPLETED') {
    return 'Сбор завершён · выплата проведена';
  }
  if (apiStatus === 'REJECTED') {
    return 'Заявка отклонена партнёром';
  }
  if (apiStatus === 'CANCELLED') {
    return 'Заявка отменена';
  }
  if (apiStatus === 'INTERRUPTED') {
    return 'Сбор прерван';
  }

  const description = typeof item.description === 'string' ? item.description : '';
  return description ? truncate(description) : '';
}

function materialFooter(item: Record<string, unknown>): string {
  const requested = typeof item.amount_requested_kopeks === 'number' ? item.amount_requested_kopeks : 0;
  const collected = typeof item.amount_collected_kopeks === 'number' ? item.amount_collected_kopeks : 0;
  const createdAt = typeof item.created_at === 'string' ? item.created_at : '';
  const apiStatus = String(item.status ?? '');

  if (requested > 0 && (apiStatus === 'COLLECTING_FUNDS' || apiStatus === 'FUNDED' || apiStatus === 'COMPLETED')) {
    return `${formatRublesFromKopeks(collected)} из ${formatRublesFromKopeks(requested)}`;
  }
  if (createdAt) {
    return `Создано ${formatHelpRequestDate(createdAt)}`;
  }
  return '';
}

function socialFooter(
  item: Record<string, unknown>,
  detail?: SocialHelpRequestSummary | null,
): string {
  const createdAt = typeof item.created_at === 'string' ? item.created_at : '';
  const apiStatus = String(item.status ?? '');
  const min = typeof item.min_volunteers === 'number' ? item.min_volunteers : undefined;
  const max = typeof item.max_volunteers === 'number' ? item.max_volunteers : undefined;
  const joined = detail?.participants?.joined;

  if (joined !== undefined && max !== undefined) {
    const need = min !== undefined ? Math.max(0, min - joined) : undefined;
    const base = `${joined} из ${max} волонтёров`;
    return need !== undefined && need > 0 ? `${base} · нужно ещё ${need}` : base;
  }

  if (apiStatus === 'RETURNED_TO_REWORK' && createdAt) {
    return `${formatHelpRequestDate(createdAt)} · нужны правки`;
  }
  if (createdAt) {
    return `Создано ${formatHelpRequestDate(createdAt)}`;
  }
  return '';
}

function materialProgress(item: Record<string, unknown>): BenRequestCardData['progress'] | undefined {
  const requested = typeof item.amount_requested_kopeks === 'number' ? item.amount_requested_kopeks : 0;
  const collected = typeof item.amount_collected_kopeks === 'number' ? item.amount_collected_kopeks : 0;
  const apiStatus = String(item.status ?? '');

  if (requested <= 0) return undefined;
  if (
    apiStatus !== 'COLLECTING_FUNDS' &&
    apiStatus !== 'FUNDED' &&
    apiStatus !== 'COMPLETED'
  ) {
    return undefined;
  }

  const color =
    apiStatus === 'COMPLETED' || apiStatus === 'FUNDED' ? T.success : T.accent;

  return {
    value: Math.round(collected / 100),
    max: Math.round(requested / 100),
    color,
    format: 'money',
  };
}

function socialProgress(
  item: Record<string, unknown>,
  detail?: SocialHelpRequestSummary | null,
): BenRequestCardData['progress'] | undefined {
  const max = typeof item.max_volunteers === 'number' ? item.max_volunteers : undefined;
  const joined = detail?.participants?.joined;
  if (joined === undefined || max === undefined || max <= 0) return undefined;

  return {
    value: joined,
    max,
    color: T.primary,
    format: 'count',
  };
}

function mediaIds(item: Record<string, unknown>): string[] {
  const files = item.media_files;
  if (!Array.isArray(files) || files.length === 0) return [];

  return files
    .map((file) => {
      if (file && typeof file === 'object' && 'media_id' in file) {
        const id = (file as { media_id?: string }).media_id;
        return typeof id === 'string' ? id : undefined;
      }
      return undefined;
    })
    .filter((id): id is string => Boolean(id));
}

export function mapHelpRequestToBenRequestCard(
  item: HelpRequestSummary,
  detail?: SocialHelpRequestSummary | null,
  reason?: BenRequestCardReason,
): BenRequestCardData {
  const raw = asRecord(item);
  const apiType = String(raw.type ?? '');
  const isMaterial = apiType === 'MATERIAL';
  const apiStatus = String(raw.status ?? '');
  const needsAction = apiStatus === 'RETURNED_TO_REWORK' || apiStatus === 'REJECTED';

  const amountRequested =
    typeof raw.amount_requested_kopeks === 'number' ? raw.amount_requested_kopeks : undefined;
  const amountCollected =
    typeof raw.amount_collected_kopeks === 'number' ? raw.amount_collected_kopeks : undefined;

  return {
    id: String(raw.id ?? ''),
    type: isMaterial ? 'material' : 'social',
    status: helpRequestStatusToBadge(apiStatus),
    title: String(raw.title ?? 'Заявка'),
    sub: isMaterial ? materialSub(raw) : socialSub(raw),
    footer: isMaterial ? materialFooter(raw) : socialFooter(raw, detail),
    needsAction: needsAction && Boolean(reason),
    reason,
    progress: isMaterial ? materialProgress(raw) : socialProgress(raw, detail),
    imageMediaIds: mediaIds(raw),
    categoryCode: typeof raw.category === 'string' ? raw.category : undefined,
    apiStatus,
    createdAtIso: typeof raw.created_at === 'string' ? raw.created_at : undefined,
    amountRequestedKopeks: amountRequested,
    amountCollectedKopeks: amountCollected,
  };
}

export function sortBenRequestCards(items: BenRequestCardData[]): BenRequestCardData[] {
  return [...items].sort((a, b) => Number(Boolean(b.needsAction)) - Number(Boolean(a.needsAction)));
}

export function needsSocialVolunteerDetail(status: string): boolean {
  return (
    status === 'VOLUNTEER_RECRUITING' ||
    status === 'WAITING_RELEVANCE_CONFIRMATION' ||
    status === 'WAITING_START' ||
    status === 'IN_PROGRESS'
  );
}
