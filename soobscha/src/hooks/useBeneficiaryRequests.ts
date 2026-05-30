import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getMyHelpRequests } from '../api/beneficiaries';
import { getHelpRequestById, HelpRequestSummary } from '../api/helpRequests';
import { SocialHelpRequestSummary } from '../api/integrationTypes';
import { BenRequestCardData } from '../components/beneficiary/BenRequestCard';
import { isSessionExpiredError } from '../services/authSession';
import {
  mapHelpRequestToBenRequestCard,
  needsSocialVolunteerDetail,
} from '../utils/benRequestCardMapper';
import { fallbackBenRequestReason, loadBenRequestReasons } from '../utils/benRequestCardReason';
import {
  applyBeneficiaryRequestFilters,
  BeneficiaryRequestsFilters,
  DEFAULT_BENEFICIARY_REQUESTS_FILTERS,
  typeFilterToApi,
} from '../utils/beneficiaryRequestsFilters';
import {
  BeneficiaryRequestsTab,
  statusesForBeneficiaryRequestsTab,
} from '../utils/helpRequestStatus';

export type BeneficiaryRequestsCounts = {
  active: number;
  done: number;
  archive: number;
};

export type {
  BeneficiaryRequestsFilters,
  BeneficiaryRequestsSortOrder,
  BeneficiaryRequestsTypeFilter,
} from '../utils/beneficiaryRequestsFilters';

export { hasActiveBeneficiaryRequestFilters } from '../utils/beneficiaryRequestsFilters';

async function loadSocialDetails(
  items: HelpRequestSummary[],
): Promise<Map<string, SocialHelpRequestSummary>> {
  const map = new Map<string, SocialHelpRequestSummary>();
  const targets = items.filter(
    (item) =>
      item.type === 'SOCIAL' &&
      typeof item.id === 'string' &&
      typeof item.status === 'string' &&
      needsSocialVolunteerDetail(item.status),
  );

  await Promise.all(
    targets.map(async (item) => {
      if (typeof item.id !== 'string') return;
      try {
        const detail = await getHelpRequestById(item.id);
        map.set(item.id, detail);
      } catch {
        // progress block is optional
      }
    }),
  );

  return map;
}

async function fetchTabCount(statuses: readonly string[]): Promise<number> {
  const response = await getMyHelpRequests({
    page: 1,
    pageSize: 1,
    orderDesc: true,
    statuses: [...statuses],
  });
  return response.total_count;
}

export function useBeneficiaryRequests(onSessionExpired?: () => void) {
  const [filter, setFilter] = useState<BeneficiaryRequestsTab>('active');
  const [filters, setFilters] = useState<BeneficiaryRequestsFilters>(
    DEFAULT_BENEFICIARY_REQUESTS_FILTERS,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<BenRequestCardData[]>([]);
  const [counts, setCounts] = useState<BeneficiaryRequestsCounts>({
    active: 0,
    done: 0,
    archive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTab = useCallback(async (tab: BeneficiaryRequestsTab, requestFilters: BeneficiaryRequestsFilters) => {
    const statuses = statusesForBeneficiaryRequestsTab(tab);
    const response = await getMyHelpRequests({
      page: 1,
      pageSize: 20,
      orderDesc: requestFilters.sortOrder === 'new',
      type: typeFilterToApi(requestFilters.typeFilter),
      statuses: [...statuses],
    });

    const [details, reasons] = await Promise.all([
      loadSocialDetails(response.items),
      loadBenRequestReasons(response.items),
    ]);
    const cards = response.items.map((item) => {
      const id = typeof item.id === 'string' ? item.id : '';
      const apiStatus = String((item as Record<string, unknown>).status ?? '');
      const createdAt =
        typeof (item as Record<string, unknown>).created_at === 'string'
          ? (item as Record<string, unknown>).created_at
          : undefined;
      const reason =
        (id ? reasons.get(id) : undefined) ?? fallbackBenRequestReason(apiStatus, createdAt as string | undefined);
      return mapHelpRequestToBenRequestCard(item, details.get(id), reason);
    });

    return cards;
  }, []);

  const loadCounts = useCallback(async () => {
    const [active, done, archive] = await Promise.all([
      fetchTabCount(statusesForBeneficiaryRequestsTab('active')),
      fetchTabCount(statusesForBeneficiaryRequestsTab('done')),
      fetchTabCount(statusesForBeneficiaryRequestsTab('archive')),
    ]);
    setCounts({ active, done, archive });
  }, []);

  const load = useCallback(
    async (
      tab: BeneficiaryRequestsTab,
      requestFilters: BeneficiaryRequestsFilters,
      mode: 'initial' | 'refresh' = 'initial',
    ) => {
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const [cards] = await Promise.all([loadTab(tab, requestFilters), loadCounts()]);
        setItems(cards);
      } catch (err) {
        if (isSessionExpiredError(err)) {
          onSessionExpired?.();
          return;
        }
        setError(err instanceof Error ? err.message : 'Не удалось загрузить заявки');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadCounts, loadTab, onSessionExpired],
  );

  const changeFilter = useCallback((tab: BeneficiaryRequestsTab) => {
    setFilter(tab);
  }, []);

  const applyFilters = useCallback((next: BeneficiaryRequestsFilters) => {
    setFilters(next);
  }, []);

  const visibleItems = useMemo(
    () => applyBeneficiaryRequestFilters(items, filters, searchQuery),
    [filters, items, searchQuery],
  );

  const refresh = useCallback(() => load(filter, filters, 'refresh'), [filter, filters, load]);

  useFocusEffect(
    useCallback(() => {
      load(filter, filters, 'initial');
    }, [filter, filters, load]),
  );

  return {
    filter,
    setFilter: changeFilter,
    filters,
    applyFilters,
    searchQuery,
    setSearchQuery,
    items: visibleItems,
    sourceItems: items,
    totalItems: items.length,
    counts,
    loading,
    refreshing,
    error,
    refresh,
  };
};
