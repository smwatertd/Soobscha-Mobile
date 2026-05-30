import { getErrorMessage } from '../api/errors';
import { ParsedApiError } from '../api/types';

const DEFAULT_MESSAGE = 'Не удалось записаться на заявку';

const STATUS_MESSAGES: Partial<Record<string, string>> = {
  COMPLETED: 'На эту заявку нельзя записаться: она уже выполнена.',
  CANCELLED: 'Запись недоступна: заявка отменена.',
  INTERRUPTED: 'Запись недоступна: заявка прервана.',
  IN_PROGRESS: 'Заявка уже выполняется — записаться больше нельзя.',
  PENDING_MODERATION: 'Заявка на модерации — записаться пока нельзя.',
  RETURNED_TO_REWORK: 'Заявка на доработке — записаться пока нельзя.',
  REJECTED: 'Заявка отклонена — записаться нельзя.',
};

type MatchContext = {
  normalized: string;
  code?: string;
  status: number;
};

const MESSAGE_RULES: Array<{ test: (ctx: MatchContext) => boolean; message: string }> = [
  {
    test: ({ normalized, code }) =>
      /complet|заверш|выполнен|finished|done/.test(normalized) ||
      code === 'help_request_completed' ||
      code === 'request_completed',
    message: STATUS_MESSAGES.COMPLETED!,
  },
  {
    test: ({ normalized, code }) =>
      /cancel|отмен/.test(normalized) || code === 'help_request_cancelled',
    message: STATUS_MESSAGES.CANCELLED!,
  },
  {
    test: ({ normalized, code }) =>
      /interrupt|прерван/.test(normalized) || code === 'help_request_interrupted',
    message: STATUS_MESSAGES.INTERRUPTED!,
  },
  {
    test: ({ normalized, code }) =>
      /in.?progress|уже выполня|already started|started/.test(normalized) ||
      code === 'help_request_in_progress',
    message: STATUS_MESSAGES.IN_PROGRESS!,
  },
  {
    test: ({ normalized, code }) =>
      /already joined|уже записан|already participant|duplicate/.test(normalized) ||
      code === 'already_joined',
    message: 'Вы уже записаны на эту заявку.',
  },
  {
    test: ({ normalized, code }) =>
      /full|max.?volunteer|набор закрыт|no slots|мест нет|quota/.test(normalized) ||
      code === 'volunteers_limit_reached',
    message: 'Набор волонтёров на эту заявку уже закрыт.',
  },
  {
    test: ({ normalized, code }) =>
      /recruit|набор|not accepting|cannot join|can not join|can.t join|нельзя запис|запис.*недоступ|join.*not allowed|not allowed to join/.test(
        normalized,
      ) ||
      code === 'join_not_allowed',
    message: 'Сейчас нельзя записаться на эту заявку.',
  },
  {
    test: ({ normalized, code }) =>
      /verif|верифик|not verified/.test(normalized) || code === 'volunteer_not_verified',
    message: 'Для записи нужна пройденная верификация профиля.',
  },
  {
    test: ({ normalized, code }) =>
      /skill|навык|qualif/.test(normalized) || code === 'missing_required_skills',
    message: 'У вас не хватает нужных навыков для этой заявки.',
  },
];

function readParsedError(err: unknown): ParsedApiError | undefined {
  if (err && typeof err === 'object' && 'parsed' in err) {
    const parsed = (err as { parsed?: ParsedApiError }).parsed;
    if (parsed) return parsed;
  }
  return undefined;
}

export function resolveVolunteerJoinHelpRequestError(
  err: unknown,
  context?: { requestStatus?: string },
): string {
  const statusKey = context?.requestStatus?.toUpperCase();
  if (statusKey && STATUS_MESSAGES[statusKey]) {
    return STATUS_MESSAGES[statusKey]!;
  }

  const parsed = readParsedError(err);
  const raw = parsed?.message ?? (err instanceof Error ? err.message : '');
  const normalized = raw.toLowerCase();
  const code = parsed?.code?.toLowerCase();

  for (const rule of MESSAGE_RULES) {
    if (rule.test({ normalized, code, status: parsed?.status ?? 0 })) {
      return rule.message;
    }
  }

  if (parsed?.status === 409) {
    return 'Записаться на эту заявку сейчас нельзя.';
  }

  if (parsed?.status === 403) {
    return 'Недостаточно прав для записи на эту заявку.';
  }

  const fallback = getErrorMessage(err, DEFAULT_MESSAGE);
  if (fallback !== DEFAULT_MESSAGE && !looksLikeGenericValidation(fallback)) {
    return fallback;
  }

  return DEFAULT_MESSAGE;
}

function looksLikeGenericValidation(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower === 'проверьте правильность заполнения полей' ||
    lower === 'некорректный запрос' ||
    lower.startsWith('ошибка сервера')
  );
}
