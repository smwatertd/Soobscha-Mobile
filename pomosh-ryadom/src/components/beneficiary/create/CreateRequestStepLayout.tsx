import { StatusBar } from 'expo-status-bar';
import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../Button';
import { FormErrorsBanner } from '../../feedback/FormErrorsBanner';
import { ProgressBar } from '../../ProgressBar';
import { ScreenHeader } from '../../ScreenHeader';
import {
  MATERIAL_CREATE_REQUEST_STEPS,
  SOCIAL_CREATE_REQUEST_STEPS,
} from '../../../navigation/createHelpRequestTypes';
import { useFeedback } from '../../../providers/FeedbackProvider';
import { T } from '../../../theme/tokens';

type ConfirmDiscard = {
  hasChanges: boolean;
  title?: string;
  message?: string;
};

type Props = {
  title: string;
  step: number;
  stepHint?: string;
  variant?: 'social' | 'material';
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextIcon?: 'arrowR' | 'check';
  nextDisabled?: boolean;
  backLabel?: string;
  formErrorCount?: number;
  confirmDiscard?: ConfirmDiscard;
  children: ReactNode;
  contentStyle?: ViewStyle;
};

export function CreateRequestStepLayout({
  title,
  step,
  stepHint,
  variant = 'social',
  onBack,
  onNext,
  nextLabel = 'Далее',
  nextIcon = 'arrowR',
  nextDisabled,
  backLabel = 'Назад',
  formErrorCount = 0,
  confirmDiscard,
  children,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();
  const { showConfirm } = useFeedback();
  const totalSteps = variant === 'material' ? MATERIAL_CREATE_REQUEST_STEPS : SOCIAL_CREATE_REQUEST_STEPS;
  const accentColor = formErrorCount > 0 ? T.danger : variant === 'material' ? T.accent : T.primary;
  const nextKind = variant === 'material' ? 'accent' : 'primary';

  const handleBack = () => {
    if (confirmDiscard?.hasChanges) {
      showConfirm({
        title: confirmDiscard.title ?? 'Выйти без сохранения?',
        message: confirmDiscard.message ?? 'Введённые данные будут потеряны.',
        confirmLabel: 'Выйти',
        cancelLabel: 'Остаться',
        destructive: true,
        onConfirm: onBack,
      });
      return;
    }
    onBack();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader title={title} onBack={handleBack} />
      <Text style={styles.subHeader}>
        Шаг {step} из {totalSteps}
        {stepHint ? ` · ${stepHint}` : ''}
      </Text>
      <View style={styles.progressWrap}>
        <ProgressBar value={step} max={totalSteps} height={4} color={accentColor} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, contentStyle, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FormErrorsBanner errorCount={formErrorCount} />
        {children}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button kind="ghost" size="lg" onPress={handleBack}>
          {backLabel}
        </Button>
        {onNext && (
          <Button
            kind={nextKind}
            size="lg"
            iconRight={nextIcon}
            style={styles.footerPrimary}
            onPress={onNext}
            disabled={nextDisabled}
          >
            {nextLabel}
          </Button>
        )}
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
  scrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
    backgroundColor: T.bg,
  },
  footerPrimary: {
    flex: 1,
  },
});
