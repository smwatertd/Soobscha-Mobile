import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from '../../Icon';
import { FieldError } from './FieldError';
import { formatRublesPlain, parseRublesInput } from '../../../utils/money';
import { RADIUS, T } from '../../../theme/tokens';

type Props = {
  valueRubles: number;
  onChangeRubles: (value: number) => void;
  minRubles?: number;
  maxRubles?: number;
  error?: string;
  helper?: string;
};

export function MoneyAmountInput({
  valueRubles,
  onChangeRubles,
  minRubles,
  maxRubles,
  error,
  helper,
}: Props) {
  const [focused, setFocused] = useState(false);

  const displayValue = useMemo(() => {
    if (!valueRubles) return '';
    return formatRublesPlain(valueRubles);
  }, [valueRubles]);

  const borderColor = error ? T.danger : focused ? T.accent : T.border;

  return (
    <View>
      <View style={[styles.field, { borderColor }]}>
        <Icon name="coin" size={22} color={error ? T.danger : T.accent} strokeWidth={2} />
        <TextInput
          value={displayValue}
          onChangeText={(text) => onChangeRubles(parseRublesInput(text))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={T.mutedSoft}
          style={styles.input}
        />
        <Text style={styles.currency}>₽</Text>
      </View>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    height: 68,
    backgroundColor: T.surface,
    borderWidth: 1.5,
    borderRadius: RADIUS.sm,
  },
  input: {
    flex: 1,
    fontSize: 30,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.6,
    paddingVertical: 0,
  },
  currency: {
    fontSize: 20,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
  },
  helper: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 16,
    marginTop: 6,
  },
});
