import { StyleSheet, Text, View } from 'react-native';
import { T } from '../../theme/tokens';

type Props = {
  count: number;
  selected?: boolean;
};

const SIZE = 40;

export function MapClusterPin({ count, selected }: Props) {
  const label = count > 99 ? '99+' : String(count);

  return (
    <View style={[styles.wrap, selected && styles.wrapSelected]}>
      <View style={styles.ring} />
      <View style={styles.core}>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

export function getMapClusterPinSize(): number {
  return SIZE;
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapSelected: {
    transform: [{ scale: 1.06 }],
  },
  ring: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  core: {
    width: SIZE - 8,
    height: SIZE - 8,
    borderRadius: (SIZE - 8) / 2,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#fff',
  },
});
