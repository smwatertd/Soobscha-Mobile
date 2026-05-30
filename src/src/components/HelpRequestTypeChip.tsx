import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Icon, IconName } from './Icon';
import { RADIUS, T } from '../theme/tokens';

type Props = {
  type: 'social' | 'material';
  completed?: boolean;
  size?: 'xs' | 'sm' | 'md';
  style?: ViewStyle;
};

const sizes = {
  xs: { h: 22, px: 7, fs: 11, icon: 12, gap: 4 },
  sm: { h: 26, px: 10, fs: 12, icon: 14, gap: 5 },
  md: { h: 32, px: 12, fs: 13, icon: 15, gap: 5 },
} as const;

/** Тип заявки — зелёный (делом) / оранжевый (сбор) / зелёный «завершена». */
function resolveTypeBadge(type: 'social' | 'material', completed: boolean): {
  label: string;
  icon: IconName;
  color: string;
  bg: string;
} {
  if (type === 'social') {
    return {
      label: 'Помочь делом',
      icon: 'handshake',
      color: T.primaryDark,
      bg: T.primarySoft,
    };
  }
  if (completed) {
    return {
      label: type === 'material' ? 'Сбор завершён' : 'Завершена',
      icon: 'check',
      color: T.success,
      bg: T.successSoft,
    };
  }
  return {
    label: 'Денежный сбор',
    icon: 'coin',
    color: T.accentDark,
    bg: T.accentSoft,
  };
}

export function HelpRequestTypeChip({ type, completed = false, size = 'sm', style }: Props) {
  const badge = resolveTypeBadge(type, completed);
  const s = sizes[size];

  return (
    <View
      style={[
        styles.chip,
        {
          height: s.h,
          paddingHorizontal: s.px,
          gap: s.gap,
          backgroundColor: badge.bg,
          borderColor: `${badge.color}22`,
        },
        style,
      ]}
    >
      <Icon name={badge.icon} size={s.icon} color={badge.color} strokeWidth={2} />
      <Text
        style={[styles.text, { color: badge.color, fontSize: s.fs }]}
        numberOfLines={1}
      >
        {badge.label}
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
