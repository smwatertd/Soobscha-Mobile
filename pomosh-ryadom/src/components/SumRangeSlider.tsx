import { useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';
import { T } from '../theme/tokens';

const THUMB_SIZE = 20;

type Props = {
  minValue: number;
  maxValue: number;
  rangeMin: number;
  rangeMax: number;
  onChange: (rangeMin: number, rangeMax: number) => void;
  accent?: string;
};

function formatSumLabel(rub: number): string {
  if (rub >= 1_000_000) return `${(rub / 1_000_000).toFixed(rub % 1_000_000 === 0 ? 0 : 1)} млн`;
  if (rub >= 1_000) return `${Math.round(rub / 1_000)} тыс.`;
  return `${rub}`;
}

export function SumRangeSlider({
  minValue,
  maxValue,
  rangeMin,
  rangeMax,
  onChange,
  accent = T.accent,
}: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View>(null);
  const trackPageX = useRef(0);
  const trackWidthRef = useRef(0);
  const rangeRef = useRef({ rangeMin, rangeMax });
  const onChangeRef = useRef(onChange);
  const activeThumb = useRef<'min' | 'max'>('min');

  rangeRef.current = { rangeMin, rangeMax };
  onChangeRef.current = onChange;

  const clampValue = (value: number) =>
    Math.max(minValue, Math.min(maxValue, Math.round(value)));

  const valueFromPageX = (pageX: number) => {
    const width = trackWidthRef.current;
    if (width <= 0) return minValue;
    const localX = pageX - trackPageX.current;
    const ratio = Math.max(0, Math.min(1, localX / width));
    return minValue + ratio * (maxValue - minValue);
  };

  const updateThumb = (pageX: number, thumb: 'min' | 'max') => {
    const nextVal = clampValue(valueFromPageX(pageX));
    const { rangeMin: curMin, rangeMax: curMax } = rangeRef.current;

    if (thumb === 'min') {
      const nextMin = Math.min(nextVal, curMax);
      if (nextMin !== curMin) onChangeRef.current(nextMin, curMax);
    } else {
      const nextMax = Math.max(nextVal, curMin);
      if (nextMax !== curMax) onChangeRef.current(curMin, nextMax);
    }
  };

  const syncTrackOrigin = (pageX?: number, thumb: 'min' | 'max' = 'min') => {
    trackRef.current?.measureInWindow((x) => {
      trackPageX.current = x;
      if (pageX != null) updateThumb(pageX, thumb);
    });
  };

  const makePan = (thumb: 'min' | 'max') =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        activeThumb.current = thumb;
        syncTrackOrigin(evt.nativeEvent.pageX, thumb);
      },
      onPanResponderMove: (evt) => updateThumb(evt.nativeEvent.pageX, thumb),
    });

  const panMin = useRef(makePan('min')).current;
  const panMax = useRef(makePan('max')).current;

  const onLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setTrackWidth(width);
    trackWidthRef.current = width;
    syncTrackOrigin();
  };

  const minRatio = (rangeMin - minValue) / (maxValue - minValue);
  const maxRatio = (rangeMax - minValue) / (maxValue - minValue);
  const fillLeft = minRatio * trackWidth;
  const fillWidth = Math.max(0, (maxRatio - minRatio) * trackWidth);

  return (
    <View>
      <NativeViewGestureHandler>
        <View style={styles.trackWrap} onLayout={onLayout} ref={trackRef}>
          <View style={styles.track} />
          {trackWidth > 0 ? (
            <View
              style={[
                styles.fill,
                { left: fillLeft, width: fillWidth, backgroundColor: accent },
              ]}
            />
          ) : null}
          <View
            style={[
              styles.thumb,
              {
                left: Math.max(0, minRatio * trackWidth - THUMB_SIZE / 2),
                borderColor: accent,
              },
            ]}
            {...panMin.panHandlers}
          />
          <View
            style={[
              styles.thumb,
              {
                left: Math.max(0, maxRatio * trackWidth - THUMB_SIZE / 2),
                borderColor: accent,
              },
            ]}
            {...panMax.panHandlers}
          />
        </View>
      </NativeViewGestureHandler>
      <View style={styles.labels}>
        <Text style={styles.edge}>{formatSumLabel(minValue)}</Text>
        <Text style={styles.edge}>{formatSumLabel(Math.round((minValue + maxValue) / 2))}</Text>
        <Text style={styles.edge}>{formatSumLabel(maxValue)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  trackWrap: {
    height: 32,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  track: {
    height: 4,
    borderRadius: 999,
    backgroundColor: T.surface2,
  },
  fill: {
    position: 'absolute',
    top: 14,
    height: 4,
    borderRadius: 999,
  },
  thumb: {
    position: 'absolute',
    top: 6,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    borderWidth: 3,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  edge: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
  },
});
