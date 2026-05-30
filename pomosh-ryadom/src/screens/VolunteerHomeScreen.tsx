import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { BottomNav, TabId } from '../components/BottomNav';
import { Icon } from '../components/Icon';
import { VolunteerActiveDealsEmptyState } from '../components/volunteer/VolunteerActiveDealsEmptyState';
import {
  CompletedDealCard,
  DonationDealCard,
  UpcomingDealCard,
} from '../components/volunteer/VolunteerDealCards';
import { useVolunteerHomeDashboard } from '../hooks/useVolunteerHomeDashboard';
import { formatKopeksRub } from '../utils/formatMoney';
import { canVolunteerViewHelpRequestReport } from '../utils/volunteerHelpRequestReport';
import { RADIUS, T, CARD_BG, shadowSm } from '../theme/tokens';

type Props = {
  activeTab?: TabId;
  onTabPress?: (tab: TabId) => void;
  onNotificationsPress?: () => void;
  onRequestPress?: (helpRequestId: string) => void;
  onOpenReport?: (params: {
    helpRequestId: string;
    title: string;
    isMaterial?: boolean;
  }) => void;
  onOpenMyDeals?: () => void;
  onOpenFeed?: () => void;
  unreadCount?: number;
};

export function VolunteerHomeScreen({
  activeTab = 'home',
  onTabPress,
  onNotificationsPress,
  onRequestPress,
  onOpenReport,
  onOpenMyDeals,
  onOpenFeed,
  unreadCount = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const dashboard = useVolunteerHomeDashboard();
  const noActiveDeals =
    dashboard.activeParticipations.length === 0 && dashboard.activeDonations.length === 0;
  const completedCount =
    dashboard.recentCompletedParticipations.length + dashboard.recentCompletedDonations.length;
  const showHistory = completedCount > 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <View style={styles.avatarRing}>
          <Avatar name={dashboard.fullName || 'Волонтёр'} size={42} />
        </View>
        <View style={styles.greeting}>
          <Text style={styles.greetingSub}>Добрый день,</Text>
          <Text style={styles.greetingName}>{dashboard.firstName || 'волонтёр'}</Text>
        </View>
        <Pressable style={[styles.bellBtn, shadowSm]} onPress={onNotificationsPress}>
          <Icon name="bell" size={20} color={T.ink} />
          {unreadCount > 0 ? (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          !dashboard.loading ? (
            <RefreshControl refreshing={dashboard.loading} onRefresh={() => void dashboard.reload()} />
          ) : undefined
        }
      >
        <View style={styles.impactWrap}>
          <Pressable onPress={onOpenMyDeals}>
            <LinearGradient
            colors={[T.primary, T.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.impactCard}
          >
            <View style={styles.impactDecor} />
            <View style={styles.impactBody}>
              <Text style={styles.impactLabel}>{dashboard.impactLabel || 'ВАШ ВКЛАД'}</Text>
              {dashboard.loading ? (
                <ActivityIndicator color="#fff" style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
              ) : (
                <>
                  <Text style={styles.impactValue}>{dashboard.impactLine || '—'}</Text>
                  <Text style={styles.impactSub}>{dashboard.impactSub || 'Данные загрузятся позже'}</Text>
                </>
              )}
            </View>
            <Icon name="chevR" size={22} color="#fff" />
          </LinearGradient>
          </Pressable>
        </View>

        {dashboard.error ? <Text style={styles.errorText}>{dashboard.error}</Text> : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Сейчас участвуете</Text>
          {!noActiveDeals && dashboard.activeCount > 0 ? (
            <Pressable onPress={onOpenMyDeals} hitSlop={8}>
              <Text style={styles.sectionAction}>Все {dashboard.activeCount}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.cardsBlock}>
          {dashboard.loading ? (
            <View style={styles.inlineCenter}>
              <ActivityIndicator color={T.primary} />
            </View>
          ) : dashboard.error ? (
            <Pressable onPress={() => void dashboard.reload()}>
              <Text style={styles.retryText}>Повторить</Text>
            </Pressable>
          ) : noActiveDeals ? (
            <VolunteerActiveDealsEmptyState onOpenFeed={onOpenFeed} />
          ) : (
            <>
              {dashboard.activeParticipations.map((participation) => (
                <UpcomingDealCard
                  key={participation.help_request_id}
                  participation={participation}
                  imageUri={participation.image_uri ?? undefined}
                  distanceKm={participation.distance_km ?? undefined}
                  onPress={() => onRequestPress?.(participation.help_request_id)}
                />
              ))}
              {dashboard.activeDonations.map((donation) => (
                <DonationDealCard
                  key={donation.id}
                  donation={donation}
                  onPress={() => onRequestPress?.(donation.help_request_id)}
                />
              ))}
            </>
          )}
        </View>

        {showHistory ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Из истории</Text>
              <Pressable onPress={onOpenMyDeals} hitSlop={8}>
                <Text style={styles.sectionAction}>Все</Text>
              </Pressable>
            </View>

            <View style={styles.cardsBlock}>
              {dashboard.recentCompletedParticipations.map((participation) => (
                <CompletedDealCard
                  key={participation.help_request_id}
                  title={participation.help_request_title}
                  subtitle="Социальная помощь"
                  onPress={() => onRequestPress?.(participation.help_request_id)}
                  onOpenReport={
                    canVolunteerViewHelpRequestReport(participation.help_request_status) &&
                    onOpenReport
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
              {dashboard.recentCompletedDonations.map((donation) => (
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
          </>
        ) : null}
      </ScrollView>

      <BottomNav active={activeTab} onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  avatarRing: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: T.primary,
    padding: 1,
  },
  greeting: {
    flex: 1,
  },
  greetingSub: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 14,
  },
  greetingName: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    lineHeight: 19,
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: T.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: T.accent,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontSize: 10,
    fontFamily: 'Manrope_700Bold',
    color: '#fff',
    lineHeight: 12,
  },
  scroll: {
    flex: 1,
  },
  impactWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
  },
  impactCard: {
    borderRadius: RADIUS.xl,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
  },
  impactDecor: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: T.accent,
    opacity: 0.22,
  },
  impactBody: {
    flex: 1,
    zIndex: 1,
  },
  impactLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  impactValue: {
    fontSize: 22,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#fff',
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  impactSub: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  inlineCenter: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primary,
    textAlign: 'center',
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primary,
  },
  cardsBlock: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
