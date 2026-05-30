import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { registerBeneficiary, registerVolunteer, tryFetchVerificationCode } from '../api/auth';
import { ApiClientError } from '../api/client';
import {
  mapRegistrationFieldError,
  registrationConflictMessage,
} from '../api/authFlow';
import { getErrorMessage } from '../api/errors';
import { Button } from '../components/Button';
import { FormErrorsBanner } from '../components/feedback/FormErrorsBanner';
import { Checkbox } from '../components/Checkbox';
import { ProgressBar } from '../components/ProgressBar';
import { PhoneField } from '../components/TextField';
import { ScreenHeader } from '../components/ScreenHeader';
import { formatPhoneDisplay, toApiPhone } from '../config/testUsers';
import { RootStackParamList } from '../navigation/AppNavigator';
import { goBackSafe } from '../navigation/navigationHelpers';
import {
  REGISTRATION_STEPS,
  REGISTRATION_TOTAL_STEPS,
  registrationStepLabel,
} from '../navigation/registrationProgress';
import { useFeedback } from '../providers/FeedbackProvider';
import { useIntegrations } from '../providers/IntegrationsProvider';
import {
  completeRegistrationSignIn,
  registrationOnboardingRoute,
} from '../services/authSession';
import { AutofillHiddenPasswordField } from '../components/AutofillHiddenPasswordField';
import { T } from '../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RegisterPhone'>;
  route: RouteProp<RootStackParamList, 'RegisterPhone'>;
};

export function RegisterPhoneScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { registerPush } = useIntegrations();
  const { showError, showToast } = useFeedback();
  const [phoneDigits, setPhoneDigits] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const step2Params = {
    role: route.params.role,
    firstName: route.params.firstName,
    lastName: route.params.lastName,
    middleName: route.params.middleName,
    gender: route.params.gender,
  };

  const handleContinue = async () => {
    setSubmitAttempted(true);
    if (phoneDigits.length !== 10) {
      setError('Введите номер из 10 цифр');
      return;
    }
    if (!agreed) {
      setError('Нужно принять условия использования');
      return;
    }

    setSubmitting(true);
    setError(undefined);

    const payload = {
      phone_number: toApiPhone(phoneDigits),
      password: route.params.password,
      first_name: route.params.firstName,
      last_name: route.params.lastName,
      middle_name: route.params.middleName ?? null,
      gender: route.params.gender,
    };

    try {
      const response =
        route.params.role === 'volunteer'
          ? await registerVolunteer(payload)
          : await registerBeneficiary(payload);

      if (response.is_phone_verified) {
        await completeRegistrationSignIn(phoneDigits, route.params.password, route.params.role);
        registerPush();
        showToast('Аккаунт создан', { body: 'Добро пожаловать в Сообща', variant: 'success' });
        navigation.reset({
          index: 0,
          routes: [{ name: registrationOnboardingRoute(route.params.role) }],
        });
        return;
      }

      let devOtpCode: string | undefined;
      if (__DEV__) {
        devOtpCode = await tryFetchVerificationCode(response.verification_id);
      }

      navigation.navigate('RegisterOtp', {
        role: route.params.role,
        phoneDigits,
        password: route.params.password,
        verificationId: response.verification_id,
        devOtpCode,
      });
    } catch (e) {
      if (e instanceof ApiClientError) {
        const { parsed } = e;
        const conflict = registrationConflictMessage(parsed, route.params.role);
        const phoneFieldErr = mapRegistrationFieldError(parsed.fieldErrors, 'phone_number');
        const message = phoneFieldErr ?? conflict ?? parsed.message;
        setError(message);
        showError(message);
        return;
      }
      showError(getErrorMessage(e, 'Не удалось зарегистрироваться'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader
        title={REGISTRATION_STEPS.phone.title}
        onBack={() => goBackSafe(navigation, { name: 'RegisterStep2', params: step2Params })}
        right={<Text style={styles.step}>{registrationStepLabel('phone')}</Text>}
      />
      <Text style={styles.subHeader}>{REGISTRATION_STEPS.phone.subHeader}</Text>
      <View style={styles.progressWrap}>
        <ProgressBar
          value={REGISTRATION_STEPS.phone.index}
          max={REGISTRATION_TOTAL_STEPS}
          height={4}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.body}>
          <Text style={styles.title}>
            Введите номер{'\n'}телефона
          </Text>
          <Text style={styles.subtitle}>
            Пришлём код подтверждения по SMS. Номер используется только для входа.
          </Text>

          <FormErrorsBanner
            errorCount={submitAttempted && error ? 1 : 0}
            title="Проверьте форму"
            message={error}
          />

          <PhoneField
            value={formatPhoneDisplay(phoneDigits)}
            onChangeDigits={(digits) => {
              setPhoneDigits(digits);
              if (error) setError(undefined);
            }}
            error={submitAttempted ? error : undefined}
            autofillMode="register"
          />

          <AutofillHiddenPasswordField value={route.params.password} mode="register-new" />

          <Checkbox
            checked={agreed}
            onToggle={() => {
              setAgreed((v) => !v);
              if (error) setError(undefined);
            }}
            label="Согласен с условиями использования и обработкой персональных данных"
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          kind="primary"
          size="lg"
          full
          iconRight="arrowR"
          disabled={submitting}
          onPress={handleContinue}
        >
          {submitting ? 'Отправляем код…' : 'Получить код'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  step: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  subHeader: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: -4,
  },
  progressWrap: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  scroll: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 20,
    gap: 16,
    position: 'relative',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 22,
    marginBottom: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
    backgroundColor: T.bg,
  },
});
