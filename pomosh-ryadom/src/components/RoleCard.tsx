import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Icon, IconName } from './Icon';
import { RADIUS, T, CARD_BG, shadowSm } from '../theme/tokens';

type Props = {
  icon: IconName;
  color: string;
  colorBg: string;
  title: string;
  desc: string;
  tag: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export function RoleCard({
  icon,
  color,
  colorBg,
  title,
  desc,
  tag,
  selected,
  onPress,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        selected && { borderColor: color, borderWidth: 2 },
        !selected && shadowSm,
        style,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colorBg }]}>
        <Icon name={icon} size={28} color={color} strokeWidth={1.8} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{desc}</Text>
        <View style={[styles.tag, { backgroundColor: colorBg }]}>
          <Text style={[styles.tagText, { color }]}>{tag.toUpperCase()}</Text>
        </View>
      </View>
      {selected && (
        <View style={[styles.check, { backgroundColor: color }]}>
          <Icon name="check" size={14} color="#fff" strokeWidth={3} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    padding: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    marginBottom: 4,
  },
  desc: {
    fontSize: 13.5,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 20,
  },
  tag: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    letterSpacing: 0.2,
  },
  check: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
