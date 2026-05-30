import {
  NotificationEntityType,
  NotificationRoute,
  NotificationType,
  PushNotificationPayload,
} from '../api/integrationTypes';

export function parsePushPayload(data: Record<string, unknown> | undefined): PushNotificationPayload {
  if (!data) return {};

  return {
    type: typeof data.type === 'string' ? data.type : undefined,
    entity_type: typeof data.entity_type === 'string' ? data.entity_type : undefined,
    entity_id: typeof data.entity_id === 'string' ? data.entity_id : undefined,
    title: typeof data.title === 'string' ? data.title : undefined,
    body: typeof data.body === 'string' ? data.body : undefined,
  };
}

export function resolveNotificationRoute(payload: PushNotificationPayload): NotificationRoute {
  const entityType = payload.entity_type as NotificationEntityType | undefined;
  const entityId = payload.entity_id;
  const type = payload.type as NotificationType | undefined;

  if (entityType === 'help_request' && entityId) {
    return { screen: 'HelpRequestDetail', helpRequestId: entityId };
  }

  if (type?.startsWith('verification.')) {
    return { screen: 'VerificationStatus' };
  }

  if (type?.startsWith('social_help_request.') && entityId) {
    return { screen: 'HelpRequestDetail', helpRequestId: entityId };
  }

  if (type?.startsWith('help_request.') && entityId) {
    return { screen: 'HelpRequestDetail', helpRequestId: entityId };
  }

  if (type?.startsWith('donation.') && entityId) {
    return { screen: 'HelpRequestDetail', helpRequestId: entityId };
  }

  return { screen: 'Notifications' };
}

export function getNotificationChannelId(type?: string): string {
  if (!type) return 'default';
  if (type.startsWith('social_help_request.')) return 'social_requests';
  if (type.startsWith('verification.')) return 'verification';
  if (type.startsWith('donation.')) return 'donations';
  return 'help_requests';
}
