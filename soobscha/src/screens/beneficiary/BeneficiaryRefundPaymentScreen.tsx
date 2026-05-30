import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getErrorMessage } from '../../api/errors';
import {
  createMaterialRefundPayment,
  getMaterialRefundObligation,
} from '../../api/refunds';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { MoneyAmountInput } from '../../components/beneficiary/create/MoneyAmountInput';
import { Icon, IconName } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useFeedback } from '../../providers/FeedbackProvider';
import { formatKopeks } from './detail/detailHelpers';
import { RADIUS, T } from '../../theme/tokens';

const MIN_RUBLES = 500;
const PRESET_RUBLES = [5_000, 10_000, 20_000, 50_000];

type PaymentMethodId = 'card' | 'sbp';

type PaymentMethodOption = {
  id: PaymentMethodId;
  icon: IconName;
  color: string;
  title: string;
  sub: string;
};

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'card',
    icon: 'wallet',
    color: T.success,
    title: 'Карта •• 4287',
    sub: 'Виртуальная Мир, до 06/28',
  },
  {
    id: 'sbp',
    icon: 'qr',
    color: T.info,
    title: 'СБП',
    sub: 'Перевод через банковское приложение',
  },
];

type Props = NativeStackScreenProps<RootStackParamList, 'BeneficiaryRefundPayment'>;

function createIdempotencyKey(): string {
  return `refund-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatPaymentsCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} платежом`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} платежами`;
  return `${count} платежами`;
}

export function BeneficiaryRefundPaymentScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { showError, showSnack } = useFeedback();
  const { helpRequestId, title, remainingKopeks: remainingParam, requiredKopeks: requiredParam, returnedKopeks: returnedParam, paymentsCount: paymentsCountParam } =
    route.params;

  const [remainingKopeks, setRemainingKopeks] = useState(remainingParam ?? 0);
  const [requiredKopeks, setRequiredKopeks] = useState(requiredParam ?? 0);
  const [returnedKopeks, setReturnedKopeks] = useState(returnedParam ?? 0);
  const [paymentsCount, setPaymentsCount] = useState(paymentsCountParam ?? 0);
  const [amountRubles, setAmountRubles] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>('card');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (remainingParam != null) return;
    try {
      const obligation = await getMaterialRefundObligation(helpRequestId);
      if (!obligation) return;
      setRemainingKopeks(obligation.remaining_kopeks);
      setRequiredKopeks(obligation.required_kopeks);
      setReturnedKopeks(obligation.returned_kopeks);
    } catch (err) {
      showError(getErrorMessage(err, 'Не удалось загрузить обязательство'));
    }
  }, [helpRequestId, remainingParam, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const remainingRubles = Math.round(remainingKopeks / 100);
  const tooMuch = amountRubles * 100 > remainingKopeks;
  const tooSmall = amountRubles > 0 && amountRubles < MIN_RUBLES;
  const canSubmit =
    amountRubles >= MIN_RUBLES && !tooMuch && remainingKopeks > 0 && !submitting;

  const presetAmounts = useMemo(
    () => PRESET_RUBLES.filter((value) => value <= remainingRubles),
    [remainingRubles],
  );

  const summarySub = useMemo(() => {
    const required = requiredKopeks || remainingKopeks + returnedKopeks;
    const countLabel = paymentsCount > 0 ? formatPaymentsCount(paymentsCount) : 'платежами';
    return `Из ${formatKopeks(required)} · вернули ${formatKopeks(returnedKopeks)} ${countLabel}`;
  }, [paymentsCount, remainingKopeks, requiredKopeks, returnedKopeks]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await createMaterialRefundPayment(helpRequestId, {
        amount_kopeks: amountRubles * 100,
        idempotency_key: createIdempotencyKey(),
      });
      showSnack('Платёж отправлен', 'success');
      navigation.goBack();
    } catch (err) {
      showError(getErrorMessage(err, 'Не удалось отправить платёж'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader
        title="Платёж по обязательству"
        subtitle={title ? `«${title}»` : undefined}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Осталось вернуть</Text>
          <Text style={styles.summaryValue}>{formatKopeks(remainingKopeks)}</Text>
          <Text style={styles.summarySub}>{summarySub}</Text>
        </View>

        <Text style={styles.fieldLabel}>Сумма платежа</Text>
        <MoneyAmountInput
          valueRubles={amountRubles}
          onChangeRubles={setAmountRubles}
          maxRubles={remainingRubles}
        />
        <View style={styles.amountMeta}>
          <Text style={[styles.amountHint, (tooMuch || tooSmall) && styles.amountHintError]}>
            {tooMuch
              ? `Максимум — ${formatKopeks(remainingKopeks)}`
              : tooSmall
                ? `Минимум — ${MIN_RUBLES.toLocaleString('ru-RU')} ₽`
                : `Можно частями · мин. ${MIN_RUBLES.toLocaleString('ru-RU')} ₽`}
          </Text>
          <Pressable onPress={() => setAmountRubles(remainingRubles)} hitSlop={8}>
            <Text style={styles.amountAction}>Вернуть всё</Text>
          </Pressable>
        </View>

        {presetAmounts.length > 0 ? (
          <View style={styles.presetsRow}>
            {presetAmounts.map((preset) => (
              <Chip
                key={preset}
                label={`${preset.toLocaleString('ru-RU')} ₽`}
                size="md"
                active={amountRubles === preset}
                onPress={() => setAmountRubles(preset)}
              />
            ))}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Способ оплаты</Text>
        <View style={styles.methods}>
          {PAYMENT_METHODS.map((method) => {
            const active = method.id === selectedMethod;
            return (
              <Pressable
                key={method.id}
                style={[styles.methodCard, active && styles.methodCardActive]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View style={[styles.methodIcon, { backgroundColor: `${method.color}18` }]}>
                  <Icon name={method.icon} size={20} color={method.color} strokeWidth={2} />
                </View>
                <View style={styles.methodBody}>
                  <Text style={styles.methodTitle}>{method.title}</Text>
                  <Text style={styles.methodSub}>{method.sub}</Text>
                </View>
                <View style={[styles.methodRadio, active && styles.methodRadioActive]}>
                  {active ? <Icon name="check" size={14} color="#fff" strokeWidth={3} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          kind="primary"
          size="lg"
          full
          iconRight="arrowR"
          disabled={!canSubmit}
          onPress={() => void handleSubmit()}
        >
          {submitting ? 'Отправка…' : `Вернуть ${formatKopeks(amountRubles * 100)}`}
        </Button>
        <Text style={styles.footerHint}>
          Платежи проходят через безопасный шлюз. После платежа обновится «Осталось вернуть».
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14,
  },
  summaryCard: {
    backgroundColor: T.dangerSoft,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.danger,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.danger,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  summarySub: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.danger,
    opacity: 0.85,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  amountMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -6,
  },
  amountHint: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  amountHintError: {
    color: T.danger,
  },
  amountAction: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: T.primary,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -4,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    letterSpacing: -0.2,
    marginTop: 4,
  },
  methods: {
    gap: 8,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: T.surface,
    borderWidth: 1.5,
    borderColor: T.borderSoft,
  },
  methodCardActive: {
    borderColor: T.accent,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodBody: {
    flex: 1,
    minWidth: 0,
  },
  methodTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  methodSub: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 2,
  },
  methodRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodRadioActive: {
    backgroundColor: T.accent,
    borderColor: T.accent,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
    backgroundColor: T.bg,
  },
  footerHint: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
});
