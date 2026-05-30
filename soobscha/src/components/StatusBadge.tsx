import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { humanizeEnumCode } from '../services/labelCatalogState';
import { helpRequestStatusToBadge } from '../utils/helpRequestStatus';
import { RADIUS, T } from '../theme/tokens';

type Props = {
  status: string;
  style?: ViewStyle;
};

const STATUS_MAP: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  moderation: { label: 'На модерации', bg: T.warningSoft, color: '#8B5E10', dot: T.warning },
  rework: { label: 'Доработать', bg: T.warningSoft, color: '#8B5E10', dot: T.warning },
  collecting: { label: 'Идёт сбор', bg: T.accentSoft, color: T.accentDark, dot: T.accent },
  funded: { label: 'Собрано', bg: T.successSoft, color: T.success, dot: T.success },
  recruiting: { label: 'Идёт набор', bg: T.accentSoft, color: T.accentDark, dot: T.accent },
  waiting_start: { label: 'Скоро старт', bg: T.infoSoft, color: T.info, dot: T.info },
  in_progress: { label: 'Выполняется', bg: T.primarySoft, color: T.primaryDark, dot: T.primary },
  completed: { label: 'Завершено', bg: T.successSoft, color: T.success, dot: T.success },
  interrupted: { label: 'Прервано', bg: T.dangerSoft, color: T.danger, dot: T.danger },
  report: { label: 'На модерации отчёта', bg: T.infoSoft, color: T.info, dot: T.info },
  report_on_review: { label: 'Отчёт на проверке', bg: T.infoSoft, color: T.info, dot: T.info },
  report_overdue: { label: 'Просрочен отчёт', bg: T.dangerSoft, color: T.danger, dot: T.danger },
  rejected: { label: 'Отклонена', bg: T.dangerSoft, color: T.danger, dot: T.danger },
  cancelled: { label: 'Отменена', bg: T.surface2, color: T.muted, dot: T.muted },
};

function resolveBadgeKey(status: string): string {
  if (status in STATUS_MAP) return status;
  const mapped = helpRequestStatusToBadge(status);
  return mapped in STATUS_MAP ? mapped : mapped;
}

function resolveBadgeLabel(status: string, badgeKey: string): string {
  const map = STATUS_MAP[badgeKey];
  if (map) return map.label;
  if (status in STATUS_MAP) return STATUS_MAP[status].label;
  return humanizeEnumCode(status);
}

export function StatusBadge({ status, style }: Props) {
  const badgeKey = resolveBadgeKey(status);
  const map = STATUS_MAP[badgeKey] ?? {
    label: resolveBadgeLabel(status, badgeKey),
    bg: T.surface2,
    color: T.muted,
    dot: T.muted,
  };

  return (
    <View style={[styles.badge, { backgroundColor: map.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: map.dot }]} />
      <Text style={[styles.label, { color: map.color }]}>{map.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 4,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: RADIUS.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
  },
});
