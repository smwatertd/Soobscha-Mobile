import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createMaterialHelpRequestPayout, getHelpRequestById } from '../../api/helpRequests';
import { getErrorMessage } from '../../api/errors';
import { listPayoutMethods, PayoutMethod } from '../../api/payoutMethods';
import { Button } from '../../components/Button';
import { Checkbox } from '../../components/Checkbox';
import { MoneyAmountInput } from '../../components/beneficiary/create/MoneyAmountInput';
import { Icon } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useFeedback } from '../../providers/FeedbackProvider';
import { RADIUS, T } from '../../theme/tokens';
import { formatKopeks, getMaterialAmounts } from './detail/detailHelpers';

type Props = NativeStackScreenProps<RootStackParamList, 'BeneficiaryPayoutRequest'>;

function createIdempotencyKey(): string {
  return `payout-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function BeneficiaryPayoutRequestScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { showError, showSnack } = useFeedback();
  const { helpRequestId, title } = route.params;

  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [requestedKopeks, setRequestedKopeks] = useState(0);
  const [withdrawnKopeks, setWithdrawnKopeks] = useState(0);
  const [availableKopeks, setAvailableKopeks] = useState(0);
  const [amountRubles, setAmountRubles] = useState(0);
  const [confirmed, setConfirmed] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [request, payoutMethods] = await Promise.all([
        getHelpRequestById(helpRequestId),
        listPayoutMethods().catch(() => []),
      ]);
      const { requested, withdrawn, available } = getMaterialAmounts(request);
      const nextAvailable = available > 0 ? available : Math.max(0, requested - withdrawn);
      setRequestedKopeks(requested);
      setWithdrawnKopeks(withdrawn);
      setAvailableKopeks(nextAvailable);
      setMethods(payoutMethods);
      const defaultMethod = payoutMethods.find((item) => item.is_default) ?? payoutMethods[0];
      setSelectedMethodId(defaultMethod?.id ?? null);
    } catch (err) {
      showError(getErrorMessage(err, 'Не удалось загрузить данные для выплаты'));
    }
  }, [helpRequestId, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const tooMuch = amountRubles * 100 > availableKopeks;
  const canSubmit = confirmed && !tooMuch && amountRubles > 0 && selectedMethodId && !submitting;

  const balanceItems = useMemo(
    () => [
      { label: 'Собрано', value: formatKopeks(requestedKopeks), accent: false },
      { label: 'Уже выведено', value: formatKopeks(withdrawnKopeks), accent: false },
      { label: 'Доступно', value: formatKopeks(availableKopeks), accent: true },
    ],
    [availableKopeks, requestedKopeks, withdrawnKopeks],
  );

  const handleSubmit = async () => {
    if (!canSubmit || !selectedMethodId) return;
    setSubmitting(true);
    try {
      await createMaterialHelpRequestPayout(helpRequestId, {
        payout_method_id: selectedMethodId,
        amount_kopeks: amountRubles * 100,
        idempotency_key: createIdempotencyKey(),
      });
      showSnack('Запрос выплаты отправлен', 'success');
      navigation.goBack();
    } catch (err) {
      showError(getErrorMessage(err, 'Не удалось отправить запрос выплаты'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader title="Запрос выплаты" subtitle={title} onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Баланс сбора</Text>
          <View style={styles.balanceRow}>
            {balanceItems.map((item) => (
              <View
                key={item.label}
                style={[styles.balanceCell, item.accent && styles.balanceCellHighlight]}
              >
                <Text style={styles.balanceHint}>{item.label}</Text>
                <Text style={[styles.balanceValue, item.accent && styles.balanceValueAccent]}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.fieldLabel}>Сумма выплаты</Text>
        <MoneyAmountInput valueRubles={amountRubles} onChangeRubles={setAmountRubles} />
        <View style={styles.amountMeta}>
          <Text style={[styles.amountHint, tooMuch && styles.amountHintError]}>
            {tooMuch
              ? `Доступно только ${formatKopeks(availableKopeks)}`
              : `Доступно: ${formatKopeks(availableKopeks)}`}
          </Text>
          <Pressable
            onPress={() => setAmountRubles(Math.round(availableKopeks / 100))}
            hitSlop={8}
          >
            <Text style={styles.amountAction}>Вывести всё</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Куда получить</Text>
          <Text style={styles.sectionAction}>Добавить в профиле</Text>
        </View>

        <View style={styles.methods}>
          {methods.length === 0 ? (
            <View style={styles.emptyMethods}>
              <Text style={styles.emptyMethodsText}>
                Добавьте способ получения в профиле, чтобы запросить выплату.
              </Text>
            </View>
          ) : (
            methods.map((method) => {
              const active = method.id === selectedMethodId;
              return (
                <Pressable
                  key={method.id}
                  style={[styles.methodCard, active && styles.methodCardActive]}
                  onPress={() => setSelectedMethodId(method.id)}
                >
                  <View style={[styles.methodIcon, { backgroundColor: `${T.success}18` }]}>
                    <Icon name="wallet" size={18} color={T.success} strokeWidth={2} />
                  </View>
                  <View style={styles.methodBody}>
                    <Text style={styles.methodTitle}>{method.display_name}</Text>
                    <Text style={styles.methodSub}>
                      {method.is_default ? 'Основная' : method.type}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        <View style={styles.infoBox}>
          <Icon name="info" size={18} color={T.muted} strokeWidth={2} />
          <Text style={styles.infoText}>
            Деньги придут в течение 1–3 банковских дней. После выплаты в течение 30 дней нужно
            прислать отчёт с чеками.
          </Text>
        </View>

        <Checkbox
          checked={confirmed}
          onToggle={() => setConfirmed((prev) => !prev)}
          label="Подтверждаю, что выплата будет потрачена на цель сбора. В течение 30 дней пришлю отчёт с чеками."
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          kind="accent"
          size="lg"
          full
          iconRight="arrowR"
          disabled={!canSubmit}
          onPress={() => void handleSubmit()}
        >
          {submitting ? 'Отправка…' : `Запросить ${formatKopeks(amountRubles * 100)}`}
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14,
  },
  balanceCard: {
    backgroundColor: T.successSoft,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: `${T.success}22`,
    padding: 16,
  },
  balanceLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.success,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  balanceCell: {
    flex: 1,
  },
  balanceCellHighlight: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
  },
  balanceHint: {
    fontSize: 10,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  balanceValue: {
    fontSize: 15,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    marginTop: 4,
  },
  balanceValueAccent: {
    color: T.success,
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
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primary,
  },
  methods: {
    gap: 8,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  methodCardActive: {
    borderColor: T.primary,
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
  emptyMethods: {
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  emptyMethodsText: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 19,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: T.surface2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 17,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
    backgroundColor: T.bg,
  },
});
