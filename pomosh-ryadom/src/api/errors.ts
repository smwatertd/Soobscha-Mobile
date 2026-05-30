import { ApiErrorBody, ParsedApiError } from './types';

const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Некорректный запрос',
  401: 'Неверный телефон или пароль',
  403: 'Недостаточно прав для этого действия',
  404: 'Ресурс не найден',
  409: 'Конфликт данных — попробуйте ещё раз',
  422: 'Проверьте правильность заполнения полей',
  429: 'Слишком много запросов — попробуйте через минуту',
  500: 'Ошибка сервера — попробуйте позже',
  502: 'Сервер временно недоступен. Попробуйте позже',
  503: 'Сервер временно недоступен',
  504: 'Сервер не ответил вовремя. Попробуйте ещё раз',
};

const HTML_TITLE_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /502|bad gateway/i, message: DEFAULT_MESSAGES[502] },
  { pattern: /503|service unavailable/i, message: DEFAULT_MESSAGES[503] },
  { pattern: /504|gateway timeout/i, message: DEFAULT_MESSAGES[504] },
  { pattern: /500|internal server error/i, message: DEFAULT_MESSAGES[500] },
  { pattern: /404|not found/i, message: DEFAULT_MESSAGES[404] },
];

function looksLikeHtml(text: string): boolean {
  const trimmed = text.trim();
  return /^<!DOCTYPE/i.test(trimmed) || /^<html[\s>]/i.test(trimmed) || /^<\w+[^>]*>/.test(trimmed);
}

function extractHtmlTitle(text: string): string | null {
  const match = text.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() ?? null;
}

function messageForNonJsonBody(status: number, text: string): string {
  if (looksLikeHtml(text)) {
    const title = extractHtmlTitle(text);
    if (title) {
      for (const { pattern, message } of HTML_TITLE_PATTERNS) {
        if (pattern.test(title)) return message;
      }
    }
    return DEFAULT_MESSAGES[status] ?? 'Сервер вернул неожиданный ответ. Попробуйте позже';
  }

  const plain = text.trim();
  if (!plain) {
    return DEFAULT_MESSAGES[status] ?? `Ошибка (${status})`;
  }

  if (plain.length > 160 || plain.includes('\n')) {
    return DEFAULT_MESSAGES[status] ?? 'Сервер вернул неожиданный ответ. Попробуйте позже';
  }

  return plain;
}

function defaultMessage(status: number): string {
  return DEFAULT_MESSAGES[status] ?? `Ошибка сервера (${status})`;
}

function sanitizeDetailMessage(status: number, detail: string): string {
  const trimmed = detail.trim();
  if (!trimmed) return defaultMessage(status);
  if (looksLikeHtml(trimmed)) return messageForNonJsonBody(status, trimmed);
  if (trimmed.length > 160 || trimmed.includes('\n')) return defaultMessage(status);
  return trimmed;
}

export function parseApiError(status: number, body: unknown): ParsedApiError {
  const data = (body ?? {}) as ApiErrorBody;

  if (data.error?.message) {
    const message = sanitizeDetailMessage(status, data.error.message);
    const fieldErrors =
      extractFieldErrors(data.error.context ?? data.error.details) ??
      extractDetailsArrayErrors(data.error.details);
    const detailMessage = formatDetailsArrayMessage(data.error.details);
    return {
      status,
      code: data.error.code,
      message: detailMessage ?? message,
      fieldErrors,
      context: data.error.context,
    };
  }

  if (Array.isArray(data.detail)) {
    const fieldErrors: Record<string, string> = {};
    for (const item of data.detail) {
      const field = item.loc.filter((p) => typeof p === 'string' && p !== 'body').join('.') || 'form';
      fieldErrors[field] = item.msg;
    }
    const first = data.detail[0]?.msg;
    return {
      status,
      code: 'VALIDATION_ERROR',
      message: first ? sanitizeDetailMessage(status, first) : DEFAULT_MESSAGES[422],
      fieldErrors,
    };
  }

  if (typeof data.detail === 'string') {
    return { status, message: sanitizeDetailMessage(status, data.detail) };
  }

  return {
    status,
    message: defaultMessage(status),
  };
}

export function parseErrorResponse(
  status: number,
  text: string,
  contentType?: string | null,
): ParsedApiError {
  const trimmed = text.trim();
  if (!trimmed) {
    return { status, message: defaultMessage(status) };
  }

  const isJson =
    contentType?.includes('application/json') ||
    contentType?.includes('+json') ||
    trimmed.startsWith('{') ||
    trimmed.startsWith('[');

  if (!isJson) {
    return { status, message: messageForNonJsonBody(status, trimmed) };
  }

  try {
    return parseApiError(status, JSON.parse(trimmed));
  } catch {
    return { status, message: messageForNonJsonBody(status, trimmed) };
  }
}

function extractFieldErrors(ctx?: Record<string, unknown>): Record<string, string> | undefined {
  if (!ctx) return undefined;
  const field = typeof ctx.field === 'string' ? ctx.field : undefined;
  const reason =
    typeof ctx.reason === 'string'
      ? ctx.reason
      : typeof ctx.details === 'string'
        ? ctx.details
        : undefined;
  if (field && reason) {
    return { [field]: reason };
  }
  return undefined;
}

function extractDetailsArrayErrors(details: unknown): Record<string, string> | undefined {
  if (!Array.isArray(details)) return undefined;

  const fieldErrors: Record<string, string> = {};
  for (const item of details) {
    if (!item || typeof item !== 'object') continue;
    const field = 'field' in item && typeof item.field === 'string' ? item.field : undefined;
    const message = 'message' in item && typeof item.message === 'string' ? item.message : undefined;
    if (field && message) {
      fieldErrors[field] = message;
    }
  }

  return Object.keys(fieldErrors).length ? fieldErrors : undefined;
}

function formatDetailsArrayMessage(details: unknown): string | undefined {
  if (!Array.isArray(details)) return undefined;

  const messages = details
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      return 'message' in item && typeof item.message === 'string' ? item.message : null;
    })
    .filter((item): item is string => Boolean(item));

  return messages.length ? messages.join('. ') : undefined;
}

export function networkError(): ParsedApiError {
  return {
    status: 0,
    code: 'NETWORK_ERROR',
    message: 'Нет связи с сервером. Проверьте интернет и адрес API.',
    isNetworkError: true,
  };
}

export function getErrorMessage(err: unknown, fallback = 'Что-то пошло не так'): string {
  if (err && typeof err === 'object' && 'parsed' in err) {
    const parsed = (err as { parsed?: ParsedApiError }).parsed;
    if (parsed?.message) return parsed.message;
  }

  if (err instanceof Error) {
    const message = err.message.trim();
    if (message && !looksLikeHtml(message)) return message;
  }

  return fallback;
}

export function mapFieldError(fieldErrors: Record<string, string> | undefined, field: string): string | undefined {
  if (!fieldErrors) return undefined;
  return (
    fieldErrors[field] ??
    fieldErrors[`body.${field}`] ??
    fieldErrors[`body.${field.replace('_', '-')}`]
  );
}
