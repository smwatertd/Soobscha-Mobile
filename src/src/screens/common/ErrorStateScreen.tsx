import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import {
  ErrorStateVariant,
  getErrorStateConfig,
} from '../../constants/errorStateVariants';
import { RADIUS, T, shadowSm } from '../../theme/tokens';
import { formatMoneyRub } from '../../utils/formatMoney';

type Props = {
  variant?: ErrorStateVariant;
  requestId?: string;
  paymentAmountRub?: number;
  onBack?: () => void;
  onPrimary?: () => void;
  onSecondary?: () => void;
};

export function ErrorStateScreen({
  variant = 'network',
  requestId,
  paymentAmountRub,
  onBack,
  onPrimary,
  onSecondary,
}: Props) {
  const insets = useSafeAreaInsets();
  const config = getErrorStateConfig(variant);

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <StatusBar style="dark" />
      {onBack ? <ScreenHeader title="" onBack={onBack} transparent /> : null}

      <View style={styles.body}>
        <View style={[styles.iconCircle, { backgroundColor: config.iconBg }]}>
          <Icon name={config.icon} size={48} color={config.iconColor} strokeWidth={2} />
        </View>

        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.message}>{config.message}</Text>

        {requestId && variant === 'server' ? (
          <View style={styles.requestIdBox}>
            <Text style={styles.requestIdText}>request_id: {requestId.slice(0, 18)}…</Text>
          </View>
        ) : null}

        {variant === 'payment-failed' ? (
          <View style={[styles.paymentCard, shadowSm]}>
            {paymentAmountRub ? (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Сумма</Text>
                <Text style={styles.paymentValue}>{formatMoneyRub(paymentAmountRub)}</Text>
              </View>
            ) : null}
            <View style={[styles.paymentRow, paymentAmountRub ? styles.paymentRowBorder : null]}>
              <Text style={styles.paymentLabel}>Карта</Text>
              <Text style={styles.paymentValue}>Виртуальная Мир •• 4287</Text>
            </View>
            <View style={[styles.paymentRow, styles.paymentRowBorder]}>
              <Text style={styles.paymentLabel}>Код банка</Text>
              <Text style={styles.paymentErrorValue}>05 · Do not honor</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button kind="primary" size="lg" full onPress={onPrimary ?? onBack}>
            {config.primaryLabel}
          </Button>
          {config.secondaryLabel ? (
            <Button kind="ghost" size="md" full onPress={onSecondary ?? onBack}>
              {config.secondaryLabel}
            </Button>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 18,
  },
  requestIdBox: {
    backgroundColor: T.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: T.borderSoft,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  requestIdText: {
    fontSize: 11,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
  },
  paymentCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: T.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentRowBorder: {
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
    borderStyle: 'dashed',
  },
  paymentLabel: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  paymentValue: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  paymentErrorValue: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.danger,
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    gap: 10,
  },
});
