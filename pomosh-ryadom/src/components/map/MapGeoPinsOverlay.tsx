import { Pressable, StyleSheet, View } from 'react-native';
import { MapClusterPin, getMapClusterPinSize } from './MapClusterPin';
import {
  getMapRequestDropletPinSize,
  MapRequestDropletPin,
} from './MapRequestDropletPin';
import {
  getPulsingPinSize,
  PulsingMapCenterPin,
} from './PulsingMapCenterPin';

export type MapGeoPinDescriptor = {
  id: string;
  variant: 'user' | 'request' | 'material' | 'cluster';
  size?: 'sm' | 'smPlus' | 'md' | 'lg';
  clusterCount?: number;
  selected?: boolean;
  animated?: boolean;
  mediaId?: string | null;
  previewImageUrl?: string | null;
  onPress?: () => void;
};

type Props = {
  positions: Record<string, { x: number; y: number }>;
  pins: MapGeoPinDescriptor[];
};

function isDropletVariant(variant: MapGeoPinDescriptor['variant']): boolean {
  return variant === 'request' || variant === 'material';
}

function resolvePinLayoutAt(
  point: { x: number; y: number },
  pin: MapGeoPinDescriptor,
): { width: number; height: number; left: number; top: number } {
  if (pin.variant === 'cluster') {
    const size = getMapClusterPinSize();
    return {
      width: size,
      height: size,
      left: point.x - size / 2,
      top: point.y - size / 2,
    };
  }

  if (isDropletVariant(pin.variant)) {
    const { width, height } = getMapRequestDropletPinSize();
    return {
      width,
      height,
      left: point.x - width / 2,
      top: point.y - height,
    };
  }

  const pinSize = getPulsingPinSize(pin.size ?? 'md');
  return {
    width: pinSize,
    height: pinSize,
    left: point.x - pinSize / 2,
    top: point.y - pinSize / 2,
  };
}

export function MapGeoPinsOverlay({ positions, pins }: Props) {
  return (
    <>
      {pins.map((pin) => {
        const point = positions[pin.id];
        if (!point) return null;

        const layout = resolvePinLayoutAt(point, pin);

        const content =
          pin.variant === 'cluster' ? (
            <MapClusterPin count={pin.clusterCount ?? 0} selected={pin.selected} />
          ) : isDropletVariant(pin.variant) ? (
            <MapRequestDropletPin
              mediaId={pin.mediaId}
              previewImageUrl={pin.previewImageUrl}
              variant={pin.variant}
              selected={pin.selected}
            />
          ) : (
            <PulsingMapCenterPin
              animated={pin.animated ?? false}
              size={pin.size ?? 'md'}
              variant={pin.variant}
            />
          );

        const zIndex =
          pin.variant === 'user' ? 4 : pin.selected ? 5 : isDropletVariant(pin.variant) ? 3 : 2;

        if (pin.onPress) {
          return (
            <Pressable
              key={pin.id}
              onPress={pin.onPress}
              style={[
                styles.pin,
                {
                  left: layout.left,
                  top: layout.top,
                  width: layout.width,
                  height: layout.height,
                  zIndex,
                },
              ]}
              hitSlop={8}
            >
              {content}
            </Pressable>
          );
        }

        return (
          <View
            key={pin.id}
            pointerEvents="none"
            style={[
              styles.pin,
              {
                left: layout.left,
                top: layout.top,
                width: layout.width,
                height: layout.height,
                zIndex,
              },
            ]}
          >
            {content}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  pin: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
