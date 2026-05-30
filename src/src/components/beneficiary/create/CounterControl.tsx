import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../Icon';
import { RADIUS, T } from '../../../theme/tokens';

type Props = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

export function CounterControl({ label, value, min = 1, max = 20, onChange }: Props) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable onPress={dec} style={styles.btn}>
          <Icon name="minus" size={18} color={T.ink} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable onPress={inc} style={[styles.btn, styles.btnPrimary]}>
          <Icon name="plus" size={18} color="#fff" strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 12,
    backgroundColor: T.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: T.borderSoft,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: T.primary,
  },
  value: {
    fontSize: 22,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
  },
});
