import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Icon, IconName } from '../Icon';
import { RADIUS, T } from '../../theme/tokens';

export function VolunteerSectionHeader({
  title,
  action,
  onAction,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function DetailFactCard({
  icon,
  label,
  value,
  sub,
  color = T.primary,
}: {
  icon: IconName;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <View style={styles.factCard}>
      <View style={styles.factHead}>
        <Icon name={icon} size={14} color={color} strokeWidth={2} />
        <Text style={styles.factLabel}>{label}</Text>
      </View>
      <Text style={styles.factValue}>{value}</Text>
      {sub ? <Text style={styles.factSub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  factCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: T.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.borderSoft,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  factHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  factLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  factValue: {
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    lineHeight: 18,
  },
  factSub: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 2,
  },
});
