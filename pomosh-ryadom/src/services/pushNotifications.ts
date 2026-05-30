import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerDeviceToken, unregisterDeviceToken } from '../api/notifications';
import { DevicePlatform } from '../api/integrationTypes';
import { getNotificationChannelId, parsePushPayload, resolveNotificationRoute } from './notificationRouter';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let lastRegisteredToken: string | null = null;

export type PushListeners = {
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void;
  onTokenRegistered?: (token: string) => void;
};

function getPlatform(): DevicePlatform {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Общие',
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  await Notifications.setNotificationChannelAsync('help_requests', {
    name: 'Заявки',
    importance: Notifications.AndroidImportance.HIGH,
  });

  await Notifications.setNotificationChannelAsync('social_requests', {
    name: 'Социальные заявки',
    importance: Notifications.AndroidImportance.HIGH,
  });

  await Notifications.setNotificationChannelAsync('verification', {
    name: 'Верификация',
    importance: Notifications.AndroidImportance.HIGH,
  });

  await Notifications.setNotificationChannelAsync('donations', {
    name: 'Пожертвования',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function requestPushPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  await setupAndroidChannels();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

/** Нативный FCM/APNs токен для бекенда */
export async function getNativePushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  try {
    const token = await Notifications.getDevicePushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

export async function syncPushTokenWithBackend(accessToken?: string | null): Promise<string | null> {
  if (!accessToken) return null;

  const granted = await requestPushPermissions();
  if (!granted) return null;

  const token = await getNativePushToken();
  if (!token) return null;

  if (token === lastRegisteredToken) return token;

  await registerDeviceToken(token, getPlatform());
  lastRegisteredToken = token;
  return token;
}

export async function unregisterPushFromBackend(): Promise<void> {
  const token = lastRegisteredToken ?? (await getNativePushToken());
  if (!token) return;

  try {
    await unregisterDeviceToken(token);
  } finally {
    lastRegisteredToken = null;
  }
}

export function attachPushListeners(listeners: PushListeners): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    listeners.onNotificationReceived?.(notification);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    listeners.onNotificationResponse?.(response);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

export async function getInitialNotificationRoute() {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return null;

  const data = response.notification.request.content.data as Record<string, unknown> | undefined;
  const payload = parsePushPayload(data);
  return resolveNotificationRoute(payload);
}

export function extractRouteFromNotificationResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as Record<string, unknown> | undefined;
  const payload = parsePushPayload(data);
  const route = resolveNotificationRoute(payload);
  const channelId = getNotificationChannelId(payload.type);
  return { payload, route, channelId };
}

export function getExpoProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}
