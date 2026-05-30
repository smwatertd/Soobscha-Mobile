import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import {
  resendVerificationCode,
  tryFetchVerificationCode,
  verifyPhone,
} from '../api/auth';
import { getErrorMessage } from '../api/errors';
import { Button } from '../components/Button';
import { OtpConfirmLayout } from '../components/auth/OtpConfirmLayout';
import { ScreenHeader } from '../components/ScreenHeader';
import { toApiPhone } from '../config/testUsers';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useFeedback } from '../providers/FeedbackProvider';
import { useIntegrations } from '../providers/IntegrationsProvider';
import { homeRouteForSession, signInWithCredentials } from '../services/authSession';
import { T } from '../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LoginOtp'>;
  route: RouteProp<RootStackParamList, 'LoginOtp'>;
};

const RESEND_SECONDS = 60;

function formatPhone(digits: string): string {
  const d = digits.padEnd(10, '•');
  return `+7 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function LoginOtpScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { registerPush } = useIntegrations();
  const { showError, showToast } = useFeedback();
  const { phoneDigits, password, verificationId } = route.params;

  const [code, setCode] = useState('');
  const [currentVerificationId, setCurrentVerificationId] = useState(verificationId);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpError, setOtpError] = useState<string | undefined>();
  const [devCodeHint, setDevCodeHint] = useState<string | undefined>();

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (!__DEV__) return;
    let cancelled = false;
    void tryFetchVerificationCode(currentVerificationId).then((fetched) => {
      if (!cancelled && fetched) {
        setDevCodeHint(fetched);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentVerificationId]);

  const finishLogin = useCallback(async () => {
    const session = await signInWithCredentials(
      { phone_number: toApiPhone(phoneDigits), password },
      { persistAcrossRestarts: true },
    );
    registerPush();
    navigation.reset({
      index: 0,
      routes: [{ name: homeRouteForSession(session) }],
    });
  }, [navigation, password, phoneDigits, registerPush]);

  const handleVerify = useCallback(
    async (otp: string) => {
      if (otp.length !== 6 || submitting) return;
      setSubmitting(true);
      setOtpError(undefined);
      try {
        await verifyPhone({ verification_id: currentVerificationId, code: otp });
        await finishLogin();
        showToast('Вы вошли', { variant: 'success', body: 'Добро пожаловать в Сообща' });
      } catch (e) {
        const message = getErrorMessage(e, 'Неверный код');
        setOtpError(message);
        setCode('');
      } finally {
        setSubmitting(false);
      }
    },
    [currentVerificationId, finishLogin, showToast, submitting],
  );

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      const response = await resendVerificationCode(currentVerificationId);
      setCurrentVerificationId(response.verification_id);
      setCountdown(RESEND_SECONDS);
      setCode('');
      const nextCode = response.verification_code?.trim();
      if (__DEV__ && nextCode && nextCode.length === 6) {
        setDevCodeHint(nextCode);
      }
      showToast('Код отправлен', { variant: 'success' });
    } catch (e) {
      showError(getErrorMessage(e, 'Не удалось отправить код повторно'));
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader
        title="Подтвердите вход"
        subtitle="Это безопасно — каждый вход проверяется"
        onBack={() => navigation.goBack()}
      />

      <View style={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        {__DEV__ && devCodeHint ? (
          <Text style={styles.devHint}>Dev-код: {devCodeHint}</Text>
        ) : null}

        <OtpConfirmLayout
          phoneFormatted={formatPhone(phoneDigits)}
          code={code}
          onCodeChange={setCode}
          otpError={otpError}
          countdownLabel={formatCountdown(countdown)}
          canResend={countdown <= 0}
          resending={resending}
          onResend={handleResend}
          onChangePhone={() => navigation.goBack()}
          footer={
            <Button
              kind="primary"
              size="lg"
              full
              iconRight="check"
              disabled={submitting || code.length !== 6}
              onPress={() => void handleVerify(code)}
            >
              {submitting ? 'Проверяем…' : 'Войти'}
            </Button>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 16,
  },
  devHint: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
    textAlign: 'center',
  },
});
