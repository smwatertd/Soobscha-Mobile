import { StyleSheet, Text } from 'react-native';
import { T } from '../../../theme/tokens';

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
  error: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
  },
});
