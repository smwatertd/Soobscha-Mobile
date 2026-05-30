import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AppLogo } from '../components/AppLogo';
import { Button } from '../components/Button';
import { FormErrorsBanner } from '../components/feedback/FormErrorsBanner';
import { Icon } from '../components/Icon';
import { evaluatePasswordRules, PassRule } from '../components/PassRule';
import { ProgressBar } from '../components/ProgressBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { TextField } from '../components/TextField';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  REGISTRATION_STEPS,
  REGISTRATION_TOTAL_STEPS,
} from '../navigation/registrationProgress';
import { generateSecurePassword, IOS_PASSWORD_RULES } from '../utils/generatePassword';
import { getPasswordAutofillProps } from '../utils/autofillCredentials';
import { T } from '../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RegisterStep2'>;
  route: RouteProp<RootStackParamList, 'RegisterStep2'>;
};

export function RegisterStep2Screen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const rules = useMemo(() => evaluatePasswordRules(password), [password]);
  const allRulesOk = rules.minLength && rules.hasUpper && rules.hasDigit && rules.hasSpecial;
  const passwordsMatch = password.length > 0 && password === confirm;

  const handleGeneratePassword = () => {
    const next = generateSecurePassword();
    setPassword(next);
    setConfirm(next);
    setShowPassword(true);
    setShowConfirmPassword(true);
    setErrors({});
    setSubmitAttempted(false);
  };

  const handleContinue = () => {
    setSubmitAttempted(true);
    const nextErrors: { password?: string; confirm?: string } = {};

    if (!allRulesOk) {
      nextErrors.password = 'Пароль не соответствует требованиям';
    }
    if (!passwordsMatch) {
      nextErrors.confirm = 'Пароли не совпадают';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    navigation.navigate('RegisterPhone', {
      ...route.params,
      password,
    });
  };

  const passwordToggle = (visible: boolean, onToggle: () => void) => (
    <Pressable onPress={onToggle} hitSlop={8}>
      <Icon name={visible ? 'eyeOff' : 'eye'} size={20} color={T.muted} />
    </Pressable>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader
        title={REGISTRATION_STEPS.password.title}
        onBack={() => navigation.goBack()}
      />
      <Text style={styles.subHeader}>{REGISTRATION_STEPS.password.subHeader}</Text>
      <View style={styles.progressWrap}>
        <ProgressBar
          value={REGISTRATION_STEPS.password.index}
          max={REGISTRATION_TOTAL_STEPS}
          height={4}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <AppLogo variant="mark" size={44} style={styles.logo} />

        <View style={styles.form}>
          <FormErrorsBanner errorCount={submitAttempted ? Object.keys(errors).length : 0} />

          <View>
            <View style={styles.passwordHeader}>
              <Text style={styles.fieldLabel}>Пароль</Text>
              <Pressable onPress={handleGeneratePassword} hitSlop={8}>
                <Text style={styles.generateLink}>Сгенерировать</Text>
              </Pressable>
            </View>
            <TextField
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              secureTextEntry={!showPassword}
              error={submitAttempted ? errors.password : undefined}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              {...getPasswordAutofillProps('register-new')}
              passwordRules={Platform.OS === 'ios' ? IOS_PASSWORD_RULES : undefined}
              suffix={passwordToggle(showPassword, () => setShowPassword((v) => !v))}
            />
          </View>

          <TextField
            label="Повторите пароль"
            value={confirm}
            onChangeText={(value) => {
              setConfirm(value);
              if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: undefined }));
            }}
            secureTextEntry={!showConfirmPassword}
            error={submitAttempted ? errors.confirm : undefined}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            importantForAutofill="no"
            suffix={passwordToggle(showConfirmPassword, () => setShowConfirmPassword((v) => !v))}
          />

          <View style={styles.rules}>
            <PassRule met={rules.minLength}>Не менее 8 символов</PassRule>
            <PassRule met={rules.hasUpper}>Заглавная буква</PassRule>
            <PassRule met={rules.hasDigit}>Цифра</PassRule>
            <PassRule met={rules.hasSpecial}>Спецсимвол</PassRule>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          kind="primary"
          size="lg"
          full
          iconRight="arrowR"
          onPress={handleContinue}
        >
          Далее
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
  logo: {
    marginBottom: 8,
  },
  form: {
    paddingHorizontal: 20,
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
  generateLink: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primary,
  },
  rules: {
    gap: 8,
    marginTop: 4,
  },
  error: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
    backgroundColor: T.bg,
  },
});
