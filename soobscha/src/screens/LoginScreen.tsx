import { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiClientError } from '../api/client';
import { parsePhoneVerificationChallenge } from '../api/authFlow';
import { getErrorMessage, mapFieldError } from '../api/errors';
import { UserRole } from '../api/types';
import { Button } from '../components/Button';
import { AppLogo } from '../components/AppLogo';
import { Checkbox } from '../components/Checkbox';
import { Icon } from '../components/Icon';
import { PhoneField, TextField } from '../components/TextField';
import { TestUsersPanel } from '../components/TestUsersPanel';
import {
  formatPhoneDisplay,
  TestUser,
  toApiPhone,
} from '../config/testUsers';
import { getApiBaseUrl } from '../config/api';
import { signInWithCredentials } from '../services/authSession';
import { useFeedback } from '../providers/FeedbackProvider';
import { getPasswordAutofillProps } from '../utils/autofillCredentials';
import { T } from '../theme/tokens';

type Props = {
  onSuccess: () => void;
  onNeedsPhoneVerification?: (params: {
    phoneDigits: string;
    password: string;
    verificationId: string;
  }) => void;
  onBack?: () => void;
  onOpenDevLogs?: () => void;
  onCreateAccount?: () => void;
};

export function LoginScreen({
  onSuccess,
  onNeedsPhoneVerification,
  onBack,
  onOpenDevLogs,
  onCreateAccount,
}: Props) {
  const insets = useSafeAreaInsets();
  const { showError } = useFeedback();
  const [phoneDigits, setPhoneDigits] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const clearErrors = () => {
    setPhoneError(undefined);
    setPasswordError(undefined);
  };

  const validate = (): boolean => {
    clearErrors();
    let ok = true;

    if (phoneDigits.length !== 10) {
      setPhoneError('Введите номер из 10 цифр');
      ok = false;
    }

    if (!password.trim()) {
      setPasswordError('Введите пароль');
      ok = false;
    } else if (password.length < 6) {
      setPasswordError('Пароль слишком короткий');
      ok = false;
    }

    return ok;
  };

  const submit = useCallback(
    async (phone: string, pass: string, hintRole?: UserRole) => {
      clearErrors();
      setLoading(true);

      try {
        await signInWithCredentials(
          { phone_number: toApiPhone(phone), password: pass },
          { hintRole, persistAcrossRestarts: rememberMe },
        );
        onSuccess();
      } catch (err) {
        if (err instanceof ApiClientError) {
          const { parsed } = err;
          const challenge = parsePhoneVerificationChallenge(parsed);

          if (challenge && onNeedsPhoneVerification) {
            onNeedsPhoneVerification({
              phoneDigits: phone,
              password: pass,
              verificationId: challenge.verificationId,
            });
            return;
          }

          const phoneFieldErr = mapFieldError(parsed.fieldErrors, 'phone_number');
          const passFieldErr = mapFieldError(parsed.fieldErrors, 'password');

          if (phoneFieldErr) setPhoneError(phoneFieldErr);
          if (passFieldErr) setPasswordError(passFieldErr);

          if (parsed.status === 401) {
            showError('Неверный телефон или пароль', { title: 'Не удалось войти' });
          } else {
            showError(parsed.message);
          }
        } else {
          showError(getErrorMessage(err, 'Не удалось войти. Попробуйте ещё раз.'));
        }
      } finally {
        setLoading(false);
      }
    },
    [rememberMe, onSuccess, onNeedsPhoneVerification, showError],
  );

  const handleLogin = () => {
    if (!validate()) return;
    submit(phoneDigits, password);
  };

  const handleTestUser = (user: TestUser) => {
    clearErrors();
    setPhoneDigits(user.phoneDigits);
    setPassword(user.password);
    submit(user.phoneDigits, user.password, user.role);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          {onBack && (
            <Pressable onPress={onBack} style={styles.backBtn}>
              <Icon name="chevL" size={22} color={T.ink2} />
            </Pressable>
          )}

          <View style={styles.logoBlock}>
            <Pressable
              onLongPress={onOpenDevLogs}
              delayLongPress={600}
              disabled={!onOpenDevLogs}
            >
              <AppLogo size={64} showTitle subtitle="Войдите, чтобы продолжить" />
            </Pressable>
            {onOpenDevLogs ? (
              <Text style={styles.devHint}>Долгое нажатие на логотип → логи</Text>
            ) : null}
          </View>

          <View style={styles.form}>
            <PhoneField
              value={formatPhoneDisplay(phoneDigits)}
              onChangeDigits={setPhoneDigits}
              error={phoneError}
              autofillMode="login"
            />

            <View>
              <View style={styles.passwordHeader}>
                <Text style={styles.fieldLabel}>Пароль</Text>
                <Pressable>
                  <Text style={styles.forgotLink}>Забыли?</Text>
                </Pressable>
              </View>
              <TextField
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                icon="shield"
                error={passwordError}
                autoCapitalize="none"
                autoCorrect={false}
                {...getPasswordAutofillProps('login')}
                suffix={
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={20} color={T.muted} />
                  </Pressable>
                }
              />
            </View>
          </View>

          <Checkbox
            checked={rememberMe}
            onToggle={() => setRememberMe((v) => !v)}
            label="Запомнить меня на этом устройстве"
          />

          <Button
            kind="primary"
            size="lg"
            full
            iconRight="arrowR"
            onPress={handleLogin}
            disabled={loading}
            style={styles.loginBtn}
          >
            {loading ? 'Вход…' : 'Войти'}
          </Button>

          {loading && (
            <ActivityIndicator color={T.primary} style={styles.loader} />
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>или</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable style={styles.qrBtn}>
            <Icon name="qr" size={20} color={T.ink2} />
            <Text style={styles.qrBtnText}>Войти по QR-коду</Text>
          </Pressable>

          <TestUsersPanel onSelect={handleTestUser} disabled={loading} />

          <Text style={styles.apiHint}>API: {getApiBaseUrl()}</Text>

          <Text style={styles.footer}>
            Нет аккаунта?{' '}
            <Text style={styles.footerLink} onPress={onCreateAccount}>
              Создать
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  scroll: {
    flexGrow: 1,
  },
  inner: {
    paddingHorizontal: 28,
    paddingTop: 8,
    gap: 18,
  },
  backBtn: {
    alignSelf: 'flex-start',
    padding: 4,
  },
  logoBlock: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  devHint: {
    fontSize: 11,
    fontFamily: 'Manrope_500Medium',
    color: T.mutedSoft,
    marginTop: 8,
  },
  form: {
    gap: 14,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  forgotLink: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primary,
  },
  loginBtn: {
    marginTop: 4,
  },
  loader: {
    marginTop: -8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: T.border,
  },
  dividerText: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  qrBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  qrBtnText: {
    fontSize: 16,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  apiHint: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.mutedSoft,
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 8,
  },
  footerLink: {
    color: T.primary,
    fontFamily: 'Manrope_700Bold',
  },
});
