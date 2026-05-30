import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getErrorMessage } from '../../api/errors';
import {
  getMaterialRefundObligation,
  getMaterialRefundPayments,
  RefundPaymentPreview,
} from '../../api/refunds';
import { RefundObligation } from '../../api/integrationTypes';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { ProgressBar } from '../../components/ProgressBar';
import { ScreenHeader } from '../../components/ScreenHeader';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useFeedback } from '../../providers/FeedbackProvider';
import { formatKopeks } from './detail/detailHelpers';
import { RADIUS, T } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'BeneficiaryRefundObligation'>;

function formatPaymentWhen(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BeneficiaryRefundObligationScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { showError } = useFeedback();
  const { helpRequestId, title, receivedKopeks, confirmedKopeks } = route.params;

  const [loading, setLoading] = useState(true);
  const [obligation, setObligation] = useState<RefundObligation | null>(null);
  const [payments, setPayments] = useState<RefundPaymentPreview[]>([]);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rawObligation = await getMaterialRefundObligation(helpRequestId);
      setObligation(rawObligation);
      setPayments(await getMaterialRefundPayments(helpRequestId, rawObligation));
    } catch (err) {
      showError(getErrorMessage(err, 'Не удалось загрузить обязательство'));
    } finally {
      setLoading(false);
    }
  }, [helpRequestId, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const view = obligation;

  const received = receivedKopeks ?? 0;
  const confirmed = confirmedKopeks ?? 0;
  const isClosed = (view?.remaining_kopeks ?? 0) <= 0;
  const required = view?.required_kopeks ?? 0;
  const returned = view?.returned_kopeks ?? 0;
  const remaining = view?.remaining_kopeks ?? 0;
  const progress = required > 0 ? (returned / required) * 100 : 0;

  const visiblePayments = useMemo(() => {
    if (isClosed) return payments;
    return payments.filter((payment) => payment.amount_kopeks <= returned);
  }, [isClosed, payments, returned]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader
        title="Возврат средств"
        subtitle={title ? `«${title}»` : undefined}
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={T.primary} size="large" />
        </View>
      ) : !view ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Обязательство не найдено</Text>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.statusCard,
                {
                  backgroundColor: isClosed ? T.successSoft : T.dangerSoft,
                  borderColor: `${isClosed ? T.success : T.danger}22`,
                },
              ]}
            >
              <View style={styles.statusRow}>
                <View style={styles.statusIconWrap}>
                  <Icon
                    name={isClosed ? 'check' : 'warn'}
                    size={20}
                    color={isClosed ? T.success : T.danger}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.statusBody}>
                  <Text style={[styles.statusTitle, { color: isClosed ? T.success : T.danger }]}>
                    {isClosed ? 'Обязательство закрыто' : 'Нужно вернуть остаток'}
                  </Text>
                  <Text
                    style={[
                      styles.statusText,
                      { color: isClosed ? '#3D6940' : T.danger },
                    ]}
                  >
                    Партнёр подтвердил расходы на {formatKopeks(confirmed)} из {formatKopeks(received)}.
                    Разница — нецелевой остаток, который нужно вернуть.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Баланс возврата</Text>
              <View style={styles.balanceGrid}>
                <BalanceCell label="Всего к возврату" value={formatKopeks(required)} />
                <BalanceCell label="Возвращено" value={formatKopeks(returned)} accent />
                <BalanceCell
                  label="Осталось"
                  value={formatKopeks(remaining)}
                  danger={!isClosed}
                  accent={isClosed}
                  highlight
                />
              </View>
              <ProgressBar
                value={progress}
                color={isClosed ? T.success : T.danger}
                bg={T.surface2}
                height={8}
              />
              <View style={styles.progressMeta}>
                <Text style={styles.progressMetaText}>{Math.round(progress)}% возвращено</Text>
                <Text style={styles.progressMetaText}>
                  {isClosed ? 'закрыто' : 'можно частями'}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>История платежей</Text>
            <View style={styles.paymentsCard}>
              {visiblePayments.length === 0 ? (
                <Text style={styles.paymentsEmpty}>Платежей пока нет</Text>
              ) : (
                visiblePayments.map((payment, index) => (
                  <View
                    key={payment.id}
                    style={[
                      styles.paymentRow,
                      index < visiblePayments.length - 1 && styles.paymentRowBorder,
                    ]}
                  >
                    <View style={styles.paymentIcon}>
                      <Icon name="check" size={16} color={T.success} strokeWidth={2.4} />
                    </View>
                    <View style={styles.paymentBody}>
                      <Text style={styles.paymentTitle}>
                        Платёж #{visiblePayments.length - index}
                      </Text>
                      <Text style={styles.paymentMeta}>{formatPaymentWhen(payment.created_at)}</Text>
                    </View>
                    <Text style={styles.paymentAmount}>−{formatKopeks(payment.amount_kopeks)}</Text>
                  </View>
                ))
              )}
            </View>

            {!isClosed ? (
              <View style={styles.deadlineCard}>
                <Icon name="clock" size={18} color="#8B5E10" strokeWidth={2} />
                <Text style={styles.deadlineText}>
                  <Text style={styles.deadlineBold}>Срок возврата</Text>
                  {' — до 28 июня. Можно платить частями любым удобным способом.'}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          {!isClosed ? (
            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
              <Button
                kind="primary"
                size="lg"
                full
                iconRight="arrowR"
                onPress={() =>
                  navigation.navigate('BeneficiaryRefundPayment', {
                    helpRequestId,
                    title,
                    remainingKopeks: remaining,
                    requiredKopeks: required,
                    returnedKopeks: returned,
                    paymentsCount: visiblePayments.length,
                  })
                }
              >
                Вернуть {formatKopeks(remaining)}
              </Button>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

function BalanceCell({
  label,
  value,
  accent,
  danger,
  highlight,
}: {
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.balanceCell, highlight && styles.balanceCellHighlight]}>
      <Text style={styles.balanceHint}>{label}</Text>
      <Text
        style={[
          styles.balanceValue,
          accent && { color: T.success },
          danger && { color: T.danger },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
    textAlign: 'center',
  },
  devPickerWrap: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14,
  },
  statusCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 14,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBody: {
    flex: 1,
    minWidth: 0,
  },
  statusTitle: {
    fontSize: 15,
    fontFamily: 'Manrope_800ExtraBold',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    lineHeight: 18,
    marginTop: 3,
    opacity: 0.9,
  },
  balanceCard: {
    backgroundColor: T.surface,
    borderRadius: RADIUS.md,
    padding: 16,
  },
  balanceLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  balanceGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  balanceCell: {
    flex: 1,
    padding: 4,
  },
  balanceCellHighlight: {
    backgroundColor: T.surface2,
    borderRadius: 10,
    padding: 10,
  },
  balanceHint: {
    fontSize: 10,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
    lineHeight: 14,
  },
  balanceValue: {
    fontSize: 15,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    marginTop: 4,
    letterSpacing: -0.2,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressMetaText: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  paymentsCard: {
    backgroundColor: T.surface,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  paymentsEmpty: {
    padding: 16,
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    textAlign: 'center',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  paymentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  paymentIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: T.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentBody: {
    flex: 1,
    minWidth: 0,
  },
  paymentTitle: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  paymentMeta: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: 15,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.success,
    letterSpacing: -0.2,
  },
  deadlineCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: T.warningSoft,
    borderRadius: 12,
    padding: 12,
  },
  deadlineText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: '#7A5210',
    lineHeight: 18,
  },
  deadlineBold: {
    fontFamily: 'Manrope_700Bold',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
    backgroundColor: T.bg,
  },
});
