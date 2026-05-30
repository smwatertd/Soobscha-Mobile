import { getApiBaseUrl } from '../config/api';
import { logger } from '../services/logger';
import { parseErrorResponse } from './errors';
import { ParsedApiError } from './types';
import { RefreshTokensRequest, TokensResponse } from './types';

export class RefreshTokenError extends Error {
  readonly parsed: ParsedApiError;

  constructor(parsed: ParsedApiError) {
    super(parsed.message);
    this.name = 'RefreshTokenError';
    this.parsed = parsed;
  }
}

export async function refreshTokens(refreshToken: string): Promise<TokensResponse> {
  const url = `${getApiBaseUrl()}/api/auth/refresh`;
  const body: RefreshTokensRequest = { refresh_token: refreshToken };

  logger.api.debug('request', { method: 'POST', path: '/api/auth/refresh', auth: false, hasBody: true });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const contentType = response.headers.get('content-type');

  if (!response.ok) {
    const parsed = parseErrorResponse(response.status, text, contentType);
    logger.api.warn('response error', {
      method: 'POST',
      path: '/api/auth/refresh',
      status: response.status,
      code: parsed.code,
      message: parsed.message,
    });
    throw new RefreshTokenError(parsed);
  }

  try {
    return JSON.parse(text) as TokensResponse;
  } catch {
    throw new Error('Сервер вернул неожиданный ответ');
  }
}
