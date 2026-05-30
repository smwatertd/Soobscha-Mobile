import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { OnboardingGuideIllustration } from '../components/onboarding/OnboardingGuideIllustration';
import { VOLUNTEER_ONBOARDING_SLIDES } from '../constants/volunteerOnboardingSlides';
import { RootStackParamList } from '../navigation/AppNavigator';
import { RADIUS, T } from '../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VolunteerOnboardingGuide'>;
};

export function VolunteerOnboardingGuideScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [stepIndex, setStepIndex] = useState(0);
  const slide = VOLUNTEER_ONBOARDING_SLIDES[stepIndex];
  const isLast = stepIndex === VOLUNTEER_ONBOARDING_SLIDES.length - 1;

  const finishGuide = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'VolunteerMain' }],
    });
  };

  const handleNext = () => {
    if (isLast) {
      finishGuide();
      return;
    }
    setStepIndex((current) => current + 1);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />

      <View style={styles.skipRow}>
        <Pressable onPress={finishGuide} hitSlop={8} style={styles.skipBtn}>
          <Text style={styles.skipText}>Пропустить</Text>
        </Pressable>
      </View>

      <View style={styles.illuWrap}>
        <OnboardingGuideIllustration variant={slide.illu} color={slide.color} bg={slide.bg} />
      </View>

      <View style={styles.copy}>
        <View style={[styles.tag, { backgroundColor: slide.bg }]}>
          <Text style={[styles.tagText, { color: slide.color }]}>{slide.tag}</Text>
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>

      <View style={styles.dots}>
        {VOLUNTEER_ONBOARDING_SLIDES.map((item, index) => {
          const active = index === stepIndex;
          return (
            <View
              key={item.tag}
              style={[
                styles.dot,
                active && { width: 22, backgroundColor: slide.color },
                !active && styles.dotInactive,
              ]}
            />
          );
        })}
      </View>

      <View style={styles.footer}>
        <Button
          kind="primary"
          size="lg"
          full
          iconRight={isLast ? 'check' : 'arrowR'}
          onPress={handleNext}
          style={{ backgroundColor: slide.color }}
        >
          {isLast ? 'Готово' : 'Далее'}
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
  skipRow: {
    paddingHorizontal: 20,
    paddingTop: 4,
    alignItems: 'flex-end',
  },
  skipBtn: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  illuWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  copy: {
    paddingHorizontal: 28,
    paddingBottom: 12,
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginBottom: 14,
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.7,
    lineHeight: 30,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 14.5,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
  },
  dotInactive: {
    backgroundColor: T.border,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
});
