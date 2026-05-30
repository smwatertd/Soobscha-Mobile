/** Флаг «в избранном» из ответа API заявки. */
export function readHelpRequestIsWatched(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const record = raw as Record<string, unknown>;
  return record.is_watched === true || record.isWatched === true;
}
