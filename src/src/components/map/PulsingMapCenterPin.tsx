import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { T } from '../../theme/tokens';

const VARIANTS = {
  request: {
    core: T.primary,
    pulse: 'rgba(30, 122, 79, 0.28)',
  },
  material: {
    core: T.accent,
    pulse: 'rgba(232, 155, 90, 0.28)',
  },
  user: {
    core: '#3B82F6',
    pulse: 'rgba(59, 130, 246, 0.28)',
  },
} as const;

const SIZES = {
  sm: { core: 10, ring: 14, pulse: 30 },
  smPlus: { core: 12, ring: 17, pulse: 36 },
  md: { core: 16, ring: 22, pulse: 42 },
  lg: { core: 21, ring: 28, pulse: 58 },
} as const;

type Props = {
  animated?: boolean;
  size?: keyof typeof SIZES;
  variant?: keyof typeof VARIANTS;
};

export function PulsingMapCenterPin({
  animated = true,
  size = 'lg',
  variant = 'request',
}: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const colors = VARIANTS[variant];
  const metrics = SIZES[size];
  const { core: coreSize, ring: ringSize, pulse: pulseSize } = metrics;

  useEffect(() => {
    if (!animated) return undefined;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animated, pulse]);

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1.15],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 0.15, 1],
    outputRange: [0.5, 0.38, 0],
  });

  return (
    <View
      style={[styles.anchor, { width: pulseSize, height: pulseSize }]}
      pointerEvents="none"
    >
      {animated ? (
        <Animated.View
          style={[
            styles.pulse,
            {
              width: pulseSize,
              height: pulseSize,
              borderRadius: pulseSize / 2,
              backgroundColor: colors.pulse,
              opacity: pulseOpacity,
              transform: [{ scale: pulseScale }],
            },
          ]}
        />
      ) : null}
      <View
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
          },
        ]}
      />
      <View
        style={[
          styles.core,
          {
            width: coreSize,
            height: coreSize,
            borderRadius: coreSize / 2,
            backgroundColor: colors.core,
          },
        ]}
      />
    </View>
  );
}

export function getPulsingPinSize(size: keyof typeof SIZES = 'lg'): number {
  return SIZES[size].pulse;
}

const styles = StyleSheet.create({
  anchor: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  core: {
    borderWidth: 2.5,
    borderColor: '#fff',
  },
});
