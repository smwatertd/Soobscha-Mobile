import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../Icon';
import { RADIUS, T, shadowMd } from '../../theme/tokens';

export type SnackbarVariant = 'error' | 'info' | 'success';

type Props = {
  visible: boolean;
  message: string;
  variant?: SnackbarVariant;
  onDismiss: () => void;
};

const VARIANT_STYLES: Record<SnackbarVariant, { bg: string; border: string; text: string; icon: string }> = {
  error: { bg: T.dangerSoft, border: `${T.danger}44`, text: T.danger, icon: T.danger },
  info: { bg: T.infoSoft, border: `${T.info}44`, text: T.info, icon: T.info },
  success: { bg: T.successSoft, border: `${T.success}44`, text: T.success, icon: T.success },
};

export function Snackbar({ visible, message, variant = 'info', onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(120)).current;
  const colors = VARIANT_STYLES[variant];

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 220,
      }).start();
    } else {
      translateY.setValue(120);
    }
  }, [visible, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.wrap,
        { paddingBottom: insets.bottom + 16, transform: [{ translateY }] },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.bar, { backgroundColor: colors.bg, borderColor: colors.border }, shadowMd]}>
        <Icon name="info" size={18} color={colors.icon} strokeWidth={2} />
        <Text style={[styles.text, { color: colors.text }]} numberOfLines={3}>
          {message}
        </Text>
        <Pressable onPress={onDismiss} hitSlop={10} style={styles.dismiss}>
          <Icon name="close" size={18} color={colors.text} strokeWidth={2} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    lineHeight: 20,
  },
  dismiss: {
    padding: 4,
  },
});
