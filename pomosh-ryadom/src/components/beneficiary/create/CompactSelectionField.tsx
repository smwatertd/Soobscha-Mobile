import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Icon } from '../../Icon';
import { RADIUS, T } from '../../../theme/tokens';

type Props = {
  label: string;
  value?: string | null;
  placeholder: string;
  onPress: () => void;
  error?: string;
  containerStyle?: ViewStyle;
};

export function CompactSelectionField({
  label,
  value,
  placeholder,
  onPress,
  error,
  containerStyle,
}: Props) {
  const hasValue = Boolean(value?.trim());

  return (
    <View style={[styles.root, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={[styles.field, error ? styles.fieldError : null]}
      >
        <Text
          style={[styles.value, !hasValue && styles.placeholder]}
          numberOfLines={2}
        >
          {hasValue ? value : placeholder}
        </Text>
        <Icon name="chevR" size={18} color={T.muted} strokeWidth={2.2} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  field: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: T.surface,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: RADIUS.sm,
  },
  fieldError: {
    borderColor: T.danger,
  },
  value: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Manrope_500Medium',
    color: T.ink,
    lineHeight: 20,
  },
  placeholder: {
    color: T.mutedSoft,
  },
  error: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
  },
});
