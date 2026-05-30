import { StyleSheet, Text, View } from 'react-native';
import { DonationWithDonor } from '../../../api/donations';
import { Avatar } from '../../../components/Avatar';
import { VolunteerSectionHeader } from '../../../components/volunteer/VolunteerDetailParts';
import { formatDonationWhen, formatKopeks } from './detailHelpers';
import { INLINE_SECTION_BG, RADIUS, T } from '../../../theme/tokens';

const CHART_BARS = [3, 8, 5, 12, 7, 4, 6, 14, 9, 11, 7, 18, 22, 16, 12, 19, 24, 21];

type Props = {
  donationsCount: number;
  recentDonations?: DonationWithDonor[];
  showChart?: boolean;
  showDonations?: boolean;
  onOpenAllDonations?: () => void;
};

function getDonorName(donation: DonationWithDonor): string {
  if (donation.donor?.is_anonymous) return 'Аноним';
  return donation.donor?.display_name ?? 'Донор';
}

export function MaterialCollectionExtras({
  donationsCount,
  recentDonations = [],
  showChart = true,
  showDonations = true,
  onOpenAllDonations,
}: Props) {
  if (!showChart && !showDonations) return null;

  return (
    <>
      {showChart ? (
        <>
          <VolunteerSectionHeader title="Динамика сбора" style={styles.sectionHeader} />
          <View style={styles.chartCard}>
            <View style={styles.chartBars}>
              {CHART_BARS.map((value, index) => {
                const max = Math.max(...CHART_BARS);
                return (
                  <View key={index} style={styles.chartBarWrap}>
                    <View
                      style={[styles.chartBar, { height: Math.max(8, Math.round(72 * (value / max))) }]}
                    />
                  </View>
                );
              })}
            </View>
            <View style={styles.chartLabels}>
              <Text style={styles.chartLabel}>5 мая</Text>
              <Text style={styles.chartLabel}>10 мая</Text>
              <Text style={styles.chartLabel}>15 мая</Text>
              <Text style={styles.chartLabel}>20 мая</Text>
              <Text style={styles.chartLabel}>Сегодня</Text>
            </View>
          </View>
        </>
      ) : null}

      {showDonations && recentDonations.length > 0 ? (
        <>
          <VolunteerSectionHeader
            title="Последние донаты"
            action={donationsCount > 0 ? `Все ${donationsCount}` : undefined}
            onAction={onOpenAllDonations}
            style={styles.sectionHeader}
          />
          <View style={styles.donationsCard}>
            {recentDonations.map((donation, index) => {
              const name = getDonorName(donation);
              const when = formatDonationWhen(donation.created_at);
              const message = donation.message?.trim();
              return (
                <View
                  key={donation.id}
                  style={[
                    styles.donationRow,
                    index < recentDonations.length - 1 && styles.donationRowBorder,
                  ]}
                >
                  <Avatar name={name} size={36} />
                  <View style={styles.donationBody}>
                    <View style={styles.donationTop}>
                      <Text style={styles.donationName} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text style={styles.donationAmount}>+{formatKopeks(donation.amount_kopeks)}</Text>
                    </View>
                    <Text style={styles.donationMeta} numberOfLines={1}>
                      {when}
                      {message ? ` · «${message}»` : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginBottom: 10,
  },
  chartCard: {
    backgroundColor: INLINE_SECTION_BG,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 14,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 72,
  },
  chartBarWrap: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    minHeight: 8,
    borderRadius: 4,
    backgroundColor: T.accent,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  chartLabel: {
    fontSize: 10,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    fontVariant: ['tabular-nums'],
  },
  donationsCard: {
    backgroundColor: INLINE_SECTION_BG,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: 14,
  },
  donationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  donationRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
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
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  donationAmount: {
    fontSize: 14,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.accent,
  },
  donationMeta: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 2,
  },
});
