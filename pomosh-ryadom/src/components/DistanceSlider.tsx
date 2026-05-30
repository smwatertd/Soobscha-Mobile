import { useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';
import { T } from '../theme/tokens';

const THUMB_SIZE = 20;

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

export function DistanceSlider({ value, min = 1, max = 30, onChange }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View>(null);
  const trackPageX = useRef(0);
  const trackWidthRef = useRef(0);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  valueRef.current = value;
  onChangeRef.current = onChange;

  const updateFromPageX = (pageX: number) => {
    const width = trackWidthRef.current;
    if (width <= 0) return;
    const localX = pageX - trackPageX.current;
    const ratio = Math.max(0, Math.min(1, localX / width));
    const next = Math.round(min + ratio * (max - min));
    if (next !== valueRef.current) {
      onChangeRef.current(next);
    }
  };

  const syncTrackOrigin = (pageX?: number) => {
    trackRef.current?.measureInWindow((x) => {
      trackPageX.current = x;
      if (pageX != null) {
        updateFromPageX(pageX);
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        syncTrackOrigin(event.nativeEvent.pageX);
      },
      onPanResponderMove: (event) => {
        updateFromPageX(event.nativeEvent.pageX);
      },
    }),
  ).current;

  const onTrackLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    trackWidthRef.current = width;
    setTrackWidth(width);
    syncTrackOrigin();
  };

  const fillPct = ((value - min) / (max - min)) * 100;
  const thumbLeft =
    trackWidth > 0 ? (fillPct / 100) * trackWidth - THUMB_SIZE / 2 : 0;

  return (
    <View style={styles.wrap}>
      <NativeViewGestureHandler disallowInterruption>
        <View
          ref={trackRef}
          collapsable={false}
          style={styles.trackHit}
          onLayout={onTrackLayout}
          {...panResponder.panHandlers}
        >
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${fillPct}%` }]} />
          </View>
          <View
            style={[
              styles.thumb,
              {
                left: Math.max(0, Math.min(trackWidth - THUMB_SIZE, thumbLeft)),
              },
            ]}
          />
        </View>
      </NativeViewGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 14,
  },
  trackHit: {
    height: 44,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    borderRadius: 999,
    backgroundColor: T.surface2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: T.primary,
  },
  thumb: {
    position: 'absolute',
    top: 12,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: T.primary,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
