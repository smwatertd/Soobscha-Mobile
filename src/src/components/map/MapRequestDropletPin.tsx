import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../Icon';
import { CachedImage } from '../media/CachedImage';
import { T } from '../../theme/tokens';

export const MAP_DROPLET_WIDTH = 52;
export const MAP_DROPLET_HEIGHT = 64;
const BUBBLE_SIZE = 46;
const IMAGE_SIZE = 40;

type Props = {
  mediaId?: string | null;
  previewImageUrl?: string | null;
  variant?: 'request' | 'material';
  selected?: boolean;
};

export function getMapRequestDropletPinSize(): { width: number; height: number } {
  return { width: MAP_DROPLET_WIDTH, height: MAP_DROPLET_HEIGHT };
}

export function MapRequestDropletPin({
  mediaId,
  previewImageUrl,
  variant = 'request',
  selected = false,
}: Props) {
  const accent = variant === 'material' ? T.accent : T.primary;

  return (
    <View style={[styles.wrap, selected && styles.wrapSelected]}>
      <View style={[styles.bubble, { borderColor: accent }]}>
        <View style={styles.imageClip}>
          {previewImageUrl ? (
            <Image
              source={{ uri: previewImageUrl }}
              style={styles.image}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : mediaId ? (
            <CachedImage mediaId={mediaId} variant="preview" style={styles.image} contentFit="cover" />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: variant === 'material' ? T.accentSoft : T.primarySoft }]}>
              <Icon
                name={variant === 'material' ? 'coin' : 'handshake'}
                size={22}
                color={accent}
              />
            </View>
          )}
        </View>
      </View>
      <View style={[styles.pointer, { borderTopColor: accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: MAP_DROPLET_WIDTH,
    height: MAP_DROPLET_HEIGHT,
    alignItems: 'center',
  },
  wrapSelected: {
    transform: [{ scale: 1.08 }],
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: 3,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 2,
  },
  imageClip: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: T.surface2,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  placeholder: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointer: {
    position: 'absolute',
    bottom: 4,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 1,
  },
});
