import { StyleSheet, Text, View } from 'react-native';
import { MaterialHelpRequestPayout } from '../../../api/payouts';
import { Chip } from '../../../components/Chip';
import { Icon } from '../../../components/Icon';
import { VolunteerSectionHeader } from '../../../components/volunteer/VolunteerDetailParts';
import {
  formatDonationWhen,
  formatKopeks,
  getPayoutMethodIcon,
  getPayoutStatusMeta,
} from './detailHelpers';
import { INLINE_SECTION_BG, RADIUS, T } from '../../../theme/tokens';

type Props = {
  withdrawnKopeks: number;
  availableKopeks: number;
  payoutsCount: number;
  recentPayouts?: MaterialHelpRequestPayout[];
  onOpenAllPayouts?: () => void;
};

function getMethodLabel(payout: MaterialHelpRequestPayout): string {
  return payout.payout_method?.display_name ?? 'Способ выплаты';
}

export function MaterialPayoutsSection({
  withdrawnKopeks,
  availableKopeks,
  payoutsCount,
  recentPayouts = [],
  onOpenAllPayouts,
}: Props) {
  const showRecent = recentPayouts.length > 0 && onOpenAllPayouts;

  return (
    <>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Выплаты</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryHint}>Уже выведено</Text>
            <Text style={styles.summaryValue}>{formatKopeks(withdrawnKopeks)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={styles.summaryHint}>Доступно</Text>
            <Text style={[styles.summaryValue, styles.summaryValueAccent]}>
              {formatKopeks(availableKopeks)}
            </Text>
          </View>
        </View>
      </View>

      {showRecent ? (
        <>
          <VolunteerSectionHeader
            title="Последние выплаты"
            action={payoutsCount > 0 ? `Все ${payoutsCount}` : undefined}
            onAction={onOpenAllPayouts}
            style={styles.sectionHeader}
          />
          <View style={styles.listCard}>
            {recentPayouts.map((payout, index) => {
              const status = getPayoutStatusMeta(payout.status);
              const methodIcon = getPayoutMethodIcon(payout.payout_method?.type);
              const when = formatDonationWhen(payout.created_at);
              return (
                <View
                  key={payout.id}
                  style={[
                    styles.payoutRow,
                    index < recentPayouts.length - 1 && styles.payoutRowBorder,
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
                    <View style={styles.payoutMetaRow}>
                      {when ? <Text style={styles.payoutMeta}>{when}</Text> : null}
                      <Chip size="sm" kind={status.kind} label={status.label} />
                    </View>
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
  summaryCard: {
    backgroundColor: INLINE_SECTION_BG,
    borderRadius: RADIUS.md,
    padding: 14,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryCol: {
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: T.borderSoft,
  },
  summaryHint: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    marginTop: 2,
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  summaryValueAccent: {
    color: T.success,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  listCard: {
    backgroundColor: INLINE_SECTION_BG,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: 14,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  payoutRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  methodIcon: {
    width: 36,
    height: 36,
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
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  payoutAmount: {
    fontSize: 14,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.2,
  },
  payoutMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  payoutMeta: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
});
