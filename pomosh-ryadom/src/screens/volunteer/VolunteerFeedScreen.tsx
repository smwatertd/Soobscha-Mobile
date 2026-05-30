import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { VolunteerFeedItem } from './volunteerFeedTypes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav, TabId } from '../../components/BottomNav';
import { Icon } from '../../components/Icon';
import { WatchableVolunteerRequestCard } from '../../components/volunteer/WatchableVolunteerRequestCard';
import { VolunteerRequestCardSkeleton } from '../../components/volunteer/VolunteerRequestCardSkeleton';
import { FeedEmptyState } from '../../components/volunteer/FeedEmptyState';
import { useVolunteerFeed } from '../../hooks/useVolunteerFeed';
import { useVolunteerCityLabel } from '../../hooks/useVolunteerCityLabel';
import {
  countActiveFeedFilters,
  DEFAULT_VOLUNTEER_FEED_FILTERS,
  VolunteerFeedFilters,
} from '../../types/volunteerFeedFilters';
import { buildVolunteerFeedFilterChips } from '../../utils/volunteerFeedFilterChips';
import { applyVolunteerFeedFilters } from '../../utils/volunteerFeedFilters';
import { BOTTOM_NAV_BAR_HEIGHT } from '../../services/labelCatalog';
import { RADIUS, T, CARD_BG, shadowFab } from '../../theme/tokens';

const SCROLL_TOP_THRESHOLD = 360;

type Props = {
  activeTab?: TabId;
  onTabPress?: (tab: TabId) => void;
  onRequestPress?: (requestId: string) => void;
  onMapPress?: () => void;
  onNotificationsPress?: () => void;
  onFiltersPress?: () => void;
  onResetFilters?: () => void;
  onNetworkErrorPress?: () => void;
  feedFilters?: VolunteerFeedFilters;
  unreadCount?: number;
};

export function VolunteerFeedScreen({
  activeTab = 'feed',
  onTabPress,
  onRequestPress,
  onMapPress,
  onNotificationsPress,
  onFiltersPress,
  onResetFilters,
  onNetworkErrorPress,
  feedFilters,
  unreadCount = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const cityLabel = useVolunteerCityLabel();
  const {
    tab,
    setTab,
    items,
    tabs,
    counts,
    categoryLabels,
    loading,
    refreshing,
    hasLoadedOnce,
    hasMore,
    loadingMore,
    loadMore,
    error,
    reload,
  } = useVolunteerFeed(feedFilters ?? DEFAULT_VOLUNTEER_FEED_FILTERS);
  const [search, setSearch] = useState('');
  const [listScrollEnabled, setListScrollEnabled] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const listRef = useRef<FlatList<VolunteerFeedItem>>(null);
  const scrollOffsetRef = useRef(0);
  const restoreScrollOnFocusRef = useRef(false);
  const activeFilterCount = feedFilters ? countActiveFeedFilters(feedFilters) : 0;
  const feedFiltersKey = useMemo(
    () => JSON.stringify(feedFilters ?? DEFAULT_VOLUNTEER_FEED_FILTERS),
    [feedFilters],
  );
  const prevFeedFiltersKeyRef = useRef(feedFiltersKey);
  const [filtersReloading, setFiltersReloading] = useState(false);
  const blockingLoad = loading || filtersReloading;
  const hasSearch = search.trim().length > 0;
  const hasClientSideFilters =
    hasSearch ||
    activeFilterCount > 0 ||
    tab !== 'all' ||
    Boolean(feedFilters && (
      !feedFilters.social ||
      !feedFilters.material ||
      feedFilters.socialCategories.length > 0 ||
      feedFilters.materialCategories.length > 0 ||
      feedFilters.beneficiaryCategories.length > 0 ||
      feedFilters.datePreset != null ||
      feedFilters.sort !== DEFAULT_VOLUNTEER_FEED_FILTERS.sort ||
      feedFilters.maxDistanceKm !== DEFAULT_VOLUNTEER_FEED_FILTERS.maxDistanceKm
    ));

  const categoryLabelRecord = useMemo(() => {
    const record: Record<string, string> = {};
    categoryLabels.forEach((label, code) => {
      record[code] = label;
    });
    return record;
  }, [categoryLabels]);

  const filterChips = useMemo(() => {
    if (!feedFilters) return [];
    return buildVolunteerFeedFilterChips(feedFilters, categoryLabelRecord, search);
  }, [categoryLabelRecord, feedFilters, search]);

  const handleResetFilters = () => {
    setSearch('');
    setTab('all');
    onResetFilters?.();
  };

  const requests = useMemo(() => {
    const filtered = feedFilters
      ? applyVolunteerFeedFilters(items, feedFilters, search)
      : items.filter((item) => {
          const query = search.trim().toLowerCase();
          if (!query) return true;
          return (
            item.title.toLowerCase().includes(query) ||
            item.author.toLowerCase().includes(query) ||
            item.reqCategory.toLowerCase().includes(query)
          );
        });

    if (tab === 'social') return filtered.filter((item) => item.type === 'social');
    if (tab === 'material') return filtered.filter((item) => item.type === 'material');
    return filtered;
  }, [items, feedFilters, search, tab]);

  const isEmpty = requests.length === 0;
  const totalAvailable = counts[tab];

  const availabilityLabel = useMemo(() => {
    if (blockingLoad) {
      return 'Загрузка…';
    }
    const citySuffix = cityLabel ? ` · ${cityLabel}` : '';
    if (hasClientSideFilters && !isEmpty && requests.length < totalAvailable) {
      return `${requests.length} из ${totalAvailable} доступно${citySuffix}`;
    }
    if (isEmpty && hasClientSideFilters) {
      return `0 доступно${citySuffix}`;
    }
    return `${totalAvailable} доступно${citySuffix}`;
  }, [
    blockingLoad,
    cityLabel,
    hasClientSideFilters,
    isEmpty,
    requests.length,
    totalAvailable,
  ]);

  const scrollToTop = useCallback((animated = true) => {
    listRef.current?.scrollToOffset({ offset: 0, animated });
    setShowScrollTop(false);
  }, []);

  useEffect(() => {
    if (prevFeedFiltersKeyRef.current === feedFiltersKey) return;
    prevFeedFiltersKeyRef.current = feedFiltersKey;
    scrollToTop(false);
    setFiltersReloading(true);
    void reload().finally(() => setFiltersReloading(false));
  }, [feedFiltersKey, reload, scrollToTop]);

  const handleListScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollOffsetRef.current = offsetY;
    setShowScrollTop(offsetY > SCROLL_TOP_THRESHOLD);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!restoreScrollOnFocusRef.current) return;
      restoreScrollOnFocusRef.current = false;

      const offset = scrollOffsetRef.current;
      if (offset <= 0) return;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          listRef.current?.scrollToOffset({ offset, animated: false });
        });
      });
    }, []),
  );

  const handleRefresh = useCallback(() => {
    scrollToTop(false);
    return reload();
  }, [reload, scrollToTop]);

  const handleRequestPress = useCallback(
    (requestId: string) => {
      restoreScrollOnFocusRef.current = true;
      onRequestPress?.(requestId);
    },
    [onRequestPress],
  );

  const renderRequest = useCallback(
    ({ item }: { item: (typeof requests)[number] }) => (
      <View style={styles.cardRow}>
        <WatchableVolunteerRequestCard
          request={item}
          onPress={() => handleRequestPress(item.id)}
          onHelpPress={() => handleRequestPress(item.id)}
          onCarouselInteractionChange={(active) => setListScrollEnabled(!active)}
        />
      </View>
    ),
    [handleRequestPress],
  );

  const listHeader = useMemo(
    () => (
      <>
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Icon name="search" size={20} color={T.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Поиск по заявкам…"
              placeholderTextColor={T.muted}
              style={styles.searchInput}
            />
            <Pressable style={styles.filterBtn} onPress={onFiltersPress} hitSlop={8}>
              <Icon name="filter" size={18} color={activeFilterCount > 0 ? T.primary : T.ink2} />
              {activeFilterCount > 0 ? (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {tabs.map((feedTab) => {
            const active = tab === feedTab.id;
            return (
              <Pressable
                key={feedTab.id}
                onPress={() => setTab(feedTab.id)}
                style={[styles.feedTab, active && styles.feedTabActive]}
              >
                <Text style={[styles.feedTabLabel, active && styles.feedTabLabelActive]}>
                  {feedTab.label}
                </Text>
                <View style={[styles.feedTabCount, active && styles.feedTabCountActive]}>
                  <Text style={[styles.feedTabCountText, active && styles.feedTabCountTextActive]}>
                    {feedTab.count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Активные заявки</Text>
          <Text style={styles.sectionHint}>по фильтрам</Text>
        </View>
      </>
    ),
    [
      activeFilterCount,
      onFiltersPress,
      search,
      setTab,
      tab,
      tabs,
    ],
  );

  const listEmpty = useMemo(() => {
    if (blockingLoad) {
      return (
        <View style={styles.loadingWrap}>
          <VolunteerRequestCardSkeleton />
          <VolunteerRequestCardSkeleton />
          <VolunteerRequestCardSkeleton />
          <Text style={styles.loadingText}>Загружаем заявки…</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={handleRefresh} hitSlop={8}>
            <Text style={styles.retryText}>Повторить</Text>
          </Pressable>
          {onNetworkErrorPress ? (
            <Pressable onPress={onNetworkErrorPress} hitSlop={8} style={{ marginTop: 4 }}>
              <Text style={styles.helpText}>Нет подключения?</Text>
            </Pressable>
          ) : null}
        </View>
      );
    }
    if (isEmpty) {
      return (
        <FeedEmptyState
          filterChips={hasClientSideFilters ? filterChips : []}
          hasActiveFilters={hasClientSideFilters}
          onFiltersPress={onFiltersPress}
          onResetFilters={handleResetFilters}
        />
      );
    }
    return null;
  }, [
    error,
    filterChips,
    handleResetFilters,
    hasClientSideFilters,
    isEmpty,
    blockingLoad,
    onFiltersPress,
    onNetworkErrorPress,
    handleRefresh,
  ]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Заявки</Text>
          <Text style={styles.subtitle}>{availabilityLabel}</Text>
        </View>
        <Pressable style={styles.headerIconBtn} onPress={onMapPress} hitSlop={8}>
          <Icon name="map" size={20} color={T.ink} />
        </Pressable>
        <Pressable style={styles.headerIconBtn} onPress={onNotificationsPress} hitSlop={8}>
          <Icon name="bell" size={20} color={T.ink} />
          {unreadCount > 0 ? <View style={styles.bellDot} /> : null}
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        style={styles.scroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={listScrollEnabled}
        keyboardShouldPersistTaps="handled"
        data={blockingLoad ? [] : isEmpty ? [] : requests}
        keyExtractor={(item) => item.id}
        extraData={requests.length}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        renderItem={renderRequest}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ItemSeparatorComponent={() => <View style={styles.cardGap} />}
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
        onScroll={handleListScroll}
        scrollEventThrottle={16}
        onEndReached={() => {
          if (!loading && !refreshing && hasMore) {
            void loadMore();
          }
        }}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerSkeletons}>
              <VolunteerRequestCardSkeleton />
              <VolunteerRequestCardSkeleton />
            </View>
          ) : null
        }
        refreshControl={
          hasLoadedOnce ? (
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          ) : undefined
        }
      />

      {showScrollTop && !blockingLoad && !isEmpty && !error ? (
        <Pressable
          style={[
            styles.scrollTopFab,
            shadowFab,
            { bottom: insets.bottom + BOTTOM_NAV_BAR_HEIGHT + 12 },
          ]}
          onPress={() => scrollToTop()}
          accessibilityRole="button"
          accessibilityLabel="В начало списка"
          hitSlop={8}
        >
          <View style={styles.scrollTopIcon}>
            <Icon name="chevR" size={22} color={T.primaryDark} strokeWidth={2.2} />
          </View>
        </Pressable>
      ) : null}

      <BottomNav active={activeTab} onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 1,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: T.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: T.accent,
    borderWidth: 2,
    borderColor: '#fff',
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    paddingBottom: 16,
    flexGrow: 1,
  },
  searchWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.ink,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontFamily: 'Manrope_700Bold',
    color: '#fff',
    lineHeight: 12,
  },
  tabsRow: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
  },
  feedTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: T.border,
  },
  feedTabActive: {
    backgroundColor: T.ink,
    borderColor: T.ink,
  },
  feedTabLabel: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  feedTabLabelActive: {
    color: '#fff',
  },
  feedTabCount: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: T.surface2,
  },
  feedTabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  feedTabCountText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
  },
  feedTabCountTextActive: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    letterSpacing: -0.2,
  },
  sectionHint: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  cardRow: {
    paddingHorizontal: 20,
  },
  cardGap: {
    height: 14,
  },
  footerSkeletons: {
    gap: 14,
    paddingTop: 4,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  scrollTopFab: {
    position: 'absolute',
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: T.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scrollTopIcon: {
    transform: [{ rotate: '-90deg' }],
  },
  center: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingWrap: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 14,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primary,
  },
  helpText: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
    textDecorationLine: 'underline',
  },
});
