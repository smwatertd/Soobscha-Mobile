import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BenRequestCard, BenRequestCardData } from '../../components/beneficiary/BenRequestCard';
import { BeneficiaryRequestsFiltersModal } from '../../components/beneficiary/BeneficiaryRequestsFiltersModal';
import { BeneficiaryBottomNav, BeneficiaryTabId } from '../../components/beneficiary/BeneficiaryBottomNav';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import {
  BeneficiaryRequestsCounts,
  BeneficiaryRequestsFilters,
} from '../../hooks/useBeneficiaryRequests';
import {
  countStatusMatchesOnTab,
  hasActiveBeneficiaryRequestFilters,
} from '../../utils/beneficiaryRequestsFilters';
import { BeneficiaryRequestsTab } from '../../utils/helpRequestStatus';
import { T, CARD_BG } from '../../theme/tokens';

type Props = {
  activeTab?: BeneficiaryTabId;
  onTabPress?: (tab: BeneficiaryTabId) => void;
  unreadCount?: number;
  onCreatePress?: () => void;
  onRequestPress?: (requestId: string) => void;
  filter: BeneficiaryRequestsTab;
  onFilterChange: (tab: BeneficiaryRequestsTab) => void;
  filters: BeneficiaryRequestsFilters;
  onApplyFilters: (filters: BeneficiaryRequestsFilters) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sourceItems: BenRequestCardData[];
  totalItems?: number;
  items: BenRequestCardData[];
  counts: BeneficiaryRequestsCounts;
  loading?: boolean;
  refreshing?: boolean;
  error?: string | null;
  onRefresh?: () => void;
};

const FILTER_TABS: { id: BeneficiaryRequestsTab; label: string }[] = [
  { id: 'active', label: 'Активные' },
  { id: 'done', label: 'Завершено' },
  { id: 'archive', label: 'Архив' },
];

const EMPTY_COPY: Record<BeneficiaryRequestsTab, { title: string; sub: string }> = {
  active: {
    title: 'Нет активных заявок',
    sub: 'Создайте заявку — здесь появятся черновики, модерация и заявки в работе.',
  },
  done: {
    title: 'Завершённых заявок пока нет',
    sub: 'Когда помощь будет оказана и отчёт принят, заявки появятся в этом списке.',
  },
  archive: {
    title: 'Архив пуст',
    sub: 'Отклонённые и отменённые заявки будут храниться здесь.',
  },
};

function formatHeaderSubtitle(counts: BeneficiaryRequestsCounts): string {
  return `${counts.active} активных · ${counts.done} завершено`;
}

export function BeneficiaryRequestsScreen({
  activeTab = 'requests',
  onTabPress,
  unreadCount = 0,
  onCreatePress,
  onRequestPress,
  filter,
  onFilterChange,
  filters,
  onApplyFilters,
  searchQuery,
  onSearchQueryChange,
  sourceItems,
  totalItems = 0,
  items,
  counts,
  loading = false,
  refreshing = false,
  error,
  onRefresh,
}: Props) {
  const insets = useSafeAreaInsets();
  const empty = EMPTY_COPY[filter];
  const trimmedSearch = searchQuery.trim();
  const searchActive = trimmedSearch.length > 0;
  const filtersActive = hasActiveBeneficiaryRequestFilters(filters);
  const showEmpty = !loading && !error && items.length === 0;
  const showFilteredEmpty = showEmpty && totalItems > 0 && (searchActive || filtersActive);
  const statusMismatch =
    filters.statusCodes.length > 0 &&
    countStatusMatchesOnTab(sourceItems, filters.statusCodes) === 0 &&
    sourceItems.length > 0;

  const [filtersOpen, setFiltersOpen] = useState(false);

  const tabs = FILTER_TABS.map((t) => ({
    ...t,
    count: counts[t.id],
  }));

  const showList = !loading && !error && !showEmpty;

  const listEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={T.primary} size="large" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Не удалось загрузить</Text>
          <Text style={styles.emptySub}>{error}</Text>
          {onRefresh ? (
            <Button kind="secondary" size="sm" onPress={onRefresh} style={{ marginTop: 12 }}>
              Повторить
            </Button>
          ) : null}
        </View>
      );
    }

    if (showFilteredEmpty) {
      return (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Icon name="search" size={28} color={T.muted} strokeWidth={1.6} />
          </View>
          <Text style={styles.emptyTitle}>Ничего не найдено</Text>
          <Text style={styles.emptySub}>
            {statusMismatch
              ? `Статусы из фильтра не попадают во вкладку «${FILTER_TABS.find((t) => t.id === filter)?.label}». Откройте другую вкладку или снимите лишние статусы.`
              : `Попробуйте другой запрос или измените фильтры для вкладки «${FILTER_TABS.find((t) => t.id === filter)?.label}».`}
          </Text>
          <Pressable style={styles.emptyFiltersBtn} onPress={() => setFiltersOpen(true)}>
            <Text style={styles.emptyFiltersBtnText}>Изменить фильтры</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Icon name="document" size={28} color={T.muted} strokeWidth={1.6} />
        </View>
        <Text style={styles.emptyTitle}>{empty.title}</Text>
        <Text style={styles.emptySub}>{empty.sub}</Text>
        {filter === 'active' && onCreatePress ? (
          <Pressable style={styles.emptyCta} onPress={onCreatePress}>
            <Text style={styles.emptyCtaText}>Создать заявку</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }, [
    empty.sub,
    empty.title,
    error,
    filter,
    loading,
    onCreatePress,
    onRefresh,
    showFilteredEmpty,
    statusMismatch,
  ]);

  const renderItem = useCallback(
    ({ item }: { item: BenRequestCardData }) => (
      <BenRequestCard
        {...item}
        onPress={() => onRequestPress?.(item.id)}
        onReasonPress={() => onRequestPress?.(item.id)}
      />
    ),
    [onRequestPress],
  );

  const handleApplyFilters = useCallback(
    (next: BeneficiaryRequestsFilters) => {
      onApplyFilters(next);
      setFiltersOpen(false);
    },
    [onApplyFilters],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Мои заявки</Text>
        <Text style={styles.subtitle}>{formatHeaderSubtitle(counts)}</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color={T.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchQueryChange}
            placeholder="Поиск по заявкам…"
            placeholderTextColor={T.mutedSoft}
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          <Pressable
            style={styles.filterBtn}
            onPress={() => setFiltersOpen(true)}
            accessibilityLabel="Фильтры"
          >
            <Icon name="filter" size={18} color={filtersActive ? T.primary : T.ink2} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {tabs.map((t) => {
          const active = filter === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => onFilterChange(t.id)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{t.label}</Text>
              <View style={[styles.filterCount, active && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, active && styles.filterCountTextActive]}>
                  {t.count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        style={styles.scroll}
        data={showList ? items : []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={[
          styles.scrollContent,
          (showEmpty || error || loading) && styles.scrollContentEmpty,
        ]}
        ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />
          ) : undefined
        }
      />

      <BeneficiaryBottomNav
        active={activeTab}
        onTabPress={onTabPress}
        notificationsUnread={unreadCount}
      />

      <BeneficiaryRequestsFiltersModal
        visible={filtersOpen}
        value={filters}
        items={sourceItems}
        searchQuery={searchQuery}
        onClose={() => setFiltersOpen(false)}
        onApply={handleApplyFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
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
  searchRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 0,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.ink,
  },
  filterBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersScroll: {
    flexGrow: 0,
    marginTop: 12,
    marginBottom: 4,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: T.border,
  },
  filterChipActive: {
    backgroundColor: T.ink,
    borderColor: T.ink,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  filterLabelActive: {
    color: '#fff',
  },
  filterCount: {
    backgroundColor: T.surface2,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 999,
  },
  filterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  filterCountText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
  },
  filterCountTextActive: {
    color: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    flexGrow: 1,
  },
  listSeparator: {
    height: 14,
  },
  scrollContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    minHeight: 220,
    paddingVertical: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: T.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },
  emptyFiltersBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: T.primarySoft,
    alignSelf: 'center',
  },
  emptyFiltersBtnText: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.primaryDark,
  },
  emptyCta: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: T.accent,
    alignSelf: 'center',
  },
  emptyCtaText: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: '#fff',
  },
});
