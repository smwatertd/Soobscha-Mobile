import { NotificationResponse } from '../api/integrationTypes';

export type NotificationFilterId = 'all' | 'requests' | 'verification' | 'payments';

export const NOTIFICATION_FILTERS: { id: NotificationFilterId; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'requests', label: 'Заявки' },
  { id: 'verification', label: 'Верификация' },
  { id: 'payments', label: 'Пожертвования' },
];

export function matchesNotificationFilter(
  item: NotificationResponse,
  filter: NotificationFilterId,
): boolean {
  if (filter === 'all') return true;

  const type = item.type ?? '';

  switch (filter) {
    case 'requests':
      return (
        type.startsWith('help_request.') ||
        type.startsWith('social_help_request.') ||
        type.startsWith('report.')
      );
    case 'verification':
      return type.startsWith('verification.');
    case 'payments':
      return type.startsWith('donation.');
    default:
      return true;
  }
}

export function countNotificationsForFilter(
  items: NotificationResponse[],
  filter: NotificationFilterId,
): number {
  return items.filter((item) => matchesNotificationFilter(item, filter)).length;
}

export function countUnreadForFilter(
  items: NotificationResponse[],
  filter: NotificationFilterId,
): number {
  return items.filter((item) => !item.is_read && matchesNotificationFilter(item, filter)).length;
}
