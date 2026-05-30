import { describe, expect, it } from 'vitest';
import {
  countNotificationsForFilter,
  countUnreadForFilter,
  matchesNotificationFilter,
} from './notificationFilters';

const notifications = [
  { type: 'help_request.created', is_read: false },
  { type: 'social_help_request.updated', is_read: true },
  { type: 'report.pending', is_read: false },
  { type: 'verification.approved', is_read: false },
  { type: 'donation.succeeded', is_read: true },
] as any[];

describe('notification filters', () => {
  it('matches by groups', () => {
    expect(matchesNotificationFilter(notifications[0], 'requests')).toBe(true);
    expect(matchesNotificationFilter(notifications[3], 'verification')).toBe(true);
    expect(matchesNotificationFilter(notifications[4], 'payments')).toBe(true);
    expect(matchesNotificationFilter(notifications[4], 'requests')).toBe(false);
  });

  it('counts notifications and unread per filter', () => {
    expect(countNotificationsForFilter(notifications as any, 'requests')).toBe(3);
    expect(countUnreadForFilter(notifications as any, 'requests')).toBe(2);
    expect(countUnreadForFilter(notifications as any, 'all')).toBe(3);
  });
});
