import { useCallback, useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { NotificationRoute } from '../api/integrationTypes';
import { loadSession } from '../services/authStorage';
import {
  emitNotificationsRefresh,
  emitPushForeground,
} from '../services/notificationsEvents';
import {
  attachPushListeners,
  extractRouteFromNotificationResponse,
  getInitialNotificationRoute,
  syncPushTokenWithBackend,
  unregisterPushFromBackend,
} from '../services/pushNotifications';
import { parsePushPayload, resolveNotificationRoute } from '../services/notificationRouter';

type PushState = {
  token: string | null;
  permissionGranted: boolean;
  pendingRoute: NotificationRoute | null;
  lastNotification: Notifications.Notification | null;
};

export function usePushNotifications(options?: {
  enabled?: boolean;
  onNavigate?: (route: NotificationRoute) => void;
}) {
  const enabled = options?.enabled ?? true;
  const onNavigateRef = useRef(options?.onNavigate);
  onNavigateRef.current = options?.onNavigate;

  const [state, setState] = useState<PushState>({
    token: null,
    permissionGranted: false,
    pendingRoute: null,
    lastNotification: null,
  });

  const register = useCallback(async () => {
    if (!enabled) return null;

    const session = await loadSession();
    if (!session?.accessToken) return null;

    const token = await syncPushTokenWithBackend(session.accessToken);
    setState((s) => ({
      ...s,
      token,
      permissionGranted: Boolean(token),
    }));
    return token;
  }, [enabled]);

  const unregister = useCallback(async () => {
    if (!enabled) return;
    await unregisterPushFromBackend();
    setState((s) => ({ ...s, token: null }));
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    register();

    getInitialNotificationRoute().then((route) => {
      if (route) {
        setState((s) => ({ ...s, pendingRoute: route }));
        onNavigateRef.current?.(route);
      }
    });

    const detach = attachPushListeners({
      onNotificationReceived: (notification) => {
        setState((s) => ({ ...s, lastNotification: notification }));

        const content = notification.request.content;
        const data = content.data as Record<string, unknown> | undefined;
        const payload = parsePushPayload(data);
        const route = resolveNotificationRoute(payload);

        emitPushForeground({
          title: content.title ?? payload.title ?? 'Уведомление',
          body: content.body ?? payload.body ?? '',
          route,
        });
        emitNotificationsRefresh();
      },
      onNotificationResponse: (response) => {
        const { route } = extractRouteFromNotificationResponse(response);
        setState((s) => ({ ...s, pendingRoute: route }));
        onNavigateRef.current?.(route);
        emitNotificationsRefresh();
      },
    });

    return detach;
  }, [enabled, register]);

  const consumePendingRoute = useCallback(() => {
    const route = state.pendingRoute;
    setState((s) => ({ ...s, pendingRoute: null }));
    return route;
  }, [state.pendingRoute]);

  return {
    ...state,
    register,
    unregister,
    consumePendingRoute,
  };
}
