import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { RADIUS, T } from '../theme/tokens';

type Props = {
  value: number;
  max?: number;
  color?: string;
  bg?: string;
  height?: number;
  style?: ViewStyle;
};

export function ProgressBar({
  value,
  max = 100,
  color = T.primary,
  bg = T.surface2,
  height = 8,
  style,
}: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <View style={[styles.track, { height, backgroundColor: bg }, style]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
});
