import { NotificationRoute } from '../api/integrationTypes';
import { logger } from '../services/logger';
import { loadSession } from '../services/authStorage';
import { navigate } from './navigationRef';

export async function navigateFromPushRoute(route: NotificationRoute) {
  logger.push.info('navigate', route);
  switch (route.screen) {
    case 'HelpRequestDetail': {
      const session = await loadSession();
      if (session?.role === 'BENEFICIARY') {
        navigate('BeneficiaryHelpRequestDetail', { helpRequestId: route.helpRequestId });
      } else {
        navigate('HelpRequestDetail', { helpRequestId: route.helpRequestId });
      }
      break;
    }
    case 'Notifications':
      navigate('Notifications');
      break;
    case 'VerificationStatus':
      navigate('VolunteerVerifActive');
      break;
    default:
      navigate('Notifications');
      break;
  }
}
