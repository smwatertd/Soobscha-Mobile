import { getHelpRequestHistory } from '../api/helpRequests';
import { HelpRequestSummary } from '../api/helpRequests';
import { BenRequestCardReason } from '../components/beneficiary/BenRequestCard';
import { extractModerationFeedback } from './extractModerationFeedback';
import { formatHelpRequestDate } from './helpRequestStatus';

function formatModerationAuthor(at?: string): string | undefined {
  if (!at) return undefined;
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return undefined;
  const when = date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `Партнёр · ${when}`;
}

export function buildBenRequestReason(
  apiStatus: string,
  feedback: ReturnType<typeof extractModerationFeedback>,
): BenRequestCardReason | undefined {
  if (apiStatus === 'RETURNED_TO_REWORK' && feedback.returnReason) {
    return {
      kind: 'rework',
      label: 'Партнёр попросил исправить',
      text: feedback.returnReason,
      author: formatModerationAuthor(feedback.returnedAt),
    };
  }

  if (apiStatus === 'REJECTED' && feedback.rejectionReason) {
    return {
      kind: 'reject',
      label: 'Причина отказа',
      text: feedback.rejectionReason,
      author: formatModerationAuthor(feedback.rejectedAt),
    };
  }

  return undefined;
}

export async function loadBenRequestReasons(
  items: HelpRequestSummary[],
): Promise<Map<string, BenRequestCardReason>> {
  const map = new Map<string, BenRequestCardReason>();
  const targets = items.filter((item) => {
    const status = String(item.status ?? '');
    return status === 'RETURNED_TO_REWORK' || status === 'REJECTED';
  });

  await Promise.all(
    targets.map(async (item) => {
      const id = typeof item.id === 'string' ? item.id : '';
      if (!id) return;
      try {
        const history = await getHelpRequestHistory(id);
        const feedback = extractModerationFeedback(history);
        const reason = buildBenRequestReason(String(item.status ?? ''), feedback);
        if (reason) map.set(id, reason);
      } catch {
        // reason block is optional
      }
    }),
  );

  return map;
}

export function fallbackBenRequestReason(
  apiStatus: string,
  createdAt?: string,
): BenRequestCardReason | undefined {
  const author = createdAt ? `Отправлено ${formatHelpRequestDate(createdAt)}` : undefined;

  if (apiStatus === 'RETURNED_TO_REWORK') {
    return {
      kind: 'rework',
      label: 'Партнёр попросил исправить',
      text: 'Уточните детали заявки и отправьте повторно на проверку.',
      author,
    };
  }

  if (apiStatus === 'REJECTED') {
    return {
      kind: 'reject',
      label: 'Причина отказа',
      text: 'Заявка не прошла модерацию. Подробности — в уведомлениях или у поддержки.',
      author,
    };
  }

  return undefined;
}
