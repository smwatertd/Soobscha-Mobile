import { StyleSheet, Text, View } from 'react-native';
import { Icon, IconName } from '../Icon';
import { RADIUS, T, CARD_BG, shadowSm } from '../../theme/tokens';

type Props = {
  n: number;
  icon: IconName;
  color: string;
  title: string;
  sub: string;
};

export function HowItWorksStep({ n, icon, color, title, sub }: Props) {
  return (
    <View style={[styles.row, shadowSm]}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}1a` }]}>
        <Icon name={icon} size={20} color={color} strokeWidth={2} />
        <View style={[styles.badge, { borderColor: color }]}>
          <Text style={[styles.badgeText, { color }]}>{n}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 14,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Manrope_800ExtraBold',
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  sub: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 2,
    lineHeight: 17,
  },
});
