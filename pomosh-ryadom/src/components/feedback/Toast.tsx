import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../Icon';
import { RADIUS, T, shadowLg } from '../../theme/tokens';

export type ToastVariant = 'success' | 'warning' | 'danger' | 'info';

type Props = {
  visible: boolean;
  title: string;
  body?: string;
  variant?: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
};

const VARIANTS: Record<
  ToastVariant,
  { accent: string; icon: IconName }
> = {
  success: { accent: T.success, icon: 'check' },
  warning: { accent: T.warning, icon: 'warn' },
  danger: { accent: T.danger, icon: 'close' },
  info: { accent: T.info, icon: 'info' },
};

export function Toast({
  visible,
  title,
  body,
  variant = 'info',
  actionLabel,
  onAction,
  onDismiss,
}: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const palette = VARIANTS[variant];

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 220,
      }).start();
    } else {
      translateY.setValue(-120);
    }
  }, [visible, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.wrap,
        { paddingTop: insets.top + 8, transform: [{ translateY }] },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.card, shadowLg]}>
        <View style={[styles.iconWrap, { backgroundColor: palette.accent }]}>
          <Icon name={palette.icon} size={18} color="#fff" strokeWidth={2.4} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {body ? (
            <Text style={styles.body} numberOfLines={3}>
              {body}
            </Text>
          ) : null}
        </View>
        {actionLabel ? (
          <Pressable
            onPress={() => {
              onAction?.();
              onDismiss();
            }}
            hitSlop={8}
            style={styles.actionBtn}
          >
            <Text style={[styles.actionText, { color: palette.accent }]}>{actionLabel}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onDismiss} hitSlop={10} style={styles.dismissBtn}>
            <Icon name="close" size={16} color={T.muted} strokeWidth={2} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 16,
    zIndex: 10000,
    elevation: 10000,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: T.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.borderSoft,
    padding: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  body: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 17,
    marginTop: 2,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    flexShrink: 0,
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
  },
  dismissBtn: {
    padding: 4,
    flexShrink: 0,
  },
});
