import { getApiBaseUrl } from '../config/api';
import { clearSession } from '../services/authStorage';
import { getValidAccessToken, refreshSessionTokens } from '../services/sessionTokens';
import { logger } from '../services/logger';
import { networkError, parseErrorResponse } from './errors';
import { ParsedApiError } from './types';

export class ApiClientError extends Error {
  readonly parsed: ParsedApiError;

  constructor(parsed: ParsedApiError) {
    super(parsed.message);
    this.name = 'ApiClientError';
    this.parsed = parsed;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  auth?: boolean;
  timeoutMs?: number;
  skipAuthRefresh?: boolean;
  _retried?: boolean;
};

function elapsedMs(startedAt: number): number {
  return Date.now() - startedAt;
}

/** Параллельные apiRequest — fetchWait может расти из‑за очереди на JS-потоке. */
let apiInFlight = 0;

export function getApiInFlightCount(): number {
  return apiInFlight;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    token,
    auth = false,
    timeoutMs = 20000,
    skipAuthRefresh = false,
    _retried = false,
  } = options;
  const url = `${getApiBaseUrl()}${path}`;
  const startedAt = Date.now();
  const endTimer = logger.api.time(`${method} ${path}`);
  apiInFlight += 1;
  const inFlightAtStart = apiInFlight;

  try {
    const resolveBearer = async () => token ?? (auth ? await getValidAccessToken() : null);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const authStartedAt = Date.now();
    const bearer = await resolveBearer();
    const authMs = elapsedMs(authStartedAt);

    if (auth && !bearer) {
      endTimer({ ok: false, auth: true, authMs, inFlightAtStart });
      throw new ApiClientError({
        status: 401,
        code: 'SESSION_EXPIRED',
        message: 'Сессия истекла. Войдите снова.',
      });
    }
    if (bearer) {
      headers.Authorization = `Bearer ${bearer}`;
    }

    logger.api.debug('request', { method, path, auth: Boolean(bearer), hasBody: body !== undefined });

    try {
      const fetchStartedAt = Date.now();
      const response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const fetchWaitMs = elapsedMs(fetchStartedAt);

      clearTimeout(timer);

      const readStartedAt = Date.now();
      const text = await response.text();
      const readMs = elapsedMs(readStartedAt);
      const contentType = response.headers.get('content-type');

      if (response.status === 401 && auth && !skipAuthRefresh && !_retried) {
        const newToken = await refreshSessionTokens();
        if (newToken) {
          return apiRequest<T>(path, {
            ...options,
            token: newToken,
            _retried: true,
          });
        }
        await clearSession();
        endTimer({ status: 401, ok: false, sessionExpired: true, authMs, fetchWaitMs, readMs, inFlightAtStart });
        throw new ApiClientError({
          status: 401,
          code: 'SESSION_EXPIRED',
          message: 'Сессия истекла. Войдите снова.',
        });
      }

      if (!response.ok) {
        const parsed = parseErrorResponse(response.status, text, contentType);
        logger.api.warn('response error', {
          method,
          path,
          status: response.status,
          code: parsed.code,
          message: parsed.message,
        });
        endTimer({ status: response.status, ok: false, authMs, fetchWaitMs, readMs, inFlightAtStart });
        throw new ApiClientError(parsed);
      }

      const parseStartedAt = Date.now();
      let json: unknown = null;
      if (text) {
        try {
          json = JSON.parse(text);
        } catch {
          logger.api.warn('invalid json in success response', { method, path, status: response.status });
          endTimer({ status: response.status, ok: false, authMs, fetchWaitMs, readMs, inFlightAtStart });
          throw new ApiClientError({
            status: response.status,
            code: 'INVALID_RESPONSE',
            message: 'Сервер вернул неожиданный ответ',
          });
        }
      }
      const parseMs = elapsedMs(parseStartedAt);
      const totalMs = elapsedMs(startedAt);

    const processingMs = Math.max(0, totalMs - authMs - fetchWaitMs - readMs - parseMs);
    endTimer({
      status: response.status,
      ok: true,
      authMs,
      fetchWaitMs,
      readMs,
      parseMs,
      processingMs,
      bodyBytes: text.length,
      totalMs,
      inFlightAtStart,
      ...(fetchWaitMs > 200 && inFlightAtStart <= 1
        ? { hint: 'fetchWait высокий при одном запросе — часто JS-поток занят (рендер/другие ответы)' }
        : {}),
    });
      return json as T;
    } catch (err) {
      clearTimeout(timer);

      if (err instanceof ApiClientError) {
        throw err;
      }

      if (err instanceof Error && err.name === 'AbortError') {
        logger.api.warn('timeout', { method, path, timeoutMs });
        endTimer({ ok: false, timeout: true, totalMs: elapsedMs(startedAt), inFlightAtStart });
        throw new ApiClientError({
          status: 0,
          code: 'TIMEOUT',
          message: 'Сервер не ответил вовремя. Попробуйте ещё раз.',
          isNetworkError: true,
        });
      }

      logger.api.error('network failure', {
        method,
        path,
        message: err instanceof Error ? err.message : String(err),
      });
      endTimer({ ok: false, network: true, totalMs: elapsedMs(startedAt), inFlightAtStart });
      throw new ApiClientError(networkError());
    }
  } finally {
    apiInFlight = Math.max(0, apiInFlight - 1);
  }
}
