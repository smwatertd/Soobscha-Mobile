import * as FileSystem from 'expo-file-system/legacy';
import { isLogPersistenceEnabled } from '../config/logging';

export type StoredLogEntry = {
  id: string;
  ts: string;
  level: string;
  ns: string;
  message: string;
  data?: unknown;
  durationMs?: number;
};

const MAX_ENTRIES = 400;
const LOG_FILE = `${FileSystem.documentDirectory ?? ''}soobscha.log`;
const FILE_FLUSH_MS = 120;

let entries: StoredLogEntry[] = [];
let writeChain: Promise<void> = Promise.resolve();
let seq = 0;
let pendingFileLines: string[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function appendLogEntry(entry: Omit<StoredLogEntry, 'id'>): StoredLogEntry {
  const stored: StoredLogEntry = {
    ...entry,
    id: `${Date.now()}-${++seq}`,
  };

  entries.push(stored);
  if (entries.length > MAX_ENTRIES) {
    entries = entries.slice(-MAX_ENTRIES);
  }

  if (isLogPersistenceEnabled() && LOG_FILE) {
    pendingFileLines.push(formatLine(stored));
    scheduleFileFlush();
  }

  return stored;
}

function scheduleFileFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    const batch = pendingFileLines.splice(0);
    if (batch.length === 0) return;
    const payload = `${batch.join('\n')}\n`;
    writeChain = writeChain.then(() =>
      FileSystem.writeAsStringAsync(LOG_FILE, payload, { append: true }),
    );
  }, FILE_FLUSH_MS);
}

export function getRecentLogs(limit = 200): StoredLogEntry[] {
  return entries.slice(-limit);
}

export function clearLogs(): void {
  entries = [];
  pendingFileLines = [];
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (isLogPersistenceEnabled() && LOG_FILE) {
    writeChain = writeChain.then(() => FileSystem.deleteAsync(LOG_FILE, { idempotent: true }));
  }
}

export async function readLogFile(): Promise<string | null> {
  if (!LOG_FILE) return null;
  try {
    const info = await FileSystem.getInfoAsync(LOG_FILE);
    if (!info.exists) return null;
    return FileSystem.readAsStringAsync(LOG_FILE);
  } catch {
    return null;
  }
}

export function getLogFilePath(): string | null {
  return isLogPersistenceEnabled() ? LOG_FILE : null;
}

export function exportLogsAsText(limit = 200): string {
  const recent = getRecentLogs(limit);
  if (recent.length === 0) return 'Логов пока нет.';
  return recent.map(formatLine).join('\n');
}

function formatLine(entry: StoredLogEntry): string {
  const duration = entry.durationMs != null ? ` +${entry.durationMs}ms` : '';
  const data = entry.data !== undefined ? ` ${safeStringify(entry.data)}` : '';
  return `[${entry.ts}] ${entry.level.toUpperCase()} ${entry.ns}: ${entry.message}${duration}${data}`;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(redactSensitive(value));
  } catch {
    return String(value);
  }
}

function redactSensitive(value: unknown): unknown {
  if (value == null || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map(redactSensitive);
  }

  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(obj)) {
    const lower = key.toLowerCase();
    if (
      lower.includes('token') ||
      lower.includes('password') ||
      lower.includes('authorization') ||
      lower === 'fcm_token'
    ) {
      out[key] = '[redacted]';
    } else {
      out[key] = redactSensitive(val);
    }
  }

  return out;
}
