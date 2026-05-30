import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav, TabId } from '../../components/BottomNav';
import {
  CompletedDealCard,
  DonationDealCard,
  UpcomingDealCard,
} from '../../components/volunteer/VolunteerDealCards';
import { useVolunteerMyDeals } from '../../hooks/useVolunteerMyDeals';
import { formatKopeksRub } from '../../utils/formatMoney';
import { canVolunteerViewHelpRequestReport } from '../../utils/volunteerHelpRequestReport';
import { RADIUS, T, CARD_BG } from '../../theme/tokens';

type Props = {
  activeTab?: TabId;
  onTabPress?: (tab: TabId) => void;
  onRequestPress?: (helpRequestId: string) => void;
  onOpenReport?: (params: {
    helpRequestId: string;
    title: string;
    isMaterial?: boolean;
  }) => void;
};

type MyDealsTab = 'active' | 'completed';

export function VolunteerMyScreen({
  activeTab = 'my',
  onTabPress,
  onRequestPress,
  onOpenReport,
}: Props) {
  const insets = useSafeAreaInsets();
  const [dealsTab, setDealsTab] = useState<MyDealsTab>('active');
  const deals = useVolunteerMyDeals();

  const activeError = deals.error;
  const activeEmpty =
    !deals.loading &&
    deals.activeParticipations.length === 0 &&
    deals.activeDonations.length === 0;
  const completedEmpty =
    deals.completedParticipations.length === 0 && deals.completedDonations.length === 0;
  const showLoading = deals.loading;

  const renderActive = () => {
    if (showLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={T.primary} />
        </View>
      );
    }

    if (activeError) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{activeError}</Text>
          <Pressable onPress={() => void deals.reload()}>
            <Text style={styles.retryText}>Повторить</Text>
          </Pressable>
        </View>
      );
    }

    if (activeEmpty) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Активных дел пока нет</Text>
        </View>
      );
    }

    return (
      <View style={styles.content}>
        {deals.activeParticipations.map((participation) => (
          <UpcomingDealCard
            key={participation.help_request_id}
            participation={participation}
            imageUri={participation.image_uri ?? undefined}
            distanceKm={participation.distance_km ?? undefined}
            onPress={() => onRequestPress?.(participation.help_request_id)}
          />
        ))}
        {deals.activeDonations.map((donation) => (
          <DonationDealCard
            key={donation.id}
            donation={donation}
            onPress={() => onRequestPress?.(donation.help_request_id)}
          />
        ))}
      </View>
    );
  };

  const renderCompleted = () => {
    if (showLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={T.primary} />
        </View>
      );
    }

    if (completedEmpty) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Завершённых дел пока нет</Text>
        </View>
      );
    }

    return (
      <View style={styles.content}>
        {deals.completedParticipations.map((participation) => (
          <CompletedDealCard
            key={participation.help_request_id}
            title={participation.help_request_title}
            subtitle="Социальная помощь"
            onPress={() => onRequestPress?.(participation.help_request_id)}
            onOpenReport={
              canVolunteerViewHelpRequestReport(participation.help_request_status) && onOpenReport
                ? () =>
                    onOpenReport({
                      helpRequestId: participation.help_request_id,
                      title: participation.help_request_title,
                      isMaterial: false,
                    })
                : undefined
            }
          />
        ))}
        {deals.completedDonations.map((donation) => (
          <CompletedDealCard
            key={donation.id}
            title={donation.help_request_title}
            subtitle={`Пожертвование ${formatKopeksRub(donation.amount_kopeks)}`}
            onPress={() => onRequestPress?.(donation.help_request_id)}
            onOpenReport={
              canVolunteerViewHelpRequestReport(donation.help_request_status) && onOpenReport
                ? () =>
                    onOpenReport({
                      helpRequestId: donation.help_request_id,
                      title: donation.help_request_title,
                      isMaterial: true,
                    })
                : undefined
            }
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Мои дела</Text>
      </View>

      <View style={styles.tabsRow}>
        <MyDealsTabButton
          label="Активные"
          count={deals.activeCount}
          active={dealsTab === 'active'}
          onPress={() => setDealsTab('active')}
        />
        <MyDealsTabButton
          label="Завершённые"
          count={deals.completedCount}
          active={dealsTab === 'completed'}
          onPress={() => setDealsTab('completed')}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          !showLoading ? (
            <RefreshControl refreshing={deals.loading} onRefresh={() => void deals.reload()} />
          ) : undefined
        }
      >
        {dealsTab === 'active' ? renderActive() : renderCompleted()}
      </ScrollView>

      <BottomNav active={activeTab} onTabPress={onTabPress} />
    </View>
  );
}

function MyDealsTabButton({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.dealsTab, active && styles.dealsTabActive]}
    >
      <Text
        style={[styles.dealsTabLabel, active && styles.dealsTabLabelActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <View style={[styles.dealsTabCount, active && styles.dealsTabCountActive]}>
        <Text style={[styles.dealsTabCountText, active && styles.dealsTabCountTextActive]}>
          {count}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.4,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  dealsTab: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: T.border,
  },
  dealsTabActive: {
    backgroundColor: T.primarySoft,
    borderColor: T.primary,
  },
  dealsTabLabel: {
    flexShrink: 1,
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  dealsTabLabelActive: {
    color: T.primaryDark,
  },
  dealsTabCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealsTabCountActive: {
    backgroundColor: T.primary,
  },
  dealsTabCountText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
  },
  dealsTabCountTextActive: {
    color: '#fff',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 20,
  },
  pickerWrap: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  center: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primary,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    textAlign: 'center',
  },
});
