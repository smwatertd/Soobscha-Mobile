import { apiRequest } from './client';
import { buildQuery } from './query';
import {
  DevicePlatform,
  NotificationResponse,
  PaginatedResponse,
} from './integrationTypes';

export async function registerDeviceToken(
  fcmToken: string,
  platform: DevicePlatform,
): Promise<{ registered?: boolean }> {
  return apiRequest('/api/notifications/device-token', {
    method: 'PUT',
    auth: true,
    body: { fcm_token: fcmToken, platform },
  });
}

export async function unregisterDeviceToken(fcmToken: string): Promise<{ unregistered?: boolean }> {
  return apiRequest('/api/notifications/device-token', {
    method: 'DELETE',
    auth: true,
    body: { fcm_token: fcmToken },
  });
}

export async function getNotifications(params?: {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  desc?: boolean;
}): Promise<PaginatedResponse<NotificationResponse>> {
  const qs = buildQuery({
    page: params?.page ?? 1,
    'page-size': params?.pageSize ?? 20,
    'order-by': params?.orderBy,
    desc: params?.desc ?? true,
  });

  return apiRequest<PaginatedResponse<NotificationResponse>>(`/api/notifications${qs}`, {
    auth: true,
  });
}

export async function getUnreadNotificationsCount(): Promise<{ unread_count: number }> {
  return apiRequest('/api/notifications/unread-count', { auth: true });
}

export async function markNotificationRead(notificationId: string): Promise<NotificationResponse> {
  return apiRequest(`/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
    auth: true,
  });
}

export async function markAllNotificationsRead(): Promise<{ updated_count: number }> {
  return apiRequest('/api/notifications/read-all', {
    method: 'PATCH',
    auth: true,
  });
}
