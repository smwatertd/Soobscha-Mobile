import { unwatchHelpRequest, watchHelpRequest } from '../api/helpRequests';
import { getMyWatchedHelpRequests } from '../api/volunteers';
import { logger } from './logger';

const listeners = new Set<() => void>();
let watchedIds = new Set<string>();
let loadPromise: Promise<void> | null = null;

function notifyWatchListeners(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeHelpRequestWatch(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isHelpRequestWatched(helpRequestId: string): boolean {
  return watchedIds.has(helpRequestId);
}

export function getWatchedHelpRequestsCount(): number {
  return watchedIds.size;
}

export function syncHelpRequestWatchFromApi(
  helpRequestId: string,
  isWatched: boolean,
): void {
  if (isWatched) {
    watchedIds.add(helpRequestId);
  } else {
    watchedIds.delete(helpRequestId);
  }
}

async function loadWatchedIdsFromApi(): Promise<void> {
  const ids = new Set<string>();
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 10) {
    const response = await getMyWatchedHelpRequests({
      page,
      pageSize: 50,
      orderDesc: true,
    });
    for (const item of response.items) {
      if (typeof item.id === 'string' && item.id) {
        ids.add(item.id);
      }
    }
    hasMore = response.has_more;
    page += 1;
  }

  watchedIds = ids;
}

/** Загружает список избранных ID один раз за сессию. */
export async function ensureWatchedHelpRequestsLoaded(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = loadWatchedIdsFromApi()
    .then(() => {
      logger.api.debug('watched help requests loaded', { count: watchedIds.size });
      notifyWatchListeners();
    })
    .catch((err) => {
      loadPromise = null;
      throw err;
    });

  return loadPromise;
}

export async function reloadWatchedHelpRequests(): Promise<void> {
  loadPromise = null;
  await ensureWatchedHelpRequestsLoaded();
}

export async function setHelpRequestWatched(
  helpRequestId: string,
  nextWatched: boolean,
): Promise<void> {
  const wasWatched = watchedIds.has(helpRequestId);

  if (nextWatched) {
    watchedIds.add(helpRequestId);
  } else {
    watchedIds.delete(helpRequestId);
  }
  notifyWatchListeners();

  try {
    if (nextWatched) {
      await watchHelpRequest(helpRequestId);
    } else {
      await unwatchHelpRequest(helpRequestId);
    }
  } catch (err) {
    if (wasWatched) {
      watchedIds.add(helpRequestId);
    } else {
      watchedIds.delete(helpRequestId);
    }
    notifyWatchListeners();
    throw err;
  }
}

export function resolveHelpRequestWatchedState(
  helpRequestId: string,
  fromApi?: boolean,
): boolean {
  if (watchedIds.has(helpRequestId)) return true;
  return fromApi === true;
}

export function resetHelpRequestWatchSession(): void {
  watchedIds = new Set();
  loadPromise = null;
  notifyWatchListeners();
}
