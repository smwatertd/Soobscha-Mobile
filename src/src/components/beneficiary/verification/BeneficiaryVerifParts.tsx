import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../Button';
import { Icon, IconName } from '../../Icon';
import { ScreenHeader } from '../../ScreenHeader';
import { BeneficiaryVerifCategoryOption } from '../../../screens/beneficiary/verification/beneficiaryVerificationConfig';
import { RADIUS, T, CARD_BG } from '../../../theme/tokens';

export function BeneficiaryVerifStepDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.stepRow}>
      {Array.from({ length: total }, (_, index) => {
        const done = index < step - 1;
        const current = index === step - 1;
        return (
          <View
            key={index}
            style={[
              styles.stepSegment,
              done && styles.stepSegmentDone,
              current && styles.stepSegmentActive,
            ]}
          />
        );
      })}
      <Text style={styles.stepCounter}>
        {step}/{total}
      </Text>
    </View>
  );
}

export function BeneficiaryVerifStepLayout({
  title,
  subtitle,
  step,
  total,
  onBack,
  onNext,
  nextLabel = 'Далее',
  nextIcon = 'arrowR',
  nextDisabled = false,
  nextLoading = false,
  backLabel = 'Назад',
  children,
  contentStyle,
}: {
  title: string;
  subtitle?: string;
  step: number;
  total: number;
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextIcon?: IconName;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  backLabel?: string;
  children: ReactNode;
  contentStyle?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();
  const footerSpace = insets.bottom + 120;

  return (
    <View style={[styles.layoutRoot, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader title={title} onBack={onBack} />
      {subtitle ? <Text style={styles.layoutSubtitle}>{subtitle}</Text> : null}
      <BeneficiaryVerifStepDots step={step} total={total} />

      <ScrollView
        style={styles.layoutScroll}
        contentContainerStyle={[styles.layoutScrollContent, contentStyle, { paddingBottom: footerSpace }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      <View style={[styles.layoutFooter, { paddingBottom: insets.bottom + 12 }]}>
        <Button kind="ghost" size="lg" icon="chevL" onPress={onBack} style={styles.layoutFooterBack}>
          {backLabel}
        </Button>
        {onNext ? (
          <Button
            kind="accent"
            size="lg"
            iconRight={nextLoading ? undefined : nextIcon}
            style={styles.layoutFooterPrimary}
            onPress={onNext}
            disabled={nextDisabled || nextLoading}
          >
            {nextLoading ? 'Отправка…' : nextLabel}
          </Button>
        ) : null}
      </View>
    </View>
  );
}

export function BeneficiaryVerifInfoBanner({
  text,
  icon = 'info',
  tone = 'accent',
}: {
  text: string;
  icon?: IconName;
  tone?: 'accent' | 'warning' | 'info';
}) {
  const palette =
    tone === 'warning'
      ? { bg: T.warningSoft, color: '#8B5E10', text: '#7A5210' }
      : tone === 'info'
        ? { bg: T.infoSoft, color: T.info, text: T.ink2 }
        : { bg: T.accentSoft, color: T.accentDark, text: '#7A4F1A' };

  return (
    <View style={styles.infoBanner}>
      <Icon name={icon} size={18} color={palette.color} strokeWidth={2} />
      <Text style={[styles.infoBannerText, { color: palette.text }]}>{text}</Text>
    </View>
  );
}

export function BeneficiaryVerifSectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function BeneficiaryVerifCategoryCard({
  option,
  selected,
  onPress,
}: {
  option: BeneficiaryVerifCategoryOption;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.categoryCard}>
      {selected ? <View style={[styles.categorySelectedStripe, { backgroundColor: option.color }]} /> : null}
      <View style={styles.categoryTop}>
        <View style={[styles.categoryIcon, { backgroundColor: option.colorBg }]}>
          <Icon name={option.icon} size={22} color={option.color} strokeWidth={1.8} />
        </View>
        <View style={styles.categoryBody}>
          <Text style={styles.categoryTitle}>{option.label}</Text>
          <Text style={styles.categoryDesc}>{option.description}</Text>
        </View>
        <View
          style={[
            styles.radio,
            selected && { backgroundColor: option.color, borderColor: option.color },
          ]}
        >
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
      </View>
      <View style={styles.examples}>
        {option.examples.map((example) => (
          <View
            key={example}
            style={[
              styles.exampleChip,
              { backgroundColor: selected ? option.colorBg : T.surface2 },
            ]}
          >
            <Text style={[styles.exampleText, selected && { color: option.color }]}>{example}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  layoutRoot: {
    flex: 1,
    backgroundColor: T.bg,
  },
  layoutSubtitle: {
    paddingHorizontal: 20,
    paddingTop: 2,
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  stepSegment: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: T.surface2,
  },
  stepSegmentDone: {
    backgroundColor: '#F5D4B3',
  },
  stepSegmentActive: {
    backgroundColor: T.accent,
  },
  stepCounter: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
    marginLeft: 4,
    minWidth: 28,
    textAlign: 'right',
  },
  layoutProgressWrap: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  layoutScroll: {
    flex: 1,
  },
  layoutScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  layoutFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: T.bg,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
  },
  layoutFooterPrimary: {
    flex: 1,
  },
  layoutFooterBack: {
    flexShrink: 0,
    minWidth: 120,
    paddingHorizontal: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    lineHeight: 17,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  categoryCard: {
    backgroundColor: T.bg,
    paddingVertical: 14,
    paddingHorizontal: 0,
    marginBottom: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  categorySelectedStripe: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 2,
  },
  categoryTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBody: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  categoryTitle: {
    fontSize: 15,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    marginBottom: 4,
  },
  categoryDesc: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 17,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  examples: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingLeft: 56,
  },
  exampleChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  exampleText: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
});
