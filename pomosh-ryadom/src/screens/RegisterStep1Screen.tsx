import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Button } from '../components/Button';
import { FormErrorsBanner } from '../components/feedback/FormErrorsBanner';
import { GenderChoice, genderFromChoice } from '../components/GenderChoice';
import { Icon } from '../components/Icon';
import { ProgressBar } from '../components/ProgressBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { TextField } from '../components/TextField';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  REGISTRATION_STEPS,
  REGISTRATION_TOTAL_STEPS,
} from '../navigation/registrationProgress';
import { T, RADIUS } from '../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RegisterStep1'>;
  route: RouteProp<RootStackParamList, 'RegisterStep1'>;
};

type GenderChoiceId = 'female' | 'male' | 'unspecified';

export function RegisterStep1Screen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [genderChoice, setGenderChoice] = useState<GenderChoiceId>('female');
  const [errors, setErrors] = useState<{ lastName?: string; firstName?: string }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const handleContinue = () => {
    setSubmitAttempted(true);
    const nextErrors: { lastName?: string; firstName?: string } = {};

    if (!lastName.trim() || lastName.trim().length < 2) {
      nextErrors.lastName = 'Укажите фамилию';
    }
    if (!firstName.trim() || firstName.trim().length < 2) {
      nextErrors.firstName = 'Укажите имя';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    navigation.navigate('RegisterStep2', {
      role: route.params.role,
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      gender: genderFromChoice(genderChoice),
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader
        title={REGISTRATION_STEPS.profile.title}
        onBack={() => navigation.goBack()}
      />
      <Text style={styles.subHeader}>{REGISTRATION_STEPS.profile.subHeader}</Text>
      <View style={styles.progressWrap}>
        <ProgressBar
          value={REGISTRATION_STEPS.profile.index}
          max={REGISTRATION_TOTAL_STEPS}
          height={4}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <FormErrorsBanner errorCount={submitAttempted ? Object.keys(errors).length : 0} />

          <TextField
            label="Фамилия"
            value={lastName}
            onChangeText={(value) => {
              setLastName(value);
              if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
            }}
            error={submitAttempted ? errors.lastName : undefined}
            autoCapitalize="words"
          />
          <TextField
            label="Имя"
            value={firstName}
            onChangeText={(value) => {
              setFirstName(value);
              if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
            }}
            error={submitAttempted ? errors.firstName : undefined}
            autoCapitalize="words"
          />
          <TextField
            label="Отчество"
            value={middleName}
            onChangeText={setMiddleName}
            placeholder="по желанию"
            autoCapitalize="words"
          />

          <View>
            <Text style={styles.fieldLabel}>Пол</Text>
            <View style={styles.genderRow}>
              <GenderChoice
                label="Женский"
                icon="user"
                active={genderChoice === 'female'}
                onPress={() => setGenderChoice('female')}
              />
              <GenderChoice
                label="Мужской"
                icon="user"
                active={genderChoice === 'male'}
                onPress={() => setGenderChoice('male')}
              />
              <GenderChoice
                label="Не указывать"
                icon="close"
                active={genderChoice === 'unspecified'}
                onPress={() => setGenderChoice('unspecified')}
              />
            </View>
          </View>

          <View style={styles.infoBox}>
            <Icon name="info" size={20} color={T.primary} strokeWidth={2} />
            <Text style={styles.infoText}>
              Эти данные будут проверены на этапе верификации — указывайте, как в паспорте.
            </Text>
          </View>

        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button kind="primary" size="lg" full iconRight="arrowR" onPress={handleContinue}>
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
  form: {
    paddingHorizontal: 20,
    gap: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: T.primarySoft,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.primaryDark,
    lineHeight: 18,
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
