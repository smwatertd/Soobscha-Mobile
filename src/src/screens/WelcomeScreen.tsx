import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { AppLogo } from '../components/AppLogo';
import { T } from '../theme/tokens';

type Props = {
  onStart: () => void;
  onLogin: () => void;
};

export function WelcomeScreen({ onStart, onLogin }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[T.primary, T.primaryDark]}
      style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 28 }]}
    >
      <StatusBar style="light" />

      <View style={styles.decorTop} />
      <View style={styles.decorTopRight} />
      <View style={styles.decorBottom} />

      <AppLogo variant="pill" size={64} style={styles.brandPill} />

      <View style={styles.spacer} />

      <View style={styles.bottom}>
        <Text style={styles.headline}>
          Доброе дело{'\n'}в одно касание
        </Text>
        <Text style={styles.subtitle}>
          Платформа, которая соединяет людей, готовых помогать, и тех, кому помощь нужна сейчас.
        </Text>
        <Button kind="accent" size="lg" full iconRight="arrowR" onPress={onStart} style={styles.startBtn}>
          Начать
        </Button>
        <Button
          kind="ghost"
          size="lg"
          full
          labelColor="#fff"
          onPress={onLogin}
          style={styles.loginBtn}
        >
          Уже есть аккаунт
        </Button>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 28,
    overflow: 'hidden',
  },
  decorTop: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: T.accent,
    opacity: 0.18,
  },
  decorTopRight: {
    position: 'absolute',
    top: 80,
    right: -110,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#fff',
    opacity: 0.06,
  },
  decorBottom: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: T.accent,
    opacity: 0.12,
  },
  brandPill: {
    zIndex: 1,
    marginTop: 30,
  },
  spacer: {
    flex: 1,
  },
  bottom: {
    zIndex: 1,
  },
  headline: {
    fontSize: 38,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#fff',
    lineHeight: 40,
    letterSpacing: -1.2,
    marginBottom: 18,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Manrope_400Regular',
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 24,
    marginBottom: 36,
    maxWidth: 290,
  },
  startBtn: {
    marginBottom: 12,
  },
  loginBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});
