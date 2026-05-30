import { NotificationResponse } from '../api/integrationTypes';
import { IconName } from '../components/Icon';
import { T } from '../theme/tokens';

export type NotificationVisualMeta = {
  icon: IconName;
  color: string;
  categoryLabel: string;
};

export function getNotificationMeta(item: NotificationResponse): NotificationVisualMeta {
  const type = item.type ?? '';

  if (type.startsWith('verification.')) {
    return { icon: 'shield', color: T.success, categoryLabel: 'Верификация' };
  }
  if (type.startsWith('donation.')) {
    return { icon: 'heart', color: T.accent, categoryLabel: 'Пожертвование' };
  }
  if (type.startsWith('report.')) {
    return { icon: 'document', color: T.info, categoryLabel: 'Отчёт' };
  }
  if (type.startsWith('social_help_request.')) {
    return { icon: 'handshake', color: T.primary, categoryLabel: 'Социальная заявка' };
  }
  if (type.startsWith('help_request.')) {
    return { icon: 'leaf', color: T.primary, categoryLabel: 'Заявка' };
  }

  return { icon: 'bell', color: T.info, categoryLabel: 'Система' };
}

export function groupNotificationsByDay(items: NotificationResponse[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { label: string; items: NotificationResponse[] }[] = [];
  const bucket = new Map<string, NotificationResponse[]>();

  for (const item of items) {
    const date = new Date(item.created_at);
    date.setHours(0, 0, 0, 0);
    let label: string;
    if (date.getTime() === today.getTime()) {
      label = 'Сегодня';
    } else if (date.getTime() === yesterday.getTime()) {
      label = 'Вчера';
    } else {
      label = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    }
    const list = bucket.get(label) ?? [];
    list.push(item);
    bucket.set(label, list);
  }

  for (const [label, groupItems] of bucket) {
    groups.push({ label, items: groupItems });
  }

  return groups;
}

export function formatNotificationTime(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'сейчас';
  if (diffMin < 60) return `${diffMin} мин`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} ч`;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
