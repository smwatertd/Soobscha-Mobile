import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Icon, IconName } from './Icon';
import { RADIUS, T } from '../theme/tokens';

type ChipKind =
  | 'default'
  | 'primary'
  | 'accent'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'ghost';

type Props = {
  label: string;
  icon?: IconName;
  active?: boolean;
  kind?: ChipKind;
  size?: 'xs' | 'sm' | 'md';
  /** Многострочная подпись внутри бейджа (длинные названия навыков и т.п.) */
  wrapLabel?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

const sizes = {
  xs: { h: 22, px: 7, fs: 11, icon: 12, gap: 4 },
  sm: { h: 26, px: 10, fs: 12, icon: 14, gap: 5 },
  md: { h: 32, px: 12, fs: 13, icon: 15, gap: 5 },
} as const;

const palettes: Record<ChipKind | 'active', { bg: string; color: string; border: string }> = {
  default: { bg: T.surface, color: T.ink2, border: T.border },
  active: { bg: T.ink, color: '#fff', border: 'transparent' },
  primary: { bg: T.primarySoft, color: T.primaryDark, border: 'transparent' },
  accent: { bg: T.accentSoft, color: T.accentDark, border: 'transparent' },
  success: { bg: T.successSoft, color: T.success, border: 'transparent' },
  danger: { bg: T.dangerSoft, color: T.danger, border: 'transparent' },
  warning: { bg: T.warningSoft, color: '#8B5E10', border: 'transparent' },
  info: { bg: T.infoSoft, color: T.info, border: 'transparent' },
  ghost: { bg: 'transparent', color: T.muted, border: T.border },
};

export function Chip({
  label,
  icon,
  active,
  kind = 'default',
  size = 'md',
  wrapLabel = false,
  onPress,
  style,
}: Props) {
  const s = sizes[size];
  const p = active
    ? { bg: T.primarySoft, color: T.primaryDark, border: T.primary }
    : palettes[kind];

  const content = (
    <>
      {icon ? <Icon name={icon} size={s.icon} color={p.color} strokeWidth={2} /> : null}
      <Text
        style={[
          styles.text,
          { color: p.color, fontSize: s.fs },
          wrapLabel && styles.textWrap,
        ]}
        {...(wrapLabel ? {} : { numberOfLines: 1 })}
      >
        {label}
      </Text>
    </>
  );

  const boxStyle = [
    styles.chip,
    wrapLabel && styles.chipWrap,
    wrapLabel
      ? {
          minHeight: s.h,
          paddingVertical: 7,
          paddingHorizontal: s.px,
        }
      : {
          height: s.h,
          paddingHorizontal: s.px,
        },
    {
      gap: s.gap,
      backgroundColor: p.bg,
      borderColor: p.border,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={boxStyle}>
        {content}
      </Pressable>
    );
  }

  return <View style={boxStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  chipWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Manrope_600SemiBold',
    letterSpacing: -0.05,
  },
  textWrap: {
    flexShrink: 1,
    textAlign: 'center',
    lineHeight: 16,
  },
});
