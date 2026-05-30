import { StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import { T } from '../theme/tokens';

type Props = {
  met?: boolean;
  children: string;
};

export function PassRule({ met, children }: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, met && styles.dotMet]}>
        {met ? <Icon name="check" size={10} color="#fff" strokeWidth={3.5} /> : null}
      </View>
      <Text style={[styles.text, met && styles.textMet]}>{children}</Text>
    </View>
  );
}

export function evaluatePasswordRules(password: string) {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-ZА-Я]/.test(password),
    hasDigit: /\d/.test(password),
    hasSpecial: /[^A-Za-zА-Яа-я0-9]/.test(password),
  };
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotMet: {
    backgroundColor: T.success,
    borderWidth: 0,
  },
  text: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  textMet: {
    color: T.success,
  },
});
