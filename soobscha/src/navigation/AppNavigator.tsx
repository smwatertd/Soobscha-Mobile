import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, NavigationState, RouteProp } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NotificationResponse } from '../api/integrationTypes';
import { isDevLogScreenEnabled } from '../config/logging';
import { BeneficiaryMainScreen } from '../screens/BeneficiaryMainScreen';
import { BeneficiaryHelpRequestDetailScreen } from '../screens/beneficiary/BeneficiaryHelpRequestDetailScreen';
import { BeneficiaryMeetingInProgressScreen } from '../screens/beneficiary/BeneficiaryMeetingInProgressScreen';
import { BeneficiaryFinishMeetingScreen } from '../screens/beneficiary/BeneficiaryFinishMeetingScreen';
import { BeneficiarySocialMeetingDoneScreen } from '../screens/beneficiary/BeneficiarySocialMeetingDoneScreen';
import { BeneficiaryReportScreen } from '../screens/beneficiary/BeneficiaryReportScreen';
import { BeneficiaryMaterialReportScreen } from '../screens/beneficiary/BeneficiaryMaterialReportScreen';
import { BeneficiaryPayoutRequestScreen } from '../screens/beneficiary/BeneficiaryPayoutRequestScreen';
import { BeneficiaryReportViewScreen } from '../screens/beneficiary/BeneficiaryReportViewScreen';
import { BeneficiaryDonationsListScreen } from '../screens/beneficiary/BeneficiaryDonationsListScreen';
import { BeneficiaryPayoutsListScreen } from '../screens/beneficiary/BeneficiaryPayoutsListScreen';
import { BeneficiaryRefundObligationScreen } from '../screens/beneficiary/BeneficiaryRefundObligationScreen';
import { BeneficiaryRefundPaymentScreen } from '../screens/beneficiary/BeneficiaryRefundPaymentScreen';
import { BeneficiaryStartMeetingScreen } from '../screens/beneficiary/BeneficiaryStartMeetingScreen';
import { VolunteersListScreen } from '../screens/beneficiary/VolunteersListScreen';
import { ChatScreen } from '../screens/common/ChatScreen';
import { ErrorStateScreen } from '../screens/common/ErrorStateScreen';
import { VisitorBeneficiaryRequestsScreen } from '../screens/common/VisitorBeneficiaryRequestsScreen';
import { VisitorProfileScreen } from '../screens/common/VisitorProfileScreen';
import { BeneficiaryOnboardingGuideScreen } from '../screens/BeneficiaryOnboardingGuideScreen';
import { VolunteerOnboardingGuideScreen } from '../screens/VolunteerOnboardingGuideScreen';
import { LoginOtpScreen } from '../screens/LoginOtpScreen';
import { BeneficiaryVerifCategoryScreen } from '../screens/beneficiary/verification/BeneficiaryVerifCategoryScreen';
import { BeneficiaryVerifActiveScreen } from '../screens/beneficiary/verification/BeneficiaryVerifActiveScreen';
import { BeneficiaryVerifGeneralScreen } from '../screens/beneficiary/verification/BeneficiaryVerifGeneralScreen';
import { BeneficiaryVerifCityPickerScreen } from '../screens/beneficiary/verification/BeneficiaryVerifCityPickerScreen';
import { BeneficiaryVerifDetailsScreen } from '../screens/beneficiary/verification/BeneficiaryVerifDetailsScreen';
import { BeneficiaryVerifContactsScreen } from '../screens/beneficiary/verification/BeneficiaryVerifContactsScreen';
import { BeneficiaryVerifReviewScreen } from '../screens/beneficiary/verification/BeneficiaryVerifReviewScreen';
import { BeneficiaryVerifDraftProvider } from '../providers/BeneficiaryVerifDraftProvider';
import { SocialHelpRequestRelevanceScreen } from '../screens/beneficiary/SocialHelpRequestRelevanceScreen';
import { CreateHelpRequestTypeScreen } from '../screens/beneficiary/CreateHelpRequestTypeScreen';
import { CreateHelpRequestDetailsScreen } from '../screens/beneficiary/CreateHelpRequestDetailsScreen';
import { CreateHelpRequestConditionsScreen } from '../screens/beneficiary/CreateHelpRequestConditionsScreen';
import { CreateHelpRequestSkillsScreen } from '../screens/beneficiary/CreateHelpRequestSkillsScreen';
import { CreateHelpRequestReviewScreen } from '../screens/beneficiary/CreateHelpRequestReviewScreen';
import { CreateMaterialHelpRequestDetailsScreen } from '../screens/beneficiary/CreateMaterialHelpRequestDetailsScreen';
import { CreateMaterialHelpRequestAmountScreen } from '../screens/beneficiary/CreateMaterialHelpRequestAmountScreen';
import { CreateMaterialHelpRequestReviewScreen } from '../screens/beneficiary/CreateMaterialHelpRequestReviewScreen';
import { DevLogsScreen } from '../screens/DevLogsScreen';
import { HelpRequestDetailScreen } from '../screens/HelpRequestDetailScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { RegisterOtpScreen } from '../screens/RegisterOtpScreen';
import { RegisterPhoneScreen } from '../screens/RegisterPhoneScreen';
import { RegisterStep1Screen } from '../screens/RegisterStep1Screen';
import { RegisterStep2Screen } from '../screens/RegisterStep2Screen';
import { RoleSelectScreen } from '../screens/RoleSelectScreen';
import { VolunteerMainScreen } from '../screens/VolunteerMainScreen';
import { VolunteerDonateScreen } from '../screens/volunteer/VolunteerDonateScreen';
import { VolunteerFiltersScreen } from '../screens/volunteer/VolunteerFiltersScreen';
import { VolunteerSuccessScreen } from '../screens/volunteer/VolunteerSuccessScreen';
import { VolunteerVerifDraftProvider } from '../providers/VolunteerVerifDraftProvider';
import { VolunteerVerifActiveScreen } from '../screens/volunteer/verification/VolunteerVerifActiveScreen';
import { VolunteerVerifCityPickerScreen } from '../screens/volunteer/verification/VolunteerVerifCityPickerScreen';
import { VolunteerVerifContactsScreen } from '../screens/volunteer/verification/VolunteerVerifContactsScreen';
import { VolunteerVerifGeneralScreen } from '../screens/volunteer/verification/VolunteerVerifGeneralScreen';
import { VolunteerVerifReviewScreen } from '../screens/volunteer/verification/VolunteerVerifReviewScreen';
import { VolunteerVerifSkillsScreen } from '../screens/volunteer/verification/VolunteerVerifSkillsScreen';
import { ProfileCityPickerScreen } from '../screens/profile/ProfileCityPickerScreen';
import { ProfileVerificationStatus } from '../types/profileVerification';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { AppLogo } from '../components/AppLogo';
import { useIntegrations } from '../providers/IntegrationsProvider';
import {
  homeRouteForSession,
  restoreSession,
  signOut,
} from '../services/authSession';
import { loadSession } from '../services/authStorage';
import { navigateFromNotification } from '../utils/notificationNavigation';
import { logger } from '../services/logger';
import { ensureLabelCatalogLoaded } from '../services/labelCatalog';
import { ensureSkillCatalogLoaded } from '../services/skillCatalog';
import { DEFAULT_VOLUNTEER_FEED_FILTERS } from '../types/volunteerFeedFilters';
import { ensureVolunteerFeedLoaded } from '../services/volunteerFeedSession';
import { ensureWatchedHelpRequestsLoaded } from '../services/helpRequestWatch';
import { VolunteerWatchedScreen } from '../screens/volunteer/VolunteerWatchedScreen';
import {
  RegisterOtpParams,
  RegisterPhoneParams,
  RegisterStep1Params,
  RegisterStep2Params,
} from './authTypes';
import { navigationRef } from './navigationRef';
import { goBackSafe } from './navigationHelpers';
import { navigateFromPushRoute } from './pushNavigation';
import {
  CreateHelpRequestConditionsParams,
  CreateHelpRequestDetailsParams,
  CreateHelpRequestReviewParams,
  CreateMaterialHelpRequestAmountParams,
  CreateMaterialHelpRequestDetailsParams,
  CreateMaterialHelpRequestReviewParams,
} from './createHelpRequestTypes';
import { TabId } from '../components/BottomNav';
import { VolunteerFeedFilters } from '../types/volunteerFeedFilters';
import { VolunteerMapFilters } from '../types/volunteerMapFilters';
import type { ErrorStateVariant } from '../constants/errorStateVariants';
import { T } from '../theme/tokens';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  RoleSelect: undefined;
  RegisterPhone: RegisterPhoneParams;
  RegisterStep1: RegisterStep1Params;
  RegisterStep2: RegisterStep2Params;
  RegisterOtp: RegisterOtpParams;
  BeneficiaryOnboardingGuide: undefined;
  VolunteerOnboardingGuide: undefined;
  LoginOtp: {
    phoneDigits: string;
    password: string;
    verificationId: string;
  };
  VolunteerMain: {
    initialTab?: TabId;
    feedFilters?: VolunteerFeedFilters;
    mapFilters?: VolunteerMapFilters;
  } | undefined;
  BeneficiaryMain: undefined;
  CreateHelpRequestType: { resetDraft?: boolean } | undefined;
  CreateHelpRequestDetails: CreateHelpRequestDetailsParams;
  CreateHelpRequestSkills: { type?: 'social' } | undefined;
  CreateHelpRequestConditions: CreateHelpRequestConditionsParams;
  CreateHelpRequestReview: CreateHelpRequestReviewParams;
  CreateMaterialHelpRequestDetails: CreateMaterialHelpRequestDetailsParams;
  CreateMaterialHelpRequestAmount: CreateMaterialHelpRequestAmountParams;
  CreateMaterialHelpRequestReview: CreateMaterialHelpRequestReviewParams;
  BeneficiaryHelpRequestDetail: { helpRequestId: string };
  BeneficiaryDonationsList: {
    helpRequestId: string;
    donationsCount?: number;
    collectedKopeks?: number;
  };
  BeneficiaryPayoutsList: {
    helpRequestId: string;
    payoutsCount?: number;
    withdrawnKopeks?: number;
  };
  BeneficiaryStartMeeting: { helpRequestId: string };
  BeneficiaryMeetingInProgress: { helpRequestId: string };
  BeneficiaryFinishMeeting: { helpRequestId: string };
  BeneficiarySocialMeetingDone: {
    helpRequestId: string;
    title?: string;
    participants: { id: string; name: string; finished: boolean }[];
    durationMinutes?: number;
  };
  VolunteersList: {
    helpRequestId: string;
    scheduleLabel?: string;
    mode?: 'attending' | 'beneficiary';
  };
  Chat: {
    helpRequestId: string;
    recipientName: string;
    requestTitle: string;
    requestSchedule?: string;
    openAsBeneficiary?: boolean;
  };
  VisitorProfile: { userId: string; displayName?: string; role?: 'volunteer' | 'beneficiary' };
  VisitorBeneficiaryRequests: {
    userId: string;
    displayName?: string;
    initialTab?: 'active' | 'completed';
  };
  ErrorState: {
    variant: ErrorStateVariant;
    requestId?: string;
    helpRequestId?: string;
    paymentAmountRub?: number;
    returnTo?: keyof RootStackParamList;
  };
  BeneficiaryReport: {
    helpRequestId: string;
  };
  BeneficiaryMaterialReport: {
    helpRequestId: string;
    title?: string;
    amountLabel?: string;
  };
  BeneficiaryReportView: {
    helpRequestId: string;
    title?: string;
    isMaterial: boolean;
    readOnly?: boolean;
  };
  BeneficiaryPayoutRequest: {
    helpRequestId: string;
    title: string;
  };
  BeneficiaryRefundObligation: {
    helpRequestId: string;
    title?: string;
    receivedKopeks?: number;
    confirmedKopeks?: number;
  };
  BeneficiaryRefundPayment: {
    helpRequestId: string;
    title?: string;
    remainingKopeks?: number;
    requiredKopeks?: number;
    returnedKopeks?: number;
    paymentsCount?: number;
  };
  Notifications: undefined;
  HelpRequestDetail: { helpRequestId: string };
  VolunteerFeedFilters: { filters?: VolunteerFeedFilters };
  VolunteerMapFilters: { filters?: VolunteerMapFilters };
  VolunteerWatched: undefined;
  ProfileCityPicker: {
    role: 'volunteer' | 'beneficiary';
    initialCityCode?: string | null;
    initialCityLabel?: string | null;
  };
  VolunteerDonate: { helpRequestId: string; title: string; recipient: string };
  VolunteerSuccess: {
    amountRub: number;
    title: string;
    recipient: string;
    kind?: 'donation' | 'join';
  };
  VolunteerVerifGeneral: undefined;
  VolunteerVerifCityPicker: undefined;
  VolunteerVerifContacts: undefined;
  VolunteerVerifSkills: undefined;
  VolunteerVerifReview: undefined;
  VolunteerVerifActive: { status?: ProfileVerificationStatus } | undefined;
  BeneficiaryVerifCategory: undefined;
  BeneficiaryVerifGeneral: undefined;
  BeneficiaryVerifCityPicker: undefined;
  BeneficiaryVerifDetails: undefined;
  BeneficiaryVerifContacts: { returnToReview?: boolean } | undefined;
  BeneficiaryVerifReview: undefined;
  BeneficiaryVerifActive: { status?: ProfileVerificationStatus } | undefined;
  SocialHelpRequestRelevance: { helpRequestId: string; title?: string; scheduleLabel?: string };
  DevLogs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function VolunteerMainRoute({
  navigation,
  route,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VolunteerMain'>;
  route: RouteProp<RootStackParamList, 'VolunteerMain'>;
}) {
  const { unregisterPush } = useIntegrations();

  return (
    <VolunteerMainScreen
      navigation={navigation}
      route={route}
      onLogout={async () => {
        await unregisterPush();
        await signOut();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }}
    />
  );
}

function BeneficiaryMainRoute({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BeneficiaryMain'>;
  route: RouteProp<RootStackParamList, 'BeneficiaryMain'>;
}) {
  const { unregisterPush } = useIntegrations();

  return (
    <BeneficiaryMainScreen
      navigation={navigation}
      onLogout={async () => {
        await unregisterPush();
        await signOut();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }}
    />
  );
}

function handleNotificationPress(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  notification: NotificationResponse,
) {
  void navigateFromNotification(navigation, notification);
}

function getActiveRouteName(state: NavigationState | undefined): string | undefined {
  if (!state) return undefined;
  const route = state.routes[state.index];
  if (route.state) {
    return getActiveRouteName(route.state as NavigationState);
  }
  return route.name;
}

function BootstrapSplash() {
  return (
    <View style={styles.splash}>
      <AppLogo variant="stacked" size={72} showTitle titleColor="#fff" subtitleColor="rgba(255,255,255,0.82)" />
    </View>
  );
}

type AppNavigatorProps = {
  onReady?: () => void;
};

export function AppNavigator({ onReady }: AppNavigatorProps) {
  const { consumePendingPushRoute, registerPush } = useIntegrations();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [initialRoute, setInitialRoute] = useState<{
    name: keyof RootStackParamList;
    params?: RootStackParamList[keyof RootStackParamList];
  }>({ name: 'Welcome' });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const session = await restoreSession();
      if (cancelled) return;

      if (session) {
        setInitialRoute({ name: homeRouteForSession(session) });
        void ensureSkillCatalogLoaded();
        void ensureWatchedHelpRequestsLoaded();
        void ensureLabelCatalogLoaded().then(() => {
          if (session.role === 'VOLUNTEER') {
            void ensureVolunteerFeedLoaded('all', {
              filters: DEFAULT_VOLUNTEER_FEED_FILTERS,
            });
          }
        });
        registerPush();
      }

      setBootstrapping(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [registerPush]);

  const handleNavReady = useCallback(() => {
    const route = consumePendingPushRoute();
    if (route) {
      navigateFromPushRoute(route);
    }
    onReady?.();
  }, [consumePendingPushRoute, onReady]);

  if (bootstrapping) {
    return <BootstrapSplash />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={handleNavReady}
      onStateChange={(state) => {
        const route = getActiveRouteName(state);
        if (route) {
          logger.nav.debug('screen', { route });
        }
      }}
    >
      <VolunteerVerifDraftProvider>
      <BeneficiaryVerifDraftProvider>
      <Stack.Navigator
        initialRouteName={initialRoute.name}
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <Stack.Screen name="Welcome">
          {({ navigation }) => (
            <WelcomeScreen
              onStart={() => navigation.navigate('RoleSelect')}
              onLogin={() => navigation.navigate('Login')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Login">
          {({ navigation }) => (
            <LoginScreen
              onBack={() => goBackSafe(navigation, { name: 'Welcome' })}
              onCreateAccount={() => navigation.navigate('RoleSelect')}
              onOpenDevLogs={
                isDevLogScreenEnabled() ? () => navigation.navigate('DevLogs') : undefined
              }
              onNeedsPhoneVerification={(params) =>
                navigation.navigate('LoginOtp', params)
              }
              onSuccess={async () => {
                registerPush();
                const session = await loadSession();
                if (!session) return;
                navigation.reset({
                  index: 0,
                  routes: [{ name: homeRouteForSession(session) }],
                });
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="RoleSelect">
          {({ navigation }) => (
            <RoleSelectScreen
              onContinue={(role) => navigation.navigate('RegisterStep1', { role })}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="RegisterPhone" component={RegisterPhoneScreen} />
        <Stack.Screen name="RegisterStep1" component={RegisterStep1Screen} />
        <Stack.Screen name="RegisterStep2" component={RegisterStep2Screen} />
        <Stack.Screen name="RegisterOtp" component={RegisterOtpScreen} />

        <Stack.Screen name="BeneficiaryOnboardingGuide">
          {({ navigation }) => <BeneficiaryOnboardingGuideScreen navigation={navigation} />}
        </Stack.Screen>
        <Stack.Screen name="VolunteerOnboardingGuide">
          {({ navigation }) => <VolunteerOnboardingGuideScreen navigation={navigation} />}
        </Stack.Screen>
        <Stack.Screen name="LoginOtp" component={LoginOtpScreen} />

        <Stack.Screen name="VolunteerMain">
          {(props) => <VolunteerMainRoute {...props} />}
        </Stack.Screen>

        <Stack.Screen name="VolunteerVerifGeneral" component={VolunteerVerifGeneralScreen} />
        <Stack.Screen name="VolunteerVerifCityPicker" component={VolunteerVerifCityPickerScreen} />
        <Stack.Screen name="VolunteerVerifContacts" component={VolunteerVerifContactsScreen} />
        <Stack.Screen name="VolunteerVerifSkills" component={VolunteerVerifSkillsScreen} />
        <Stack.Screen name="VolunteerVerifReview" component={VolunteerVerifReviewScreen} />
        <Stack.Screen name="VolunteerVerifActive" component={VolunteerVerifActiveScreen} />
        <Stack.Screen name="ProfileCityPicker" component={ProfileCityPickerScreen} />

        <Stack.Screen name="BeneficiaryMain">
          {(props) => <BeneficiaryMainRoute {...props} />}
        </Stack.Screen>

        <Stack.Screen name="CreateHelpRequestType" component={CreateHelpRequestTypeScreen} />
        <Stack.Screen name="CreateHelpRequestDetails" component={CreateHelpRequestDetailsScreen} />
        <Stack.Screen name="CreateHelpRequestSkills" component={CreateHelpRequestSkillsScreen} />
        <Stack.Screen name="CreateHelpRequestConditions" component={CreateHelpRequestConditionsScreen} />
        <Stack.Screen name="CreateHelpRequestReview" component={CreateHelpRequestReviewScreen} />
        <Stack.Screen name="CreateMaterialHelpRequestDetails" component={CreateMaterialHelpRequestDetailsScreen} />
        <Stack.Screen name="CreateMaterialHelpRequestAmount" component={CreateMaterialHelpRequestAmountScreen} />
        <Stack.Screen name="CreateMaterialHelpRequestReview" component={CreateMaterialHelpRequestReviewScreen} />
        <Stack.Screen name="BeneficiaryHelpRequestDetail">
          {({ navigation, route }) => (
            <BeneficiaryHelpRequestDetailScreen
              navigation={navigation}
              route={route}
              onSessionExpired={async () => {
                await signOut();
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              }}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="BeneficiaryDonationsList" component={BeneficiaryDonationsListScreen} />
        <Stack.Screen name="BeneficiaryPayoutsList" component={BeneficiaryPayoutsListScreen} />

        <Stack.Screen name="BeneficiaryReport" component={BeneficiaryReportScreen} />
        <Stack.Screen name="BeneficiaryReportView" component={BeneficiaryReportViewScreen} />
        <Stack.Screen name="BeneficiaryMaterialReport" component={BeneficiaryMaterialReportScreen} />
        <Stack.Screen name="BeneficiaryPayoutRequest" component={BeneficiaryPayoutRequestScreen} />
        <Stack.Screen name="BeneficiaryRefundObligation" component={BeneficiaryRefundObligationScreen} />
        <Stack.Screen name="BeneficiaryRefundPayment" component={BeneficiaryRefundPaymentScreen} />
        <Stack.Screen name="BeneficiaryStartMeeting" component={BeneficiaryStartMeetingScreen} />
        <Stack.Screen name="BeneficiaryMeetingInProgress" component={BeneficiaryMeetingInProgressScreen} />
        <Stack.Screen name="BeneficiaryFinishMeeting" component={BeneficiaryFinishMeetingScreen} />
        <Stack.Screen name="BeneficiarySocialMeetingDone" component={BeneficiarySocialMeetingDoneScreen} />
        <Stack.Screen name="VolunteersList" component={VolunteersListScreen} />
        <Stack.Screen name="Chat">
          {({ navigation, route }) => (
            <ChatScreen
              recipientName={route.params.recipientName}
              requestTitle={route.params.requestTitle}
              requestSchedule={route.params.requestSchedule}
              onBack={() => navigation.goBack()}
              onOpenRequest={() =>
                navigation.navigate(
                  route.params.openAsBeneficiary ? 'BeneficiaryHelpRequestDetail' : 'HelpRequestDetail',
                  { helpRequestId: route.params.helpRequestId },
                )
              }
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="VisitorProfile" component={VisitorProfileScreen} />
        <Stack.Screen name="VisitorBeneficiaryRequests" component={VisitorBeneficiaryRequestsScreen} />
        <Stack.Screen name="ErrorState">
          {({ navigation, route }) => (
            <ErrorStateScreen
              variant={route.params.variant}
              requestId={route.params.requestId}
              paymentAmountRub={route.params.paymentAmountRub}
              onBack={() => navigation.goBack()}
              onPrimary={() => navigation.goBack()}
              onSecondary={() => {
                if (route.params.returnTo === 'VolunteerDonate') {
                  navigation.goBack();
                  return;
                }
                navigation.goBack();
              }}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="BeneficiaryVerifCategory" component={BeneficiaryVerifCategoryScreen} />
        <Stack.Screen name="BeneficiaryVerifGeneral" component={BeneficiaryVerifGeneralScreen} />
        <Stack.Screen name="BeneficiaryVerifCityPicker" component={BeneficiaryVerifCityPickerScreen} />
        <Stack.Screen name="BeneficiaryVerifDetails" component={BeneficiaryVerifDetailsScreen} />
        <Stack.Screen name="BeneficiaryVerifContacts" component={BeneficiaryVerifContactsScreen} />
        <Stack.Screen name="BeneficiaryVerifReview" component={BeneficiaryVerifReviewScreen} />
        <Stack.Screen name="BeneficiaryVerifActive" component={BeneficiaryVerifActiveScreen} />
        <Stack.Screen name="SocialHelpRequestRelevance" component={SocialHelpRequestRelevanceScreen} />

        <Stack.Screen name="Notifications">
          {({ navigation }) => (
            <NotificationsScreen
              onBack={async () => {
                const session = await loadSession();
                goBackSafe(navigation, {
                  name: session?.role === 'BENEFICIARY' ? 'BeneficiaryMain' : 'VolunteerMain',
                });
              }}
              onNotificationPress={(notification) => handleNotificationPress(navigation, notification)}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="HelpRequestDetail">
          {({ navigation, route }) => (
            <HelpRequestDetailScreen
              helpRequestId={route.params.helpRequestId}
              onBack={() => navigation.goBack()}
              onDonate={(params) => navigation.navigate('VolunteerDonate', params)}
              onJoined={(params) =>
                navigation.navigate('VolunteerSuccess', {
                  ...params,
                  amountRub: 0,
                  kind: 'join',
                })
              }
              onOpenVolunteers={(params) =>
                navigation.navigate('VolunteersList', { ...params, mode: 'attending' })
              }
              onOpenVisitorProfile={(params) => navigation.navigate('VisitorProfile', params)}
              onOpenReport={(params) =>
                navigation.navigate('BeneficiaryReportView', {
                  helpRequestId: params.helpRequestId,
                  title: params.title,
                  isMaterial: params.isMaterial ?? false,
                  readOnly: true,
                })
              }
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="VolunteerFeedFilters" component={VolunteerFiltersScreen} />
        <Stack.Screen name="VolunteerMapFilters" component={VolunteerFiltersScreen} />
        <Stack.Screen name="VolunteerWatched" component={VolunteerWatchedScreen} />

        <Stack.Screen name="VolunteerDonate">
          {({ navigation, route }) => (
            <VolunteerDonateScreen
              helpRequestId={route.params.helpRequestId}
              title={route.params.title}
              recipient={route.params.recipient}
              onBack={() => navigation.goBack()}
              onSuccess={(params) =>
                navigation.navigate('VolunteerSuccess', {
                  ...params,
                  kind: 'donation',
                })
              }
              onPaymentError={({ amountRub }) =>
                navigation.navigate('ErrorState', {
                  variant: 'payment-failed',
                  helpRequestId: route.params.helpRequestId,
                  paymentAmountRub: amountRub,
                  returnTo: 'VolunteerDonate',
                })
              }
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="VolunteerSuccess">
          {({ navigation, route }) => (
            <VolunteerSuccessScreen
              amountRub={route.params.amountRub}
              title={route.params.title}
              recipient={route.params.recipient}
              kind={route.params.kind}
              onClose={() =>
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'VolunteerMain', params: { initialTab: 'feed' } }],
                })
              }
              onGoHome={() =>
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'VolunteerMain', params: { initialTab: 'home' } }],
                })
              }
            />
          )}
        </Stack.Screen>

        {isDevLogScreenEnabled() && (
          <Stack.Screen name="DevLogs">
            {({ navigation }) => (
              <DevLogsScreen
                onBack={() => goBackSafe(navigation, { name: 'Login' })}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
      </BeneficiaryVerifDraftProvider>
      </VolunteerVerifDraftProvider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
