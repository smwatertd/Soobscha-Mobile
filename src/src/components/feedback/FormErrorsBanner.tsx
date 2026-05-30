import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../Icon';
import { RADIUS, T } from '../../theme/tokens';

type Props = {
  errorCount: number;
  title?: string;
  message?: string;
};

function fieldWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'поле';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'поля';
  return 'полей';
}

export function FormErrorsBanner({
  errorCount,
  title,
  message = 'Чтобы продолжить, исправьте ошибки ниже — они подсвечены красным.',
}: Props) {
  if (errorCount <= 0) return null;

  const resolvedTitle = title ?? `Проверьте ${errorCount} ${fieldWord(errorCount)}`;

  return (
    <View style={styles.banner}>
      <Icon name="warn" size={20} color={T.danger} strokeWidth={2} />
      <View style={styles.body}>
        <Text style={styles.title}>{resolvedTitle}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    backgroundColor: T.dangerSoft,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: `${T.danger}22`,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.danger,
  },
  message: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.danger,
    opacity: 0.85,
    lineHeight: 17,
    marginTop: 3,
  },
});
