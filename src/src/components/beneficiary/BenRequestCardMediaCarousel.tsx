import { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ViewToken,
} from 'react-native';
import { Image } from 'expo-image';
import { CachedImage } from '../media/CachedImage';
import { Icon, IconName } from '../Icon';
import { HelpRequestImageSlide } from '../../utils/parseHelpRequestMediaFiles';

const ASPECT_RATIO = 4 / 3;

type Props = {
  slides: HelpRequestImageSlide[];
  placeholderIcon: IconName;
  accent: string;
  onInteractionChange?: (active: boolean) => void;
  onPress?: () => void;
};

function slideSize(width: number) {
  return { width, height: Math.round(width / ASPECT_RATIO) };
}

function CarouselSlide({
  slide,
  width,
  onPress,
}: {
  slide: HelpRequestImageSlide;
  width: number;
  onPress?: () => void;
}) {
  const { width: slideWidth, height: slideHeight } = slideSize(width);
  const frameStyle = { width: slideWidth, height: slideHeight };

  return (
    <Pressable onPress={onPress} disabled={!onPress} style={frameStyle}>
      {slide.uri ? (
        <Image source={{ uri: slide.uri }} style={frameStyle} contentFit="cover" />
      ) : (
        <CachedImage mediaId={slide.mediaId} style={frameStyle} contentFit="cover" />
      )}
    </Pressable>
  );
}

export function BenRequestCardMediaCarousel({
  slides,
  placeholderIcon,
  accent,
  onInteractionChange,
  onPress,
}: Props) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const interactionRef = useRef(false);

  const setInteraction = useCallback(
    (active: boolean) => {
      if (interactionRef.current === active) return;
      interactionRef.current = active;
      onInteractionChange?.(active);
    },
    [onInteractionChange],
  );

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0) {
      setWidth(nextWidth);
    }
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const next = viewableItems[0]?.index;
      if (typeof next === 'number') {
        setIndex(next);
      }
    },
    [],
  );

  const onScrollBeginDrag = useCallback(() => {
    setInteraction(true);
  }, [setInteraction]);

  const finishInteraction = useCallback(() => {
    setInteraction(false);
  }, [setInteraction]);

  const scrollable = slides.length > 1;
  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 60 }), []);
  const measureFrame = useMemo(() => slideSize(width > 0 ? width : 320), [width]);

  if (!slides.length) {
    return (
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={[styles.placeholder, { backgroundColor: `${accent}22` }]}
      >
        <Icon name={placeholderIcon} size={32} color={accent} strokeWidth={1.6} />
      </Pressable>
    );
  }

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      {width > 0 ? (
        <FlatList
          data={slides}
          keyExtractor={(item) => item.mediaId}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          directionalLockEnabled
          scrollEnabled={scrollable}
          showsHorizontalScrollIndicator={false}
          bounces={scrollable}
          scrollEventThrottle={16}
          decelerationRate="fast"
          disableIntervalMomentum
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={finishInteraction}
          onMomentumScrollEnd={finishInteraction}
          getItemLayout={(_, i) => ({
            length: width,
            offset: width * i,
            index: i,
          })}
          renderItem={({ item }) => (
            <CarouselSlide slide={item} width={width} onPress={onPress} />
          )}
        />
      ) : (
        <View style={[styles.measure, { height: measureFrame.height }]}>
          <CarouselSlide slide={slides[0]} width={measureFrame.width} onPress={onPress} />
        </View>
      )}

      {scrollable ? (
        <View style={styles.dots} pointerEvents="none">
          {slides.map((slide, dotIndex) => (
            <View
              key={slide.mediaId}
              style={[styles.dot, dotIndex === index && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  measure: {
    width: '100%',
  },
  placeholder: {
    aspectRatio: ASPECT_RATIO,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
