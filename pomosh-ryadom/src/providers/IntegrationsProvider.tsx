import { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { NotificationRoute } from '../api/integrationTypes';
import { initYamap } from '../integrations/yandex/initYamap';
import { usePushNotifications } from '../hooks/usePushNotifications';

type IntegrationsContextValue = {
  pushToken: string | null;
  pushPermissionGranted: boolean;
  pendingPushRoute: NotificationRoute | null;
  registerPush: () => Promise<string | null>;
  unregisterPush: () => Promise<void>;
  consumePendingPushRoute: () => NotificationRoute | null;
};

const IntegrationsContext = createContext<IntegrationsContextValue | null>(null);

type Props = {
  children: ReactNode;
  onPushNavigate?: (route: NotificationRoute) => void;
};

export function IntegrationsProvider({ children, onPushNavigate }: Props) {
  useEffect(() => {
    void initYamap();
  }, []);

  const push = usePushNotifications({
    enabled: true,
    onNavigate: onPushNavigate,
  });

  const value = useMemo<IntegrationsContextValue>(
    () => ({
      pushToken: push.token,
      pushPermissionGranted: push.permissionGranted,
      pendingPushRoute: push.pendingRoute,
      registerPush: push.register,
      unregisterPush: push.unregister,
      consumePendingPushRoute: push.consumePendingRoute,
    }),
    [
      push.token,
      push.permissionGranted,
      push.pendingRoute,
      push.register,
      push.unregister,
      push.consumePendingRoute,
    ],
  );

  return <IntegrationsContext.Provider value={value}>{children}</IntegrationsContext.Provider>;
}

export function useIntegrations(): IntegrationsContextValue {
  const ctx = useContext(IntegrationsContext);
  if (!ctx) {
    throw new Error('useIntegrations must be used within IntegrationsProvider');
  }
  return ctx;
}
