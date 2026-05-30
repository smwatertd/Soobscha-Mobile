import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewToken,
} from 'react-native';
import { Image } from 'expo-image';
import { Icon } from '../Icon';
import { isImageContentType } from '../../utils/helpRequestPhotos';
import { INLINE_SECTION_BG, T } from '../../theme/tokens';
import { MediaViewerItem } from './MediaFullscreenViewer';

type Props = {
  items: MediaViewerItem[];
  onImagePress?: (index: number) => void;
  contentPadding?: number;
};

export function MediaImageCarousel({ items, onImagePress, contentPadding = 40 }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const slideWidth = windowWidth - contentPadding;
  const [index, setIndex] = useState(0);

  const images = useMemo(
    () => items.filter((item) => isImageContentType(item.contentType)),
    [items],
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const next = viewableItems[0]?.index;
      if (typeof next === 'number') {
        setIndex(next);
      }
    },
    [],
  );

  if (!images.length) {
    return (
      <View style={[styles.placeholder, { width: slideWidth, aspectRatio: 4 / 3 }]}>
        <Icon name="handshake" size={40} color={T.primary} strokeWidth={1.6} />
      </View>
    );
  }

  return (
    <View style={{ width: slideWidth }}>
      <FlatList
        data={images}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        bounces={images.length > 1}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        getItemLayout={(_, i) => ({ length: slideWidth, offset: slideWidth * i, index: i })}
        renderItem={({ item, index: imageIndex }) => (
          <Pressable
            style={[styles.slide, { width: slideWidth }]}
            onPress={() => onImagePress?.(imageIndex)}
            disabled={!onImagePress}
          >
            <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </Pressable>
        )}
      />

      {images.length > 1 ? (
        <View style={styles.dots} pointerEvents="none">
          {images.map((item, dotIndex) => (
            <View
              key={item.id}
              style={[styles.dot, dotIndex === index && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: INLINE_SECTION_BG,
  },
  slide: {
    aspectRatio: 4 / 3,
  },
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#fff',
  },
});
