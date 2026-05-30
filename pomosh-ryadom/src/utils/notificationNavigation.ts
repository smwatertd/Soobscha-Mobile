import { NotificationResponse } from '../api/integrationTypes';
import { UserRole } from '../api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { loadSession } from '../services/authStorage';
import { resolveNotificationRoute } from '../services/notificationRouter';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export async function navigateFromNotification(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  notification: NotificationResponse,
  roleHint?: UserRole,
) {
  const pushRoute = resolveNotificationRoute({
    type: notification.type,
    entity_type: notification.entity_type ?? undefined,
    entity_id: notification.entity_id ?? undefined,
  });

  if (pushRoute.screen === 'HelpRequestDetail') {
    const session = roleHint ? { role: roleHint } : await loadSession();
    if (session?.role === 'BENEFICIARY') {
      navigation.navigate('BeneficiaryHelpRequestDetail', {
        helpRequestId: pushRoute.helpRequestId,
      });
    } else {
      navigation.navigate('HelpRequestDetail', { helpRequestId: pushRoute.helpRequestId });
    }
    return;
  }

  if (pushRoute.screen === 'VerificationStatus') {
    navigation.navigate('VolunteerVerifActive');
    return;
  }

  if (pushRoute.screen === 'Notifications') {
    navigation.navigate('Notifications');
  }
}
