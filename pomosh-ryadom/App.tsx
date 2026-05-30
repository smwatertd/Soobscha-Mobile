import { useCallback, useEffect, useState } from 'react';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { navigateFromPushRoute } from './src/navigation/pushNavigation';
import { getApiBaseUrl } from './src/config/api';
import { getLogLevel } from './src/config/logging';
import { IntegrationsProvider } from './src/providers/IntegrationsProvider';
import { CreateHelpRequestDraftProvider } from './src/providers/CreateHelpRequestDraftProvider';
import { FeedbackProvider } from './src/providers/FeedbackProvider';
import { NotificationsProvider } from './src/providers/NotificationsProvider';
import { installGlobalErrorLogging, logger } from './src/services/logger';
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    installGlobalErrorLogging();
    logger.app.info('App started', {
      apiUrl: getApiBaseUrl(),
      logLevel: getLogLevel(),
      dev: __DEV__,
    });
  }, []);

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const handleNavigationReady = useCallback(() => {
    setAppReady(true);
  }, []);

  useEffect(() => {
    if (fontsLoaded && appReady) {
      void SplashScreen.hideAsync();
    }
  }, [appReady, fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <FeedbackProvider>
          <NotificationsProvider>
            <CreateHelpRequestDraftProvider>
              <IntegrationsProvider onPushNavigate={navigateFromPushRoute}>
                <AppNavigator onReady={handleNavigationReady} />
              </IntegrationsProvider>
            </CreateHelpRequestDraftProvider>
          </NotificationsProvider>
        </FeedbackProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
