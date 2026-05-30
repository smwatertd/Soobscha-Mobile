import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Icon } from './Icon';
import {
  getHelpRequestCategoryChipIcon,
  getHelpRequestCategoryChipPalette,
} from '../utils/helpRequestCategoryChip';
import { RADIUS } from '../theme/tokens';

type Props = {
  label: string;
  type: 'material' | 'social';
  categoryCode: string;
  size?: 'xs' | 'sm' | 'md';
  style?: ViewStyle;
};

const sizes = {
  xs: { h: 22, px: 7, fs: 11, icon: 12, gap: 4 },
  sm: { h: 26, px: 10, fs: 12, icon: 14, gap: 5 },
  md: { h: 32, px: 12, fs: 13, icon: 15, gap: 5 },
} as const;

export function HelpRequestCategoryChip({
  label,
  type,
  categoryCode,
  size = 'sm',
  style,
}: Props) {
  if (!label.trim()) return null;

  const palette = getHelpRequestCategoryChipPalette(type);
  const iconName = getHelpRequestCategoryChipIcon(type, categoryCode);
  const s = sizes[size];

  return (
    <View
      style={[
        styles.chip,
        {
          height: s.h,
          paddingHorizontal: s.px,
          gap: s.gap,
          backgroundColor: palette.bg,
          borderColor: `${palette.color}22`,
        },
        style,
      ]}
    >
      <Icon name={iconName} size={s.icon} color={palette.color} strokeWidth={2} />
      <Text
        style={[styles.text, { color: palette.color, fontSize: s.fs }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'Manrope_600SemiBold',
    letterSpacing: -0.05,
  },
});
