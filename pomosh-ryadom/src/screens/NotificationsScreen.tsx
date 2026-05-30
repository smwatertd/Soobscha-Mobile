import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationResponse } from '../api/integrationTypes';
import { NotificationCard } from '../components/notifications/NotificationCard';
import { NotificationsEmptyState } from '../components/notifications/NotificationsEmptyState';
import { Chip } from '../components/Chip';
import { ScreenHeader } from '../components/ScreenHeader';
import { useNotifications } from '../hooks/useNotifications';
import { T } from '../theme/tokens';
import { groupNotificationsByDay } from '../utils/notificationPresentation';
import {
  NOTIFICATION_FILTERS,
  NotificationFilterId,
  countNotificationsForFilter,
  countUnreadForFilter,
  matchesNotificationFilter,
} from '../utils/notificationFilters';

type Props = {
  onBack?: () => void;
  onNotificationPress?: (notification: NotificationResponse) => void;
  footer?: React.ReactNode;
};

export function NotificationsScreen({ onBack, onNotificationPress, footer }: Props) {
  const insets = useSafeAreaInsets();
  const { items, unreadCount, loading, error, refresh, markRead, markAllRead } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<NotificationFilterId>('all');
  const filteredItems = useMemo(
    () => items.filter((item) => matchesNotificationFilter(item, activeFilter)),
    [items, activeFilter],
  );

  const grouped = useMemo(() => groupNotificationsByDay(filteredItems), [filteredItems]);

  const showLoading = loading && items.length === 0;
  const errorMessage = error?.message ?? null;
  const isEmpty = filteredItems.length === 0;

  const filterLabels = useMemo(
    () =>
      NOTIFICATION_FILTERS.map((filter) => {
        const unreadInFilter = countUnreadForFilter(items, filter.id);
        const totalInFilter = countNotificationsForFilter(items, filter.id);

        if (filter.id === 'all' && unreadCount > 0) {
          return { ...filter, label: `${filter.label} · ${unreadCount}` };
        }
        if (unreadInFilter > 0) {
          return { ...filter, label: `${filter.label} · ${unreadInFilter}` };
        }
        if (totalInFilter > 0 && filter.id !== 'all') {
          return { ...filter, label: `${filter.label} · ${totalInFilter}` };
        }
        return filter;
      }),
    [items, unreadCount],
  );

  const headerRight = unreadCount > 0 ? (
    <Pressable onPress={markAllRead} hitSlop={8}>
      <Text style={styles.markAll}>Прочитать все</Text>
    </Pressable>
  ) : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {onBack ? (
        <ScreenHeader title="Уведомления" onBack={onBack} right={headerRight} />
      ) : (
        <View style={styles.tabHeader}>
          <View style={styles.tabTitleRow}>
            <Text style={styles.tabTitle}>Уведомления</Text>
            {unreadCount > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            ) : null}
          </View>
          {headerRight}
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        {filterLabels.map((filter) => (
          <Chip
            key={filter.id}
            label={filter.label}
            active={activeFilter === filter.id}
            onPress={() => setActiveFilter(filter.id)}
          />
        ))}
      </ScrollView>

      {showLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={T.primary} size="large" />
          <Text style={styles.loadingText}>Загружаем уведомления…</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable onPress={refresh}>
            <Text style={styles.retry}>Повторить</Text>
          </Pressable>
        </View>
      ) : isEmpty ? (
        <NotificationsEmptyState filter={activeFilter} />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={{ paddingBottom: insets.bottom + (footer ? 8 : 24) }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={T.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {grouped.map((group) => (
            <View key={group.label}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              {group.items.map((item) => (
                <NotificationCard
                  key={item.id}
                  item={item}
                  onPress={() => {
                    if (!item.is_read) {
                      markRead(item.id);
                    }
                    onNotificationPress?.(item);
                  }}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  tabTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabTitle: {
    fontSize: 22,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.4,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: '#fff',
  },
  markAll: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primary,
  },
  chipsScroll: {
    maxHeight: 44,
    marginBottom: 8,
  },
  chipsContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  groupLabel: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    textAlign: 'center',
  },
  retry: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primary,
  },
});
