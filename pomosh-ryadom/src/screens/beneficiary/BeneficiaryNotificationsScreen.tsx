import { NotificationResponse } from '../../api/integrationTypes';
import { BeneficiaryBottomNav, BeneficiaryTabId } from '../../components/beneficiary/BeneficiaryBottomNav';
import { NotificationsScreen } from '../NotificationsScreen';

type Props = {
  activeTab?: BeneficiaryTabId;
  onTabPress?: (tab: BeneficiaryTabId) => void;
  unreadCount?: number;
  onNotificationPress?: (notification: NotificationResponse) => void;
};

export function BeneficiaryNotificationsScreen({
  activeTab = 'notifications',
  onTabPress,
  unreadCount = 0,
  onNotificationPress,
}: Props) {
  return (
    <NotificationsScreen
      onNotificationPress={onNotificationPress}
      footer={
        <BeneficiaryBottomNav
          active={activeTab}
          onTabPress={onTabPress}
          notificationsUnread={unreadCount}
        />
      }
    />
  );
}
