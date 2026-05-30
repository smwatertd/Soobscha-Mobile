import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../Avatar';
import { T } from '../../../theme/tokens';

type Props = {
  name: string;
  categoryLabel?: string | null;
};

export function HelpRequestPreviewAuthor({ name, categoryLabel }: Props) {
  if (!name.trim()) return null;

  return (
    <View style={styles.row}>
      <Avatar name={name} size={28} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {categoryLabel ? (
          <Text style={styles.category} numberOfLines={1}>
            {categoryLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    lineHeight: 16,
  },
  category: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 14,
    marginTop: 1,
  },
});
