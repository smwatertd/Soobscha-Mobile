import * as Notifications from 'expo-notifications';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { getUnreadNotificationsCount } from '../api/notifications';
import {
  InAppNotificationBanner,
  InAppNotificationBannerData,
} from '../components/notifications/InAppNotificationBanner';
import { navigateFromPushRoute } from '../navigation/pushNavigation';
import {
  PushForegroundEvent,
  subscribePushForeground,
  subscribeNotificationsRefresh,
} from '../services/notificationsEvents';

type NotificationsContextValue = {
  unreadCount: number;
  refreshUnread: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

type Props = {
  children: ReactNode;
};

const BANNER_AUTO_HIDE_MS = 5000;

export function NotificationsProvider({ children }: Props) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [banner, setBanner] = useState<InAppNotificationBannerData | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const bannerRouteRef = useRef<PushForegroundEvent['route']>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearBannerTimer = useCallback(() => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
  }, []);

  const dismissBanner = useCallback(() => {
    clearBannerTimer();
    setBannerVisible(false);
    setBanner(null);
    bannerRouteRef.current = null;
  }, [clearBannerTimer]);

  const refreshUnread = useCallback(async () => {
    try {
      const { unread_count } = await getUnreadNotificationsCount();
      setUnreadCount(unread_count);
      await Notifications.setBadgeCountAsync(unread_count).catch(() => undefined);
    } catch {
      // badge is optional
    }
  }, []);

  const showPushBanner = useCallback(
    (event: PushForegroundEvent) => {
      clearBannerTimer();
      bannerRouteRef.current = event.route;
      setBanner({ title: event.title, body: event.body });
      setBannerVisible(true);
      bannerTimerRef.current = setTimeout(dismissBanner, BANNER_AUTO_HIDE_MS);
    },
    [clearBannerTimer, dismissBanner],
  );

  useEffect(() => {
    void refreshUnread();
  }, [refreshUnread]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshUnread();
      }
    });
    return () => sub.remove();
  }, [refreshUnread]);

  useEffect(() => {
    const unsubPush = subscribePushForeground((event) => {
      void refreshUnread();
      showPushBanner(event);
    });

    const unsubRefresh = subscribeNotificationsRefresh(() => {
      void refreshUnread();
    });

    return () => {
      unsubPush();
      unsubRefresh();
    };
  }, [refreshUnread, showPushBanner]);

  useEffect(() => () => clearBannerTimer(), [clearBannerTimer]);

  const value = useMemo(
    () => ({
      unreadCount,
      refreshUnread,
    }),
    [unreadCount, refreshUnread],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <InAppNotificationBanner
        visible={bannerVisible}
        data={banner}
        onPress={() => {
          const route = bannerRouteRef.current;
          dismissBanner();
          if (route) {
            void navigateFromPushRoute(route);
          }
        }}
        onDismiss={dismissBanner}
      />
    </NotificationsContext.Provider>
  );
}

export function useNotificationsHub(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotificationsHub must be used within NotificationsProvider');
  }
  return ctx;
}
