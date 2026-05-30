import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { T } from '../theme/tokens';

const COLORS = ['#1E7A4F', '#E07A3F', '#446D9E', '#8B5E10', '#7A6B9A', '#5A8E5C'];

type Props = {
  name?: string;
  size?: number;
  ring?: string;
  style?: ViewStyle;
};

export function Avatar({ name = '', size = 40, ring, style }: Props) {
  const sum = [...name].reduce((s, c) => s + c.charCodeAt(0), 0);
  const bg = COLORS[sum % COLORS.length];
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
        ring && {
          borderWidth: 2.5,
          borderColor: '#fff',
          shadowColor: ring,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 0,
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontFamily: 'Manrope_700Bold',
  },
});
