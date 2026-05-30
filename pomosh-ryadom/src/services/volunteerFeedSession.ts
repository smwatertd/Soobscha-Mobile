import { getHelpRequests, HelpRequestSummary } from '../api/helpRequests';
import { PaginatedResponse } from '../api/integrationTypes';
import { VolunteerFeedItem, VolunteerFeedTabId } from '../screens/volunteer/volunteerFeedTypes';
import {
  DEFAULT_VOLUNTEER_FEED_FILTERS,
  VolunteerFeedFilters,
} from '../types/volunteerFeedFilters';
import { applyCategoryLabelsToFeedItems } from '../utils/helpRequestCategoryLabels';
import { getHelpRequestCategoryLabelMap } from '../services/labelCatalog';
import { VolunteerFeedCounts } from '../utils/volunteerFeedCounts';
import { mapHelpRequestToVolunteerFeedItem } from '../utils/volunteerFeedMapper';
import { buildVolunteerHelpRequestsListParams, serializeVolunteerFeedFiltersKey } from '../utils/volunteerHelpRequestListParams';
import { filterVisitorVisibleHelpRequests } from '../utils/visitorBeneficiaryHelpRequests';

/** Для проверки пагинации; в проде можно поднять до 20. */
export const VOLUNTEER_FEED_PAGE_SIZE = 5;

export type VolunteerFeedSessionEntry = {
  items: VolunteerFeedItem[];
  counts: VolunteerFeedCounts;
  page: number;
  hasMore: boolean;
};

const EMPTY_COUNTS: VolunteerFeedCounts = { all: 0, social: 0, material: 0 };

let globalFeedCounts: VolunteerFeedCounts = EMPTY_COUNTS;
let tabTotalsInflight: Promise<VolunteerFeedCounts> | null = null;

const cache = new Map<VolunteerFeedTabId, VolunteerFeedSessionEntry>();
const inflight = new Map<VolunteerFeedTabId, Promise<VolunteerFeedSessionEntry | null>>();
const loadMoreInflight = new Map<VolunteerFeedTabId, Promise<VolunteerFeedSessionEntry | null>>();
const revalidateInflight = new Map<VolunteerFeedTabId, Promise<VolunteerFeedSessionEntry | null>>();

let feedGeneration = 0;
let activeFiltersKey = serializeVolunteerFeedFiltersKey(DEFAULT_VOLUNTEER_FEED_FILTERS);
let activeFilters: VolunteerFeedFilters = DEFAULT_VOLUNTEER_FEED_FILTERS;

function syncFiltersContext(filters: VolunteerFeedFilters): void {
  const key = serializeVolunteerFeedFiltersKey(filters);
  if (key === activeFiltersKey) return;
  activeFiltersKey = key;
  activeFilters = filters;
  invalidateAllFeedCaches();
}

function bumpFeedGeneration(): number {
  feedGeneration += 1;
  return feedGeneration;
}

function isStaleGeneration(generation: number): boolean {
  return generation !== feedGeneration;
}

function invalidateAllFeedCaches(): void {
  bumpFeedGeneration();
  cache.clear();
  inflight.clear();
  loadMoreInflight.clear();
  tabTotalsInflight = null;
}

function attachGlobalCounts(entry: VolunteerFeedSessionEntry): VolunteerFeedSessionEntry {
  return { ...entry, counts: globalFeedCounts };
}

const FEED_TAB_TOTALS: VolunteerFeedTabId[] = ['all', 'social', 'material'];

async function fetchVolunteerFeedTabTotals(
  filters: VolunteerFeedFilters,
): Promise<VolunteerFeedCounts> {
  const responses = await Promise.all(
    FEED_TAB_TOTALS.map((tab) =>
      getHelpRequests(
        buildVolunteerHelpRequestsListParams(tab, filters, { page: 1, pageSize: 1 }),
      ),
    ),
  );

  return {
    all: responses[0].total_count,
    social: responses[1].total_count,
    material: responses[2].total_count,
  };
}

async function refreshVolunteerFeedTabTotals(
  filters: VolunteerFeedFilters,
): Promise<VolunteerFeedCounts> {
  if (tabTotalsInflight) return tabTotalsInflight;

  const promise = fetchVolunteerFeedTabTotals(filters).then((counts) => {
    globalFeedCounts = counts;
    return counts;
  });

  tabTotalsInflight = promise;
  try {
    return await promise;
  } finally {
    if (tabTotalsInflight === promise) {
      tabTotalsInflight = null;
    }
  }
}

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function fetchHelpRequestsPage(
  tab: VolunteerFeedTabId,
  page: number,
  filters: VolunteerFeedFilters = activeFilters,
): Promise<PaginatedResponse<HelpRequestSummary>> {
  const response = await getHelpRequests(
    buildVolunteerHelpRequestsListParams(tab, filters, {
      page,
      pageSize: VOLUNTEER_FEED_PAGE_SIZE,
    }),
  );

  return {
    ...response,
    items: filterVisitorVisibleHelpRequests(response.items),
  };
}

async function mapFeedItems(items: HelpRequestSummary[]): Promise<VolunteerFeedItem[]> {
  const labels = getHelpRequestCategoryLabelMap();
  const mapped: VolunteerFeedItem[] = [];

  for (let index = 0; index < items.length; index += 1) {
    mapped.push(mapHelpRequestToVolunteerFeedItem(items[index]));
    if (index > 0 && index % 8 === 0) {
      await yieldToEventLoop();
    }
  }

  return applyCategoryLabelsToFeedItems(mapped, labels);
}

async function buildEntryFromResponse(
  tab: VolunteerFeedTabId,
  response: PaginatedResponse<HelpRequestSummary>,
  existingItems: VolunteerFeedItem[] = [],
): Promise<VolunteerFeedSessionEntry> {
  await yieldToEventLoop();
  const mapped = await mapFeedItems(response.items);

  const existingIds = new Set(existingItems.map((item) => item.id));
  const appended = mapped.filter((item) => !existingIds.has(item.id));
  const items = existingItems.length ? [...existingItems, ...appended] : mapped;

  return attachGlobalCounts({
    items,
    counts: globalFeedCounts,
    page: response.page,
    hasMore: response.has_more,
  });
}

export function getCachedVolunteerFeed(tab: VolunteerFeedTabId): VolunteerFeedSessionEntry | null {
  const entry = cache.get(tab);
  return entry ? attachGlobalCounts(entry) : null;
}

/** Тихое обновление первой страницы без сброса подгруженных карточек и скролла. */
async function mergeFirstPageRevalidate(
  tab: VolunteerFeedTabId,
  response: PaginatedResponse<HelpRequestSummary>,
  current: VolunteerFeedSessionEntry,
): Promise<VolunteerFeedSessionEntry> {
  const page1 = await mapFeedItems(response.items);
  const page1Ids = new Set(page1.map((item) => item.id));
  const tail = current.items.filter((item) => !page1Ids.has(item.id));

  return attachGlobalCounts({
    items: [...page1, ...tail],
    counts: globalFeedCounts,
    page: current.page,
    hasMore: current.hasMore,
  });
}

export async function revalidateVolunteerFeedInBackground(
  tab: VolunteerFeedTabId,
  filters: VolunteerFeedFilters = activeFilters,
): Promise<VolunteerFeedSessionEntry | null> {
  syncFiltersContext(filters);
  const current = cache.get(tab);
  if (!current?.items.length) {
    return ensureVolunteerFeedLoaded(tab, { filters });
  }

  const pending = revalidateInflight.get(tab);
  if (pending) return pending;

  const generation = feedGeneration;
  const promise = Promise.all([
    fetchHelpRequestsPage(tab, 1, filters),
    refreshVolunteerFeedTabTotals(filters),
  ])
    .then(([response]) => mergeFirstPageRevalidate(tab, response, current))
    .then((entry) => {
      if (isStaleGeneration(generation)) {
        return getCachedVolunteerFeed(tab);
      }
      cache.set(tab, entry);
      return attachGlobalCounts(entry);
    });

  revalidateInflight.set(tab, promise);
  try {
    return await promise;
  } finally {
    if (revalidateInflight.get(tab) === promise) {
      revalidateInflight.delete(tab);
    }
  }
}

/** Первая страница (или полный сброс при refresh). */
export async function ensureVolunteerFeedLoaded(
  tab: VolunteerFeedTabId,
  options?: {
    force?: boolean;
    filters?: VolunteerFeedFilters;
  },
): Promise<VolunteerFeedSessionEntry | null> {
  const filters = options?.filters ?? DEFAULT_VOLUNTEER_FEED_FILTERS;
  syncFiltersContext(filters);

  if (options?.force) {
    bumpFeedGeneration();
    cache.delete(tab);
    inflight.delete(tab);
    loadMoreInflight.delete(tab);
  } else {
    const cached = cache.get(tab);
    if (cached) return cached;

    const pending = inflight.get(tab);
    if (pending) return pending;
  }

  const generation = feedGeneration;

  const promise = Promise.all([
    fetchHelpRequestsPage(tab, 1, filters),
    refreshVolunteerFeedTabTotals(filters),
  ])
    .then(([response]) => buildEntryFromResponse(tab, response))
    .then((entry) => {
      if (isStaleGeneration(generation)) {
        return getCachedVolunteerFeed(tab);
      }
      cache.set(tab, entry);
      return attachGlobalCounts(entry);
    });

  inflight.set(tab, promise);
  try {
    return await promise;
  } finally {
    if (inflight.get(tab) === promise) {
      inflight.delete(tab);
    }
  }
}

/** Следующая страница — дописывает items в кэш вкладки. */
export async function loadMoreVolunteerFeed(
  tab: VolunteerFeedTabId,
  filters: VolunteerFeedFilters = activeFilters,
): Promise<VolunteerFeedSessionEntry | null> {
  syncFiltersContext(filters);
  const current = cache.get(tab);
  if (!current?.hasMore) {
    return current ?? null;
  }

  const pending = loadMoreInflight.get(tab);
  if (pending) return pending;

  const generation = feedGeneration;
  const snapshotPage = current.page;
  const snapshotItems = current.items;
  const promise = fetchHelpRequestsPage(tab, snapshotPage + 1, filters)
    .then((response) => buildEntryFromResponse(tab, response, snapshotItems))
    .then((entry) => {
      if (isStaleGeneration(generation)) {
        return getCachedVolunteerFeed(tab);
      }
      cache.set(tab, entry);
      return attachGlobalCounts(entry);
    });

  loadMoreInflight.set(tab, promise);
  try {
    return await promise;
  } finally {
    if (loadMoreInflight.get(tab) === promise) {
      loadMoreInflight.delete(tab);
    }
  }
}

export function clearVolunteerFeedSession(): void {
  invalidateAllFeedCaches();
  globalFeedCounts = EMPTY_COUNTS;
}

export function resetVolunteerFeedSessionForTests(): void {
  clearVolunteerFeedSession();
  activeFiltersKey = serializeVolunteerFeedFiltersKey(DEFAULT_VOLUNTEER_FEED_FILTERS);
  activeFilters = DEFAULT_VOLUNTEER_FEED_FILTERS;
}
