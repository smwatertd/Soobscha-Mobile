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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { getHelpRequestById } from '../../api/helpRequests';
import { getErrorMessage } from '../../api/errors';
import { getMaterialPayouts, MaterialHelpRequestPayout } from '../../api/payouts';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Icon } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useFeedback } from '../../providers/FeedbackProvider';
import {
  formatDonationWhen,
  formatKopeks,
  formatPayoutsCount,
  getMaterialAmounts,
  getPayoutMethodIcon,
  getPayoutStatusMeta,
} from './detail/detailHelpers';
import { RADIUS, T } from '../../theme/tokens';

type PayoutFilter = 'new' | 'large' | 'processing';

const PAGE_SIZE = 9;
const LOAD_MORE_STEP = 20;

const FILTER_CHIPS: { id: PayoutFilter; label: string }[] = [
  { id: 'new', label: 'Новые' },
  { id: 'large', label: 'Крупные' },
  { id: 'processing', label: 'В обработке' },
];

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BeneficiaryPayoutsList'>;
  route: RouteProp<RootStackParamList, 'BeneficiaryPayoutsList'>;
};

function isProcessingStatus(status: string): boolean {
  return status === 'REQUESTED' || status === 'PROCESSING';
}

function getMethodLabel(payout: MaterialHelpRequestPayout): string {
  return payout.payout_method?.display_name ?? 'Способ выплаты';
}

export function BeneficiaryPayoutsListScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { helpRequestId, payoutsCount: payoutsCountParam, withdrawnKopeks: withdrawnParam } =
    route.params;
  const { showError } = useFeedback();

  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<MaterialHelpRequestPayout[]>([]);
  const [payoutsCount, setPayoutsCount] = useState(payoutsCountParam ?? 0);
  const [withdrawnKopeks, setWithdrawnKopeks] = useState(withdrawnParam ?? 0);
  const [filter, setFilter] = useState<PayoutFilter>('new');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [items, request] = await Promise.all([
        getMaterialPayouts(helpRequestId),
        getHelpRequestById(helpRequestId),
      ]);
      setPayouts(items);
      const { withdrawn } = getMaterialAmounts(request);
      setWithdrawnKopeks(withdrawnParam ?? withdrawn);
      setPayoutsCount(payoutsCountParam ?? items.length);
    } catch (err) {
      showError(getErrorMessage(err, 'Не удалось загрузить выплаты'));
    } finally {
      setLoading(false);
    }
  }, [helpRequestId, payoutsCountParam, showError, withdrawnParam]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter]);

  const filteredPayouts = useMemo(() => {
    let list = [...payouts];
    if (filter === 'processing') {
      list = list.filter((item) => isProcessingStatus(item.status));
    }
    if (filter === 'large') {
      list.sort((a, b) => b.amount_kopeks - a.amount_kopeks);
    } else {
      list.sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
      );
    }
    return list;
  }, [payouts, filter]);

  const visiblePayouts = filteredPayouts.slice(0, visibleCount);
  const remainingCount = filteredPayouts.length - visiblePayouts.length;
  const headerSubtitle = `${formatPayoutsCount(payoutsCount)} · ${formatKopeks(withdrawnKopeks)} выведено`;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader
        title="Все выплаты"
        subtitle={headerSubtitle}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        style={styles.filtersScroll}
      >
        {FILTER_CHIPS.map((chip) => (
          <Chip
            key={chip.id}
            label={chip.label}
            size="sm"
            active={filter === chip.id}
            onPress={() => setFilter(chip.id)}
          />
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={T.primary} size="large" />
        </View>
      ) : filteredPayouts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            {filter === 'processing' ? 'Нет выплат в обработке' : 'Пока нет выплат'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {visiblePayouts.map((payout, index) => {
            const status = getPayoutStatusMeta(payout.status);
            const methodIcon = getPayoutMethodIcon(payout.payout_method?.type);
            const when = formatDonationWhen(payout.created_at);
            return (
              <View
                key={payout.id}
                style={[
                  styles.payoutRow,
                  index < visiblePayouts.length - 1 && styles.payoutRowBorder,
                ]}
              >
                <View style={styles.methodIcon}>
                  <Icon name={methodIcon} size={18} color={T.success} strokeWidth={2} />
                </View>
                <View style={styles.payoutBody}>
                  <View style={styles.payoutTop}>
                    <Text style={styles.payoutMethod} numberOfLines={1}>
                      {getMethodLabel(payout)}
                    </Text>
                    <Text style={styles.payoutAmount}>−{formatKopeks(payout.amount_kopeks)}</Text>
                  </View>
                  {when ? <Text style={styles.payoutWhen}>{when}</Text> : null}
                  <View style={styles.statusRow}>
                    <Chip size="sm" kind={status.kind} label={status.label} />
                  </View>
                </View>
              </View>
            );
          })}

          {remainingCount > 0 ? (
            <View style={styles.loadMoreWrap}>
              <Button kind="ghost" size="md" onPress={() => setVisibleCount((n) => n + LOAD_MORE_STEP)}>
                Загрузить ещё {remainingCount}
              </Button>
            </View>
          ) : null}
        </ScrollView>
      )}
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
  filtersScroll: {
    flexGrow: 0,
    marginBottom: 4,
  },
  filtersRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
  },
  payoutRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${T.success}18`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  payoutBody: {
    flex: 1,
    minWidth: 0,
  },
  payoutTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 6,
  },
  payoutMethod: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  payoutAmount: {
    fontSize: 15,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.2,
  },
  payoutWhen: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 3,
  },
  statusRow: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  loadMoreWrap: {
    marginTop: 18,
    alignItems: 'center',
  },
});
