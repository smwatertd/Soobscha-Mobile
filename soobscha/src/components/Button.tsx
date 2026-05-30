import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Icon, IconName } from './Icon';
import { RADIUS, T } from '../theme/tokens';

type Kind = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'dark';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  children: string;
  kind?: Kind;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  full?: boolean;
  labelColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
};

const sizes = {
  sm: { h: 36, px: 14, fs: 14, gap: 6, r: 12 },
  md: { h: 48, px: 20, fs: 15, gap: 8, r: 14 },
  lg: { h: 56, px: 22, fs: 16, gap: 10, r: 16 },
} as const;

const kinds: Record<Kind, { bg: string; color: string; border?: string }> = {
  primary: { bg: T.primary, color: '#fff' },
  secondary: { bg: T.primarySoft, color: T.primaryDark },
  accent: { bg: T.accent, color: '#fff' },
  ghost: { bg: 'transparent', color: T.ink2, border: T.border },
  danger: { bg: T.dangerSoft, color: T.danger },
  dark: { bg: T.ink, color: '#fff' },
};

export function Button({
  children,
  kind = 'primary',
  size = 'md',
  icon,
  iconRight,
  full,
  labelColor,
  onPress,
  style,
  disabled,
}: Props) {
  const s = sizes[size];
  const k = kinds[kind];
  const color = labelColor ?? k.color;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: s.h,
          paddingHorizontal: s.px,
          borderRadius: s.r,
          backgroundColor: k.bg,
          borderWidth: k.border ? 1 : 0,
          borderColor: k.border,
          gap: s.gap,
          width: full ? '100%' : undefined,
          opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={s.fs + 3} color={color} /> : null}
      <Text style={[styles.label, { color, fontSize: s.fs }]}>{children}</Text>
      {iconRight ? <Icon name={iconRight} size={s.fs + 3} color={color} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Manrope_600SemiBold',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
});
