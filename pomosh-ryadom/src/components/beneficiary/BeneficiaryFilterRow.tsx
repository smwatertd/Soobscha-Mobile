import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, IconName } from '../Icon';
import { RADIUS, T } from '../../theme/tokens';

type Props = {
  icon: IconName;
  color: string;
  title: string;
  sub: string;
  count?: number;
  active: boolean;
  onPress: () => void;
};

export function BeneficiaryFilterRow({
  icon,
  color,
  title,
  sub,
  count = 0,
  active,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, active && { borderColor: color }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${color}1a` }]}>
        <Icon name={icon} size={18} color={color} strokeWidth={2} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
      {count > 0 ? (
        <Text style={[styles.count, { color, backgroundColor: `${color}1a` }]}>{count}</Text>
      ) : null}
      <View style={[styles.check, active && { backgroundColor: color, borderColor: color }]}>
        {active ? <Icon name="check" size={14} color="#fff" strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: T.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: T.borderSoft,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: T.ink },
  sub: { fontSize: 11, fontFamily: 'Manrope_500Medium', color: T.muted, marginTop: 2 },
  count: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
