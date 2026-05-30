import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications';
import { NotificationResponse } from '../api/integrationTypes';
import { useNotificationsHub } from '../providers/NotificationsProvider';
import {
  emitNotificationsRefresh,
  subscribeNotificationsRefresh,
} from '../services/notificationsEvents';

export function useNotifications() {
  const { refreshUnread } = useNotificationsHub();
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, unread] = await Promise.all([
        getNotifications({ page: 1, pageSize: 50 }),
        getUnreadNotificationsCount(),
      ]);
      setItems(list.items);
      setUnreadCount(unread.unread_count);
      await refreshUnread();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Не удалось загрузить уведомления'));
    } finally {
      setLoading(false);
    }
  }, [refreshUnread]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    return subscribeNotificationsRefresh(() => {
      refresh();
    });
  }, [refresh]);

  const markRead = useCallback(
    async (id: string) => {
      await markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      await refreshUnread();
      emitNotificationsRefresh();
    },
    [refreshUnread],
  );

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await refreshUnread();
    emitNotificationsRefresh();
  }, [refreshUnread]);

  return { items, unreadCount, loading, error, refresh, markRead, markAllRead };
}
