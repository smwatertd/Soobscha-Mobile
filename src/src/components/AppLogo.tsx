import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { T, shadowMd, shadowSm } from '../theme/tokens';

type Props = {
  size?: number;
  showTitle?: boolean;
  titleColor?: string;
  subtitle?: string;
  subtitleColor?: string;
  /** mark — только знак; pill — welcome; stacked — знак + название (login, splash) */
  variant?: 'mark' | 'pill' | 'stacked';
  /** accent — оранжевый круг; primary — зелёный градиент (login) */
  tone?: 'accent' | 'primary';
  style?: ViewStyle;
};

function LogoMark({
  size,
  tone = 'primary',
}: {
  size: number;
  tone?: 'accent' | 'primary';
}) {
  const iconSize = Math.round(size * (tone === 'accent' ? 0.56 : 0.44));
  const radius = tone === 'accent' ? size / 2 : Math.round(size * 0.3125);

  if (tone === 'accent') {
    return (
      <View
        style={[
          styles.mark,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: T.accent,
          },
        ]}
      >
        <Icon name="heart" size={iconSize} color="#fff" strokeWidth={2.2} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[T.primary, T.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.mark,
        shadowMd,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
      ]}
    >
      <Icon name="heart" size={iconSize} color="#fff" strokeWidth={2.2} />
    </LinearGradient>
  );
}

export function AppLogo({
  size = 64,
  showTitle = false,
  titleColor = T.ink,
  subtitle,
  subtitleColor = T.muted,
  variant = 'stacked',
  tone = 'primary',
  style,
}: Props) {
  if (variant === 'pill') {
    const markSize = Math.max(32, Math.round(size * 0.5));

    return (
      <View style={[styles.pill, style]}>
        <LogoMark size={markSize} tone="accent" />
        <Text style={styles.pillTitle}>Сообща</Text>
      </View>
    );
  }

  const markTone = variant === 'mark' && tone === 'primary' ? tone : variant === 'mark' ? tone : 'primary';
  const showName = showTitle || variant === 'stacked';

  return (
    <View style={[styles.wrap, style]}>
      <View style={variant === 'stacked' ? styles.markShadow : undefined}>
        <LogoMark size={size} tone={markTone} />
      </View>
      {showName ? (
        <Text style={[styles.title, { color: titleColor }]}>Сообща</Text>
      ) : null}
      {subtitle ? (
        <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  markShadow: {
    borderRadius: 999,
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 12,
    fontSize: 22,
    fontFamily: 'Manrope_800ExtraBold',
    fontWeight: '800',
    letterSpacing: -0.5,
    flexShrink: 0,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    textAlign: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 8,
    paddingRight: 14,
    paddingLeft: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  pillTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: '#fff',
    letterSpacing: 0.2,
  },
});
