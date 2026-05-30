import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Icon, IconName } from '../Icon';
import { RADIUS, T } from '../../theme/tokens';

type BadgeKind = 'primary' | 'accent' | 'neutral';

const palettes: Record<'default' | 'overlay', Record<BadgeKind, { bg: string; color: string }>> = {
  default: {
    primary: { bg: T.primarySoft, color: T.primaryDark },
    accent: { bg: T.accentSoft, color: T.accentDark },
    neutral: { bg: T.surface2, color: T.ink2 },
  },
  overlay: {
    primary: { bg: 'rgba(255,255,255,0.96)', color: T.primaryDark },
    accent: { bg: 'rgba(255,255,255,0.96)', color: T.accentDark },
    neutral: { bg: 'rgba(255,255,255,0.96)', color: T.ink2 },
  },
};

type Props = {
  icon: IconName;
  /** Полная подпись — показывается при долгом нажатии */
  label: string;
  kind?: BadgeKind;
  /** На фото карточки ленты — светлый круг */
  variant?: 'default' | 'overlay';
  /** Куда показывать подсказку относительно иконки */
  tooltipPlacement?: 'above' | 'below';
  style?: ViewStyle;
};

const TOOLTIP_MS = 2400;

export function HelpRequestDetailIconBadge({
  icon,
  label,
  kind = 'primary',
  variant = 'default',
  tooltipPlacement = 'below',
  style,
}: Props) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const palette = palettes[variant][kind];

  const hideTooltip = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setTooltipVisible(false);
  }, []);

  const showTooltip = useCallback(() => {
    hideTooltip();
    setTooltipVisible(true);
    hideTimer.current = setTimeout(hideTooltip, TOOLTIP_MS);
  }, [hideTooltip]);

  useEffect(() => () => hideTooltip(), [hideTooltip]);

  return (
    <View style={[styles.wrap, style]}>
      {tooltipVisible ? (
        <View
          style={[
            styles.tooltip,
            tooltipPlacement === 'above' ? styles.tooltipAbove : styles.tooltipBelow,
          ]}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.tooltipText}>{label}</Text>
        </View>
      ) : null}
      <Pressable
        onLongPress={showTooltip}
        delayLongPress={380}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Удерживайте, чтобы увидеть подпись"
        style={({ pressed }) => [
          styles.badge,
          { backgroundColor: palette.bg },
          pressed && styles.badgePressed,
        ]}
      >
        <Icon name={icon} size={16} color={palette.color} strokeWidth={2.1} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignItems: 'center',
  },
  tooltip: {
    position: 'absolute',
    maxWidth: 240,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: T.ink,
    zIndex: 20,
    alignSelf: 'center',
  },
  tooltipBelow: {
    top: '100%',
    marginTop: 6,
  },
  tooltipAbove: {
    bottom: '100%',
    marginBottom: 6,
  },
  tooltipText: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: '#fff',
    textAlign: 'center',
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});
