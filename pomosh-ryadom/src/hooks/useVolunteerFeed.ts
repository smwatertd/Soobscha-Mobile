import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isSessionExpiredError } from '../services/authSession';
import { reloadWatchedHelpRequests } from '../services/helpRequestWatch';
import {
  clearVolunteerFeedSession,
  ensureVolunteerFeedLoaded,
  getCachedVolunteerFeed,
  loadMoreVolunteerFeed,
  revalidateVolunteerFeedInBackground,
  VolunteerFeedSessionEntry,
} from '../services/volunteerFeedSession';
import { getHelpRequestCategoryLabelMap } from '../services/labelCatalog';
import {
  VOLUNTEER_FEED_TABS,
  VolunteerFeedItem,
  VolunteerFeedTabId,
} from '../screens/volunteer/volunteerFeedTypes';
import {
  DEFAULT_VOLUNTEER_FEED_FILTERS,
  VolunteerFeedFilters,
} from '../types/volunteerFeedFilters';
import { VolunteerFeedCounts } from '../utils/volunteerFeedCounts';

const EMPTY_COUNTS: VolunteerFeedCounts = { all: 0, social: 0, material: 0 };

function applySessionToState(
  session: VolunteerFeedSessionEntry,
  setItems: (items: VolunteerFeedItem[]) => void,
  setCounts: (counts: VolunteerFeedCounts) => void,
  setHasMore: (hasMore: boolean) => void,
): void {
  setItems(session.items);
  setCounts(session.counts);
  setHasMore(session.hasMore);
}

function deferSetState(apply: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(apply);
  });
}

export function useVolunteerFeed(
  feedFilters: VolunteerFeedFilters = DEFAULT_VOLUNTEER_FEED_FILTERS,
  onSessionExpired?: () => void,
) {
  const initialTab: VolunteerFeedTabId = 'all';
  const initialSession = getCachedVolunteerFeed(initialTab);

  const [tab, setTab] = useState<VolunteerFeedTabId>(initialTab);
  const [items, setItems] = useState<VolunteerFeedItem[]>(initialSession?.items ?? []);
  const [counts, setCounts] = useState<VolunteerFeedCounts>(initialSession?.counts ?? EMPTY_COUNTS);
  const [hasMore, setHasMore] = useState(initialSession?.hasMore ?? false);
  const [loading, setLoading] = useState(!initialSession);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(Boolean(initialSession));
  const [error, setError] = useState<string | null>(null);
  const [categoryLabels, setCategoryLabels] = useState<Map<string, string>>(() =>
    getHelpRequestCategoryLabelMap(),
  );

  const feedFiltersRef = useRef(feedFilters);
  feedFiltersRef.current = feedFilters;
  const onSessionExpiredRef = useRef(onSessionExpired);
  onSessionExpiredRef.current = onSessionExpired;
  const refreshInFlightRef = useRef<Promise<void> | null>(null);
  const initialLoadTabRef = useRef<VolunteerFeedTabId | null>(null);
  const hasLoadedOnceRef = useRef(hasLoadedOnce);
  hasLoadedOnceRef.current = hasLoadedOnce;

  const applyEntry = useCallback(
    (entry: VolunteerFeedSessionEntry, immediate = false) => {
      const apply = () => {
        setCategoryLabels(getHelpRequestCategoryLabelMap());
        setItems(entry.items);
        setCounts(entry.counts);
        setHasMore(entry.hasMore);
        setHasLoadedOnce(true);
      };
      if (immediate) {
        apply();
        return;
      }
      deferSetState(apply);
    },
    [],
  );

  const load = useCallback(
    async (activeTab: VolunteerFeedTabId, mode: 'initial' | 'refresh' = 'initial') => {
      const force = mode === 'refresh';

      if (!force) {
        const cached = getCachedVolunteerFeed(activeTab);
        if (cached) {
          applySessionToState(cached, setItems, setCounts, setHasMore);
          setLoading(false);
          setRefreshing(false);
          setError(null);
          setHasLoadedOnce(true);
          return;
        }
      }

      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        if (force) {
          await reloadWatchedHelpRequests();
        }
        const entry = await ensureVolunteerFeedLoaded(activeTab, {
          force,
          filters: feedFiltersRef.current,
        });
        if (entry) {
          applyEntry(entry, force);
        }
      } catch (err) {
        if (isSessionExpiredError(err)) {
          clearVolunteerFeedSession();
          onSessionExpiredRef.current?.();
          return;
        }
        setError(err instanceof Error ? err.message : 'Не удалось загрузить заявки');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [applyEntry],
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || refreshing || !hasMore) return;

    setLoadingMore(true);
    setError(null);

    try {
      const entry = await loadMoreVolunteerFeed(tab, feedFiltersRef.current);
      if (entry) {
        applyEntry(entry, true);
      }
    } catch (err) {
      if (isSessionExpiredError(err)) {
        clearVolunteerFeedSession();
        onSessionExpiredRef.current?.();
        return;
      }
      setError(err instanceof Error ? err.message : 'Не удалось загрузить ещё заявки');
    } finally {
      setLoadingMore(false);
    }
  }, [applyEntry, hasMore, loading, loadingMore, refreshing, tab]);

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (initialLoadTabRef.current === tab) return;
    initialLoadTabRef.current = tab;

    const cached = getCachedVolunteerFeed(tab);
    if (cached) {
      applySessionToState(cached, setItems, setCounts, setHasMore);
      setLoading(false);
      setHasLoadedOnce(true);
      return;
    }

    setItems([]);
    setCounts(EMPTY_COUNTS);
    setHasMore(false);
    setLoading(true);
    setError(null);
    void loadRef.current(tab, 'initial');
  }, [tab]);

  const refresh = useCallback(() => {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current;
    }

    setLoadingMore(false);

    const run = (async () => {
      setRefreshing(true);
      setError(null);

      try {
        await reloadWatchedHelpRequests();
        const entry = await ensureVolunteerFeedLoaded(tab, {
          force: true,
          filters: feedFiltersRef.current,
        });
        if (entry) {
          applyEntry(entry, true);
        }
      } catch (err) {
        if (isSessionExpiredError(err)) {
          clearVolunteerFeedSession();
          onSessionExpiredRef.current?.();
          return;
        }
        setError(err instanceof Error ? err.message : 'Не удалось обновить заявки');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    })().finally(() => {
      if (refreshInFlightRef.current === run) {
        refreshInFlightRef.current = null;
      }
    });

    refreshInFlightRef.current = run;
    return run;
  }, [applyEntry, tab]);

  const revalidateOnFocus = useCallback(async () => {
    if (!hasLoadedOnceRef.current) return;

    try {
      await reloadWatchedHelpRequests();
      const entry = await revalidateVolunteerFeedInBackground(tab, feedFiltersRef.current);
      if (entry) {
        applyEntry(entry, true);
      }
    } catch (err) {
      if (isSessionExpiredError(err)) {
        clearVolunteerFeedSession();
        onSessionExpiredRef.current?.();
      }
    }
  }, [applyEntry, tab]);

  const revalidateOnFocusRef = useRef(revalidateOnFocus);
  revalidateOnFocusRef.current = revalidateOnFocus;

  useFocusEffect(
    useCallback(() => {
      void revalidateOnFocusRef.current();
    }, []),
  );

  const tabs = VOLUNTEER_FEED_TABS.map((item) => ({
    ...item,
    count: counts[item.id],
  }));

  return {
    tab,
    setTab,
    items,
    tabs,
    counts,
    categoryLabels,
    loading,
    loadingMore,
    hasMore,
    refreshing,
    hasLoadedOnce,
    error,
    loadMore,
    reload: refresh,
  };
}
