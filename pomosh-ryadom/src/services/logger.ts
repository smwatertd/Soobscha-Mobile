import { LogLevel, LogNamespace, shouldLog } from '../config/logging';
import {
  StoredLogEntry,
  appendLogEntry,
  clearLogs,
  exportLogsAsText,
  getLogFilePath,
  getRecentLogs,
  readLogFile,
} from './logStore';

type LogPayload = Record<string, unknown> | undefined;

function nowIso(): string {
  return new Date().toISOString();
}

function write(level: LogLevel, ns: LogNamespace, message: string, data?: unknown, durationMs?: number) {
  if (!shouldLog(level)) return;

  const entry = appendLogEntry({
    ts: nowIso(),
    level,
    ns,
    message,
    data,
    durationMs,
  });

  printToConsole(entry);
}

function printToConsole(entry: StoredLogEntry) {
  const prefix = `[${entry.ns}] ${entry.message}`;
  const payload = entry.data !== undefined ? entry.data : undefined;
  const duration = entry.durationMs != null ? ` (${entry.durationMs}ms)` : '';

  switch (entry.level) {
    case 'debug':
      console.debug(prefix + duration, payload ?? '');
      break;
    case 'info':
      console.info(prefix + duration, payload ?? '');
      break;
    case 'warn':
      console.warn(prefix + duration, payload ?? '');
      break;
    case 'error':
      console.error(prefix + duration, payload ?? '');
      break;
    default:
      console.log(prefix + duration, payload ?? '');
  }
}

function createNamespace(ns: LogNamespace) {
  return {
    debug: (message: string, data?: LogPayload) => write('debug', ns, message, data),
    info: (message: string, data?: LogPayload) => write('info', ns, message, data),
    warn: (message: string, data?: LogPayload) => write('warn', ns, message, data),
    error: (message: string, data?: LogPayload) => write('error', ns, message, data),
    time: (label: string) => {
      const started = Date.now();
      return (data?: LogPayload) => {
        const durationMs = Date.now() - started;
        write('debug', ns, label, data, durationMs);
        return durationMs;
      };
    },
  };
}

export const logger = {
  debug: (ns: LogNamespace, message: string, data?: LogPayload) => write('debug', ns, message, data),
  info: (ns: LogNamespace, message: string, data?: LogPayload) => write('info', ns, message, data),
  warn: (ns: LogNamespace, message: string, data?: LogPayload) => write('warn', ns, message, data),
  error: (ns: LogNamespace, message: string, data?: LogPayload) => write('error', ns, message, data),

  app: createNamespace('app'),
  api: createNamespace('api'),
  nav: createNamespace('nav'),
  push: createNamespace('push'),
  media: createNamespace('media'),
  perf: createNamespace('perf'),
  auth: createNamespace('auth'),

  getRecent: getRecentLogs,
  exportText: exportLogsAsText,
  clear: clearLogs,
  getFilePath: getLogFilePath,
  readFile: readLogFile,
};

export function installGlobalErrorLogging() {
  logger.app.info('Global error logging enabled');

  const errorUtils = (globalThis as typeof globalThis & {
    ErrorUtils?: {
      getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void;
      setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
    };
  }).ErrorUtils;

  if (!errorUtils?.setGlobalHandler) {
    logger.app.warn('ErrorUtils unavailable — only console logging active');
    return;
  }

  const defaultHandler = errorUtils.getGlobalHandler?.();

  errorUtils.setGlobalHandler((error, isFatal) => {
    logger.app.error(isFatal ? 'Fatal JS error' : 'Unhandled JS error', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      isFatal,
    });
    defaultHandler?.(error, isFatal);
  });
}
