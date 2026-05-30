import { useCallback, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { Image } from 'expo-image';
import { CachedImage } from '../../media/CachedImage';
import { Icon, IconName } from '../../Icon';
import {
  HelpRequestMediaItem,
  splitHelpRequestMedia,
} from '../../../utils/parseHelpRequestMediaFiles';
import { INLINE_SECTION_BG, RADIUS, T, CARD_BG } from '../../../theme/tokens';

type Props = {
  mediaItems: HelpRequestMediaItem[];
  placeholderIcon: IconName;
  accent: string;
  rounded?: boolean;
  embeddedInCard?: boolean;
  /** Высота героя на экране заявки (иначе aspectRatio) */
  heroHeight?: number;
  /** Ширина / высота слайда, по умолчанию 4/3 */
  aspectRatio?: number;
  showDocuments?: boolean;
  onOpenViewer?: (index: number) => void;
  onSlideChange?: (index: number) => void;
};

export function HelpRequestDetailMediaSection({
  mediaItems,
  placeholderIcon,
  accent,
  rounded = true,
  embeddedInCard = false,
  heroHeight,
  aspectRatio = 4 / 3,
  showDocuments = true,
  onOpenViewer,
  onSlideChange,
}: Props) {
  const { images, documents } = splitHelpRequestMedia(mediaItems);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const next = viewableItems[0]?.index;
      if (typeof next === 'number') {
        setIndex(next);
        onSlideChange?.(next);
      }
    },
    [onSlideChange],
  );

  const openDocument = useCallback(async (item: HelpRequestMediaItem) => {
    const url = item.url;
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      // ignore
    }
  }, []);

  const slideDimensions =
    width > 0
      ? heroHeight != null
        ? { width, height: heroHeight }
        : embeddedInCard
          ? { width, height: width * (3 / 4) }
          : { width, aspectRatio }
      : heroHeight != null
        ? { width: '100%' as const, height: heroHeight }
        : styles.slideMeasure;

  const slideStyle = embeddedInCard
    ? width > 0
      ? slideDimensions
      : heroHeight != null
        ? { width: '100%' as const, height: heroHeight }
        : styles.slideMeasure
    : slideDimensions;

  const renderImage = (item: HelpRequestMediaItem, imageIndex: number) => {
    const uri = item.previewUrl || item.url;
    const content = uri ? (
      <Image source={{ uri }} style={styles.image} contentFit="cover" />
    ) : (
      <CachedImage mediaId={item.mediaId} style={styles.image} contentFit="cover" />
    );

    return (
      <Pressable
        style={slideStyle}
        onPress={() => onOpenViewer?.(imageIndex)}
        disabled={!onOpenViewer}
      >
        {content}
      </Pressable>
    );
  };

  const heroStyle = [
    styles.hero,
    embeddedInCard && styles.heroEmbedded,
    rounded && !embeddedInCard && styles.heroRounded,
  ];

  return (
    <View style={[styles.root, embeddedInCard && styles.rootEmbedded]}>
      <View
        style={heroStyle}
        onLayout={(event) => {
          const nextWidth = event.nativeEvent.layout.width;
          if (nextWidth > 0) setWidth(nextWidth);
        }}
      >
        {images.length === 0 ? (
          <View
            style={[
              styles.placeholder,
              heroHeight != null && { height: heroHeight, aspectRatio: undefined },
              !heroHeight && !embeddedInCard && { aspectRatio },
            ]}
          >
            <Icon name={placeholderIcon} size={32} color={accent} strokeWidth={1.6} />
          </View>
        ) : width > 0 ? (
          <>
            <FlatList
              data={images}
              keyExtractor={(item) => item.mediaId}
              horizontal
              pagingEnabled
              nestedScrollEnabled
              directionalLockEnabled
              showsHorizontalScrollIndicator={false}
              bounces={images.length > 1}
              scrollEventThrottle={16}
              decelerationRate="fast"
              disableIntervalMomentum
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
              getItemLayout={(_, i) => ({
                length: width,
                offset: width * i,
                index: i,
              })}
              style={
                embeddedInCard
                  ? { width, height: width * (3 / 4) }
                  : heroHeight != null && width > 0
                    ? { width, height: heroHeight }
                    : undefined
              }
              renderItem={({ item, index: imageIndex }) => renderImage(item, imageIndex)}
            />
            {images.length > 1 ? (
              <View style={styles.dots} pointerEvents="none">
                {images.map((item, dotIndex) => (
                  <View
                    key={item.mediaId}
                    style={[styles.dot, dotIndex === index && styles.dotActive]}
                  />
                ))}
              </View>
            ) : null}
          </>
        ) : (
          renderImage(images[0], 0)
        )}
      </View>

      {showDocuments && documents.length > 0 ? (
        <View style={[styles.documents, embeddedInCard && styles.documentsEmbedded]}>
          <Text style={styles.documentsTitle}>Документы</Text>
          {documents.map((item) => (
            <Pressable
              key={item.mediaId}
              style={styles.documentRow}
              onPress={() => openDocument(item)}
            >
              <View style={styles.documentIcon}>
                <Icon name="document" size={18} color={T.ink2} strokeWidth={2} />
              </View>
              <Text style={styles.documentName} numberOfLines={2}>
                {item.fileName}
              </Text>
              <Icon name="chevR" size={16} color={T.muted} strokeWidth={2.2} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function HelpRequestDetailDocuments({
  mediaItems,
}: {
  mediaItems: HelpRequestMediaItem[];
}) {
  const { documents } = splitHelpRequestMedia(mediaItems);
  const openDocument = useCallback(async (item: HelpRequestMediaItem) => {
    const url = item.url;
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      // ignore
    }
  }, []);

  if (!documents.length) return null;

  return (
    <View style={styles.documentsBlock}>
      <Text style={styles.documentsTitle}>Документы</Text>
      {documents.map((item) => (
        <Pressable
          key={item.mediaId}
          style={styles.documentRow}
          onPress={() => openDocument(item)}
        >
          <View style={styles.documentIcon}>
            <Icon name="document" size={18} color={T.ink2} strokeWidth={2} />
          </View>
          <Text style={styles.documentName} numberOfLines={2}>
            {item.fileName}
          </Text>
          <Icon name="chevR" size={16} color={T.muted} strokeWidth={2.2} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  rootEmbedded: {
    gap: 0,
  },
  hero: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: INLINE_SECTION_BG,
  },
  heroEmbedded: {
    aspectRatio: 4 / 3,
    backgroundColor: INLINE_SECTION_BG,
  },
  heroRounded: {
    borderRadius: RADIUS.lg,
  },
  placeholder: {
    aspectRatio: 4 / 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: INLINE_SECTION_BG,
  },
  slideMeasure: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  image: {
    width: '100%',
    height: '100%',
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
  documents: {
    gap: 8,
  },
  documentsEmbedded: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  documentsBlock: {
    gap: 8,
    marginBottom: 16,
  },
  documentsTitle: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  documentIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentName: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
});
