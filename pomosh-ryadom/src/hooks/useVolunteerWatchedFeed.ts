import { useCallback, useEffect, useRef, useState } from 'react';
import { getMyWatchedHelpRequests } from '../api/volunteers';
import { getErrorMessage } from '../api/errors';
import { VolunteerFeedItem } from '../screens/volunteer/volunteerFeedTypes';
import { getHelpRequestCategoryLabelMap } from '../services/labelCatalog';
import { reloadWatchedHelpRequests } from '../services/helpRequestWatch';
import { applyCategoryLabelsToFeedItems } from '../utils/helpRequestCategoryLabels';
import { mapHelpRequestToVolunteerFeedItem } from '../utils/volunteerFeedMapper';

const PAGE_SIZE = 20;

export function useVolunteerWatchedFeed() {
  const [items, setItems] = useState<VolunteerFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);

  const mapPage = useCallback(async (pageNum: number, append: boolean) => {
    const response = await getMyWatchedHelpRequests({
      page: pageNum,
      pageSize: PAGE_SIZE,
      orderDesc: true,
    });
    const labels = getHelpRequestCategoryLabelMap();
    const mapped = response.items.map((item) => mapHelpRequestToVolunteerFeedItem(item));
    const withLabels = await applyCategoryLabelsToFeedItems(mapped, labels);

    setItems((prev) => (append ? [...prev, ...withLabels] : withLabels));
    setHasMore(response.has_more);
    pageRef.current = pageNum;
  }, []);

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'more') => {
    if (mode === 'initial') setLoading(true);
    else if (mode === 'refresh') setRefreshing(true);
    else setLoadingMore(true);

    setError(null);
    try {
      if (mode === 'more') {
        await mapPage(pageRef.current + 1, true);
      } else {
        await reloadWatchedHelpRequests();
        await mapPage(1, false);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      if (mode !== 'more') setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [mapPage]);

  useEffect(() => {
    void load('initial');
  }, [load]);

  return {
    items,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    reload: () => load('refresh'),
    loadMore: () => {
      if (!loadingMore && hasMore) void load('more');
    },
  };
}
