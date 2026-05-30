import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { RADIUS, T } from '../theme/tokens';

type Props = {
  value: string;
  onChange: (code: string) => void;
  length?: number;
  error?: string;
};

export function OtpInput({ value, onChange, length = 6, error }: Props) {
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');
  const filledCount = value.length;

  return (
    <View>
      <Pressable style={styles.row} onPress={() => inputRef.current?.focus()}>
        {digits.map((digit, index) => {
          const isFilled = digit.trim().length > 0;
          const isCursor = index === filledCount && filledCount < length;
          return (
            <View
              key={index}
              style={[
                styles.cell,
                isFilled && styles.cellFilled,
                isCursor && styles.cellCursor,
                error && styles.cellError,
              ]}
            >
              {isFilled ? (
                <Text style={styles.digit}>{digit}</Text>
              ) : isCursor ? (
                <View style={styles.cursor} />
              ) : null}
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        style={styles.hiddenInput}
        caretHidden
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  cell: {
    flex: 1,
    height: 64,
    borderRadius: RADIUS.md,
    backgroundColor: T.surface,
    borderWidth: 2,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: {
    borderColor: T.primary,
  },
  cellCursor: {
    borderColor: T.primary,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  cellError: {
    borderColor: T.danger,
  },
  digit: {
    fontSize: 26,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    fontVariant: ['tabular-nums'],
  },
  cursor: {
    width: 2,
    height: 26,
    backgroundColor: T.primary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  error: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
  },
});
