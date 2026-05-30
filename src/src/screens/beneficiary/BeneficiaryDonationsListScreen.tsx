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
import { DonationWithDonor, getMaterialDonations } from '../../api/donations';
import { getHelpRequestById } from '../../api/helpRequests';
import { getErrorMessage } from '../../api/errors';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Icon } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useFeedback } from '../../providers/FeedbackProvider';
import {
  formatDonationWhen,
  formatDonorsCount,
  formatKopeks,
  getMaterialAmounts,
} from './detail/detailHelpers';
import { RADIUS, T } from '../../theme/tokens';

type DonationFilter = 'new' | 'large' | 'with_message';

const PAGE_SIZE = 9;
const LOAD_MORE_STEP = 20;

const FILTER_CHIPS: { id: DonationFilter; label: string }[] = [
  { id: 'new', label: 'Новые' },
  { id: 'large', label: 'Крупные' },
  { id: 'with_message', label: 'С сообщениями' },
];

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BeneficiaryDonationsList'>;
  route: RouteProp<RootStackParamList, 'BeneficiaryDonationsList'>;
};

function getDonorLabel(donation: DonationWithDonor): { name: string; anonymous: boolean } {
  if (donation.donor?.is_anonymous) {
    return { name: 'Аноним', anonymous: true };
  }
  return { name: donation.donor?.display_name ?? 'Донор', anonymous: false };
}

export function BeneficiaryDonationsListScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { helpRequestId, donationsCount: donationsCountParam, collectedKopeks: collectedParam } =
    route.params;
  const { showError } = useFeedback();

  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<DonationWithDonor[]>([]);
  const [donationsCount, setDonationsCount] = useState(donationsCountParam ?? 0);
  const [collectedKopeks, setCollectedKopeks] = useState(collectedParam ?? 0);
  const [filter, setFilter] = useState<DonationFilter>('new');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [items, request] = await Promise.all([
        getMaterialDonations(helpRequestId),
        getHelpRequestById(helpRequestId),
      ]);
      setDonations(items);
      const { collected } = getMaterialAmounts(request);
      setCollectedKopeks(collectedParam ?? collected);
      setDonationsCount(
        donationsCountParam ??
          request.donations?.succeeded_count ??
          request.donations?.count ??
          items.length,
      );
    } catch (err) {
      showError(getErrorMessage(err, 'Не удалось загрузить донаты'));
    } finally {
      setLoading(false);
    }
  }, [collectedParam, donationsCountParam, helpRequestId, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter]);

  const filteredDonations = useMemo(() => {
    let list = [...donations];
    if (filter === 'with_message') {
      list = list.filter((item) => item.message?.trim());
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
  }, [donations, filter]);

  const visibleDonations = filteredDonations.slice(0, visibleCount);
  const remainingCount = filteredDonations.length - visibleDonations.length;

  const headerSubtitle = `${formatDonorsCount(donationsCount)} · ${formatKopeks(collectedKopeks)}`;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader
        title="Все донаты"
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
      ) : filteredDonations.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            {filter === 'with_message' ? 'Пока нет донатов с сообщениями' : 'Пока нет донатов'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {visibleDonations.map((donation, index) => {
            const donor = getDonorLabel(donation);
            const when = formatDonationWhen(donation.created_at);
            return (
              <View
                key={donation.id}
                style={[
                  styles.donationRow,
                  index < visibleDonations.length - 1 && styles.donationRowBorder,
                ]}
              >
                {donor.anonymous ? (
                  <View style={styles.anonAvatar}>
                    <Icon name="eye" size={18} color={T.muted} strokeWidth={2} />
                  </View>
                ) : (
                  <Avatar name={donor.name} size={40} />
                )}
                <View style={styles.donationBody}>
                  <View style={styles.donationTop}>
                    <Text
                      style={[styles.donationName, donor.anonymous && styles.donationNameMuted]}
                      numberOfLines={1}
                    >
                      {donor.name}
                    </Text>
                    <Text style={styles.donationAmount}>+{formatKopeks(donation.amount_kopeks)}</Text>
                  </View>
                  {when ? <Text style={styles.donationWhen}>{when}</Text> : null}
                  {donation.message?.trim() ? (
                    <View style={styles.messageCard}>
                      <Text style={styles.messageText}>«{donation.message.trim()}»</Text>
                    </View>
                  ) : null}
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
  donationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
  },
  donationRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  anonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  donationBody: {
    flex: 1,
    minWidth: 0,
  },
  donationTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 6,
  },
  donationName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  donationNameMuted: {
    color: T.muted,
  },
  donationAmount: {
    fontSize: 15,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.accent,
    letterSpacing: -0.2,
  },
  donationWhen: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 3,
  },
  messageCard: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: T.surface,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: T.accent,
  },
  messageText: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 19,
  },
  loadMoreWrap: {
    marginTop: 18,
    alignItems: 'center',
  },
});
