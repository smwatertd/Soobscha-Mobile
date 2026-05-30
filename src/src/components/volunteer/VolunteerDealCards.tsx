import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { VolunteerDonation } from '../../api/donations';
import { VolunteerSocialParticipation } from '../../api/volunteers';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { ProgressBar } from '../ProgressBar';
import { StatusBadge } from '../StatusBadge';
import { formatKopeksRub } from '../../utils/formatMoney';
import { helpRequestStatusToBadge } from '../../utils/helpRequestStatus';
import { RADIUS, T, CARD_BG, shadowSm } from '../../theme/tokens';

function formatParticipationDate(iso: string): { day: string; num: string; month: string; time: string } {
  const date = new Date(iso);
  return {
    day: date.toLocaleDateString('ru-RU', { weekday: 'short' }).replace('.', ''),
    num: date.toLocaleDateString('ru-RU', { day: 'numeric' }),
    month: date.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', ''),
    time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
  };
}

function formatTimeRange(startIso: string, durationMinutes: number): string {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${fmt(start)} — ${fmt(end)}`;
}

export function UpcomingDealCard({
  participation,
  imageUri,
  distanceKm,
  onPress,
  style,
}: {
  participation: VolunteerSocialParticipation;
  imageUri?: string;
  distanceKm?: number;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const when = formatParticipationDate(participation.start_at);
  const timeRange = formatTimeRange(participation.start_at, participation.duration_minutes);

  return (
    <PressableCard onPress={onPress} style={[styles.upcomingCard, shadowSm, style]}>
      <View style={styles.hero}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.heroImage} contentFit="cover" />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: T.primarySoft }]}>
            <Icon name="handshake" size={32} color={T.primaryDark} />
          </View>
        )}
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeDay}>{when.day}</Text>
          <Text style={styles.dateBadgeNum}>{when.num}</Text>
          <Text style={styles.dateBadgeMonth}>{when.month}</Text>
        </View>
        <View style={styles.statusBadge}>
          <StatusBadge status={helpRequestStatusToBadge(participation.help_request_status)} />
        </View>
      </View>

      <View style={styles.upcomingBody}>
        <Text style={styles.upcomingTitle} numberOfLines={2}>
          {participation.help_request_title}
        </Text>
        <View style={styles.upcomingMeta}>
          <Icon name="clock" size={14} color={T.muted} />
          <Text style={styles.upcomingMetaText}>{timeRange}</Text>
          {distanceKm != null ? (
            <>
              <View style={styles.dotSep} />
              <Icon name="pin" size={14} color={T.muted} />
              <Text style={styles.upcomingMetaText}>{distanceKm} км</Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={styles.reminderStrip}>
        <View style={styles.reminderLeft}>
          <Icon name="info" size={14} color={T.primary} />
          <Text style={styles.reminderText} numberOfLines={1}>
            Напомним за 2 часа
          </Text>
        </View>
        <Button kind="primary" size="sm" onPress={onPress}>
          Подробнее
        </Button>
      </View>
    </PressableCard>
  );
}

export function DonationDealCard({
  donation,
  onPress,
  style,
}: {
  donation: VolunteerDonation;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const date = new Date(donation.created_at).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });

  const goalKopeks = donation.help_request_goal_kopeks;
  const collectedKopeks = donation.help_request_collected_kopeks;
  const showProgress =
    goalKopeks != null &&
    goalKopeks > 0 &&
    collectedKopeks != null &&
    collectedKopeks >= 0;
  const progressPct = showProgress
    ? Math.min(100, Math.round((collectedKopeks / goalKopeks) * 100))
    : 0;

  return (
    <PressableCard onPress={onPress} style={[styles.donationCard, shadowSm, style]}>
      <View style={styles.donationRow}>
        <View style={styles.imagePh}>
          <Icon name="coin" size={22} color={T.accentDark} />
        </View>
        <View style={styles.donationBody}>
          {donation.help_request_status ? (
            <StatusBadge status={helpRequestStatusToBadge(donation.help_request_status)} />
          ) : null}
          <Text style={styles.donationTitle} numberOfLines={2}>
            {donation.help_request_title}
          </Text>
          <Text style={styles.donationSub}>
            Вы пожертвовали{' '}
            <Text style={styles.donationAmount}>{formatKopeksRub(donation.amount_kopeks)}</Text> · {date}
          </Text>
        </View>
      </View>
      {showProgress ? (
        <View style={styles.progressBlock}>
          <ProgressBar
            value={collectedKopeks}
            max={goalKopeks}
            color={T.accent}
            bg={T.accentSoft}
            height={5}
          />
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>
              {formatKopeksRub(collectedKopeks)} из {formatKopeksRub(goalKopeks)}
            </Text>
            <Text style={styles.progressPct}>{progressPct}%</Text>
          </View>
        </View>
      ) : null}
    </PressableCard>
  );
}

export function CompletedDealCard({
  title,
  subtitle,
  onPress,
  onOpenReport,
  style,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  onOpenReport?: () => void;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.donationCard, shadowSm, style]}>
      <Pressable onPress={onPress} disabled={!onPress}>
        <View style={styles.donationRow}>
          <View style={styles.successIcon}>
            <Icon name="check" size={28} color={T.success} strokeWidth={2.5} />
          </View>
          <View style={styles.donationBody}>
            <StatusBadge status="completed" />
            <Text style={styles.donationTitle} numberOfLines={2}>
              {title}
            </Text>
            {subtitle ? <Text style={styles.donationSub}>{subtitle}</Text> : null}
          </View>
        </View>
      </Pressable>
      {onOpenReport ? (
        <Button kind="ghost" size="sm" icon="document" style={styles.reportBtn} onPress={onOpenReport}>
          Открыть отчёт
        </Button>
      ) : null}
    </View>
  );
}

function PressableCard({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  if (!onPress) return <View style={style}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={style}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  upcomingCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: 12,
  },
  hero: {
    position: 'relative',
    aspectRatio: 4 / 3,
    backgroundColor: T.surface2,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 52,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: T.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dateBadgeDay: {
    fontSize: 10,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
    textTransform: 'uppercase',
  },
  dateBadgeNum: {
    fontSize: 22,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.primary,
    lineHeight: 24,
  },
  dateBadgeMonth: {
    fontSize: 9,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
    textTransform: 'uppercase',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  upcomingBody: {
    padding: 16,
  },
  upcomingTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    lineHeight: 21,
    marginBottom: 8,
  },
  upcomingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  upcomingMetaText: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  dotSep: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: T.mutedSoft,
    marginHorizontal: 4,
  },
  reminderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: T.primarySoft,
  },
  reminderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  reminderText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primaryDark,
  },
  donationCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
  },
  donationRow: { flexDirection: 'row', gap: 12 },
  imagePh: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: T.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donationBody: { flex: 1, minWidth: 0 },
  donationTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    lineHeight: 18,
    marginTop: 6,
  },
  donationSub: { fontSize: 12, fontFamily: 'Manrope_400Regular', color: T.muted, marginTop: 3 },
  donationAmount: { fontFamily: 'Manrope_700Bold', color: T.accent },
  progressBlock: {
    marginTop: 12,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  progressPct: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.ink2,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: T.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportBtn: { marginTop: 12, alignSelf: 'stretch' },
});
