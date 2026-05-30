import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../Icon';
import { RADIUS, T, shadowMd } from '../../theme/tokens';

export type InAppNotificationBannerData = {
  title: string;
  body: string;
};

type Props = {
  visible: boolean;
  data: InAppNotificationBannerData | null;
  onPress?: () => void;
  onDismiss: () => void;
};

export function InAppNotificationBanner({ visible, data, onPress, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (visible && data) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 240,
      }).start();
    } else {
      translateY.setValue(-120);
    }
  }, [visible, data, translateY]);

  if (!visible || !data) return null;

  return (
    <Animated.View
      style={[
        styles.wrap,
        { paddingTop: insets.top + 8, transform: [{ translateY }] },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onPress}
        style={[styles.banner, shadowMd]}
      >
        <View style={styles.iconWrap}>
          <Icon name="bell" size={18} color={T.primary} strokeWidth={2} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {data.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {data.body}
          </Text>
        </View>
        <Pressable onPress={onDismiss} hitSlop={10} style={styles.dismiss}>
          <Icon name="close" size={16} color={T.muted} strokeWidth={2} />
        </Pressable>
      </Pressable>
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
    zIndex: 9998,
    elevation: 9998,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: T.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.borderSoft,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: T.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 16,
  },
  dismiss: {
    padding: 4,
  },
});
