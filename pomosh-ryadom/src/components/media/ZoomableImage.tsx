import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

type Props = {
  uri: string;
  style?: ViewStyle;
  rotation?: number;
  onZoomActiveChange?: (active: boolean) => void;
  onPinchingChange?: (pinching: boolean) => void;
  onResetRef?: (reset: () => void) => void;
  onSingleTap?: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_THRESHOLD = 1.02;

export function ZoomableImage({
  uri,
  style,
  rotation = 0,
  onZoomActiveChange,
  onPinchingChange,
  onResetRef,
  onSingleTap,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const scaleRef = useRef(1);
  const baseScaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const zoomActiveRef = useRef(false);

  const notifyZoom = useCallback(
    (nextScale: number) => {
      const active = nextScale > ZOOM_THRESHOLD;
      if (zoomActiveRef.current !== active) {
        zoomActiveRef.current = active;
        onZoomActiveChange?.(active);
      }
    },
    [onZoomActiveChange],
  );

  const applyScale = useCallback(
    (nextScale: number) => {
      const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
      scaleRef.current = clamped;
      scale.setValue(clamped);
      notifyZoom(clamped);
    },
    [notifyZoom, scale],
  );

  const applyTranslate = useCallback(
    (x: number, y: number) => {
      translateRef.current = { x, y };
      translateX.setValue(x);
      translateY.setValue(y);
    },
    [translateX, translateY],
  );

  const reset = useCallback(() => {
    baseScaleRef.current = 1;
    applyScale(1);
    applyTranslate(0, 0);
    onPinchingChange?.(false);
  }, [applyScale, applyTranslate, onPinchingChange]);

  useEffect(() => {
    onResetRef?.(reset);
  }, [onResetRef, reset]);

  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .runOnJS(true)
        .onBegin(() => {
          onPinchingChange?.(true);
        })
        .onUpdate((event) => {
          applyScale(baseScaleRef.current * event.scale);
        })
        .onEnd((event) => {
          const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, baseScaleRef.current * event.scale));
          baseScaleRef.current = next;
          applyScale(next);
          if (next <= ZOOM_THRESHOLD) {
            reset();
          }
        })
        .onFinalize(() => {
          onPinchingChange?.(false);
        }),
    [applyScale, onPinchingChange, reset],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minPointers(1)
        .maxPointers(1)
        .onBegin(() => {
          panStartRef.current = { ...translateRef.current };
        })
        .onUpdate((event) => {
          if (scaleRef.current <= ZOOM_THRESHOLD) return;
          applyTranslate(
            panStartRef.current.x + event.translationX,
            panStartRef.current.y + event.translationY,
          );
        }),
    [applyTranslate],
  );

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .maxDuration(250)
        .onEnd(() => {
          if (scaleRef.current <= ZOOM_THRESHOLD) {
            onSingleTap?.();
          }
        }),
    [onSingleTap],
  );

  const gesture = useMemo(
    () => Gesture.Simultaneous(pinch, Gesture.Exclusive(tap, pan)),
    [pan, pinch, tap],
  );

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.wrap,
          style,
          {
            transform: [
              { rotate: `${rotation}deg` },
              { scale },
              { translateX },
              { translateY },
            ],
          },
        ]}
      >
        <Image pointerEvents="none" source={{ uri }} style={styles.image} contentFit="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
