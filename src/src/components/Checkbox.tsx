import { Pressable, StyleSheet, Text, View } from 'react-native';
import { T } from '../theme/tokens';
import { Icon } from './Icon';

type Props = {
  checked: boolean;
  onToggle: () => void;
  label: string;
};

export function Checkbox({ checked, onToggle, label }: Props) {
  return (
    <Pressable onPress={onToggle} style={styles.row}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Icon name="check" size={14} color="#fff" strokeWidth={3} />}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: T.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
  },
});
