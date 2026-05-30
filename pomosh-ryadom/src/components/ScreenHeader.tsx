import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import { T } from '../theme/tokens';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  transparent?: boolean;
};

export function ScreenHeader({ title, subtitle, onBack, right, transparent }: Props) {
  return (
    <View style={[styles.wrap, transparent && styles.wrapTransparent]}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Icon name="chevL" size={22} color={T.ink} />
        </Pressable>
      ) : (
        <View style={styles.sidePh} />
      )}
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>{right ?? <View style={styles.sidePh} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: T.bg,
  },
  wrapTransparent: {
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidePh: {
    width: 40,
    height: 40,
  },
  center: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 2,
  },
  right: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
});
