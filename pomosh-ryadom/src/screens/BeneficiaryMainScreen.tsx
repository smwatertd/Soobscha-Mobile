import { useCallback, useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NotificationResponse } from '../api/integrationTypes';
import { BeneficiaryTabId } from '../components/beneficiary/BeneficiaryBottomNav';
import { useBeneficiaryHome } from '../hooks/useBeneficiaryHome';
import { useBeneficiaryRequests } from '../hooks/useBeneficiaryRequests';
import { useUnreadNotificationsCount } from '../hooks/useUnreadNotificationsCount';
import { RootStackParamList } from '../navigation/AppNavigator';
import { navigateFromNotification } from '../utils/notificationNavigation';
import { BeneficiaryHomeScreen } from './beneficiary/BeneficiaryHomeScreen';
import { BeneficiaryNotificationsScreen } from './beneficiary/BeneficiaryNotificationsScreen';
import { BeneficiaryProfileScreen } from './beneficiary/BeneficiaryProfileScreen';
import { BeneficiaryRequestsScreen } from './beneficiary/BeneficiaryRequestsScreen';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BeneficiaryMain'>;
  onLogout: () => void;
};

type TabShellProps = {
  activeTab: BeneficiaryTabId;
  unreadCount: number;
  onTabPress: (tab: BeneficiaryTabId) => void;
  onCreatePress: () => void;
  onRequestPress: (requestId: string) => void;
  onSessionExpired: () => void;
  onNotificationsPress: () => void;
  onRefreshUnread: () => void;
};

function BeneficiaryHomeTab({
  activeTab,
  unreadCount,
  onTabPress,
  onCreatePress,
  onRequestPress,
  onSessionExpired,
  onNotificationsPress,
  onRefreshUnread,
}: TabShellProps) {
  const { data, loading, refreshing, error, refresh } = useBeneficiaryHome(onSessionExpired);

  const handleRefresh = useCallback(() => {
    refresh();
    onRefreshUnread();
  }, [onRefreshUnread, refresh]);

  return (
    <BeneficiaryHomeScreen
      activeTab={activeTab}
      onTabPress={onTabPress}
      unreadCount={unreadCount}
      onCreatePress={onCreatePress}
      onNotificationsPress={onNotificationsPress}
      onRequestPress={onRequestPress}
      data={data}
      loading={loading}
      refreshing={refreshing}
      error={error}
      onRefresh={handleRefresh}
    />
  );
}

function BeneficiaryRequestsTab({
  activeTab,
  unreadCount,
  onTabPress,
  onCreatePress,
  onRequestPress,
  onSessionExpired,
}: TabShellProps) {
  const requests = useBeneficiaryRequests(onSessionExpired);

  return (
    <BeneficiaryRequestsScreen
      activeTab={activeTab}
      onTabPress={onTabPress}
      unreadCount={unreadCount}
      onCreatePress={onCreatePress}
      onRequestPress={onRequestPress}
      filter={requests.filter}
      onFilterChange={requests.setFilter}
      filters={requests.filters}
      onApplyFilters={requests.applyFilters}
      searchQuery={requests.searchQuery}
      onSearchQueryChange={requests.setSearchQuery}
      sourceItems={requests.sourceItems}
      totalItems={requests.totalItems}
      items={requests.items}
      counts={requests.counts}
      loading={requests.loading}
      refreshing={requests.refreshing}
      error={requests.error}
      onRefresh={requests.refresh}
    />
  );
}

export function BeneficiaryMainScreen({ navigation, onLogout }: Props) {
  const [tab, setTab] = useState<BeneficiaryTabId>('home');
  const { unreadCount, refresh: refreshUnread } = useUnreadNotificationsCount();
  const handleSessionExpired = useCallback(() => {
    onLogout();
  }, [onLogout]);

  const openCreate = () => navigation.navigate('CreateHelpRequestType', { resetDraft: true });

  const handleNotificationPress = (notification: NotificationResponse) => {
    void navigateFromNotification(navigation, notification, 'BENEFICIARY');
  };

  const handleTabPress = (next: BeneficiaryTabId) => {
    if (next === 'create') {
      openCreate();
      return;
    }
    setTab(next);
  };

  const shell: TabShellProps = {
    activeTab: tab,
    unreadCount,
    onTabPress: handleTabPress,
    onCreatePress: openCreate,
    onRequestPress: (requestId: string) =>
      navigation.navigate('BeneficiaryHelpRequestDetail', { helpRequestId: requestId }),
    onSessionExpired: handleSessionExpired,
    onNotificationsPress: () => setTab('notifications'),
    onRefreshUnread: refreshUnread,
  };

  if (tab === 'requests') {
    return <BeneficiaryRequestsTab {...shell} />;
  }

  if (tab === 'notifications') {
    return (
      <BeneficiaryNotificationsScreen
        activeTab={tab}
        onTabPress={handleTabPress}
        unreadCount={unreadCount}
        onNotificationPress={handleNotificationPress}
      />
    );
  }

  if (tab === 'profile') {
    return (
      <BeneficiaryProfileScreen
        activeTab={tab}
        onTabPress={handleTabPress}
        unreadCount={unreadCount}
        onLogout={onLogout}
        onStartVerification={() => navigation.navigate('BeneficiaryVerifCategory')}
        onEditCity={() => navigation.navigate('ProfileCityPicker', { role: 'beneficiary' })}
        onOpenVerification={(status) =>
          navigation.navigate('BeneficiaryVerifActive', { status })
        }
      />
    );
  }

  return <BeneficiaryHomeTab {...shell} />;
}
