import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useNotificationsHub } from '../providers/NotificationsProvider';

export function useUnreadNotificationsCount() {
  const { unreadCount, refreshUnread } = useNotificationsHub();

  useFocusEffect(
    useCallback(() => {
      void refreshUnread();
    }, [refreshUnread]),
  );

  return { unreadCount, refresh: refreshUnread };
}
