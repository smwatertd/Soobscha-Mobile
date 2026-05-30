import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { RoleCard } from '../components/RoleCard';
import { RegistrationRole } from '../api/types';
import {
  REGISTRATION_STEPS,
  REGISTRATION_TOTAL_STEPS,
  registrationStepLabel,
} from '../navigation/registrationProgress';
import { ProgressBar } from '../components/ProgressBar';
import { T } from '../theme/tokens';

type Role = RegistrationRole;

type Props = {
  onContinue: (role: Role) => void;
};

export function RoleSelectScreen({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<Role>('volunteer');

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.step}>{registrationStepLabel('role')}</Text>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar value={REGISTRATION_STEPS.role.index} max={REGISTRATION_TOTAL_STEPS} height={4} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>
          С чего хотите{'\n'}начать?
        </Text>
        <Text style={styles.subtitle}>Можно поменять позже в настройках профиля.</Text>

        <RoleCard
          icon="handshake"
          color={T.primary}
          colorBg={T.primarySoft}
          title="Я хочу помогать"
          desc="Откликайтесь на заявки, жертвуйте средства и присоединяйтесь к волонтёрским встречам."
          tag="Волонтёр"
          selected={role === 'volunteer'}
          onPress={() => setRole('volunteer')}
        />

        <View style={styles.gap} />

        <RoleCard
          icon="heart"
          color={T.accent}
          colorBg={T.accentSoft}
          title="Мне нужна помощь"
          desc="Опубликуйте заявку — материальный сбор или приглашение волонтёров на встречу."
          tag="Благополучатель"
          selected={role === 'beneficiary'}
          onPress={() => setRole('beneficiary')}
        />

        <View style={styles.spacer} />

        <Button kind="primary" size="lg" full iconRight="arrowR" onPress={() => onContinue(role)}>
          Продолжить
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerSpacer: {
    flex: 1,
  },
  progressWrap: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  step: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.8,
    lineHeight: 32,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 22,
    marginBottom: 28,
  },
  gap: {
    height: 12,
  },
  spacer: {
    flex: 1,
  },
});
