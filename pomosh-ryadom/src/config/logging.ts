export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export type LogNamespace = 'app' | 'api' | 'nav' | 'push' | 'media' | 'perf' | 'auth';

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

export function getLogLevel(): LogLevel {
  const raw = process.env.EXPO_PUBLIC_LOG_LEVEL;
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error' || raw === 'silent') {
    return raw;
  }
  return __DEV__ ? 'debug' : 'warn';
}

export function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[getLogLevel()];
}

export function isLogPersistenceEnabled(): boolean {
  if (process.env.EXPO_PUBLIC_LOG_TO_FILE === '0') return false;
  if (process.env.EXPO_PUBLIC_LOG_TO_FILE === '1') return true;
  return __DEV__;
}

export function isDevLogScreenEnabled(): boolean {
  return __DEV__ || process.env.EXPO_PUBLIC_DEV_LOGS === '1';
}
