import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../Icon';
import { isImageContentType } from '../../utils/helpRequestPhotos';
import { ZoomableImage } from './ZoomableImage';

export type MediaViewerItem = {
  id: string;
  uri: string;
  fileName: string;
  contentType: string;
  caption?: string;
};

type Props = {
  visible: boolean;
  items: MediaViewerItem[];
  initialIndex?: number;
  subtitle?: string;
  onClose: () => void;
  onSaved?: (message: string) => void;
  onError?: (message: string) => void;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function MediaFullscreenViewer({
  visible,
  items,
  initialIndex = 0,
  subtitle,
  onClose,
  onSaved,
  onError,
}: Props) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<MediaViewerItem>>(null);
  const zoomResetRefs = useRef<Record<number, () => void>>({});
  const indexRef = useRef(initialIndex);

  const [index, setIndex] = useState(initialIndex);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [zoomActive, setZoomActive] = useState(false);
  const [pinching, setPinching] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const chromeOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    Animated.timing(chromeOpacity, {
      toValue: uiVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [uiVisible, chromeOpacity]);

  const toggleUi = useCallback(() => {
    setUiVisible((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const safeIndex = items.length ? Math.min(initialIndex, items.length - 1) : 0;
    setIndex(safeIndex);
    setZoomActive(false);
    setPinching(false);
    setUiVisible(true);
    chromeOpacity.setValue(1);
    requestAnimationFrame(() => {
      if (items.length > 0) {
        listRef.current?.scrollToIndex({ index: safeIndex, animated: false });
      }
    });
  }, [visible, initialIndex, items.length, chromeOpacity]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const next = viewableItems[0]?.index;
    if (typeof next === 'number' && next !== indexRef.current) {
      zoomResetRefs.current[indexRef.current]?.();
      setZoomActive(false);
      setIndex(next);
    }
  }, []);

  const goTo = (next: number) => {
    if (next < 0 || next >= items.length) return;
    zoomResetRefs.current[index]?.();
    setZoomActive(false);
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  };

  const rotateBy = (delta: number) => {
    setRotations((prev) => ({ ...prev, [index]: (prev[index] ?? 0) + delta }));
  };

  const resetView = () => {
    setRotations((prev) => ({ ...prev, [index]: 0 }));
    zoomResetRefs.current[index]?.();
    setZoomActive(false);
  };

  const shareCurrent = async () => {
    const current = items[index];
    if (!current?.uri) return;
    try {
      await Share.share({ url: current.uri, message: current.fileName });
    } catch {
      onError?.('Не удалось поделиться файлом');
    }
  };

  const saveCurrent = async () => {
    const current = items[index];
    if (!current?.uri) return;
    try {
      const safeName = current.fileName.replace(/[^\w.\-()+\u0400-\u04FF]/g, '_');
      const dest = `${FileSystem.cacheDirectory ?? ''}${safeName}`;
      const result = await FileSystem.downloadAsync(current.uri, dest);
      await Share.share({ url: result.uri, message: current.fileName });
      onSaved?.('Файл готов к сохранению');
    } catch {
      onError?.('Не удалось сохранить файл');
    }
  };

  const registerZoomReset = useCallback((itemIndex: number, reset: () => void) => {
    zoomResetRefs.current[itemIndex] = reset;
  }, []);

  const current = items[index];
  const isImage = current ? isImageContentType(current.contentType) : true;
  const caption = current?.caption ?? (items.length ? `Фото ${index + 1}` : '');

  const renderSlide = ({ item, index: itemIndex }: { item: MediaViewerItem; index: number }) => {
    const rotation = rotations[itemIndex] ?? 0;
    const imageLike = isImageContentType(item.contentType);

    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        {imageLike ? (
          <ZoomableImage
            uri={item.uri}
            rotation={rotation}
            style={styles.imageFrame}
            onZoomActiveChange={itemIndex === index ? setZoomActive : undefined}
            onPinchingChange={itemIndex === index ? setPinching : undefined}
            onResetRef={(reset) => registerZoomReset(itemIndex, reset)}
            onSingleTap={itemIndex === index ? toggleUi : undefined}
          />
        ) : (
          <View style={styles.docPreview}>
            <Icon name="document" size={56} color="rgba(255,255,255,0.85)" strokeWidth={1.4} />
            <Text style={styles.docName} numberOfLines={3}>
              {item.fileName}
            </Text>
            <Text style={styles.docHint}>Предпросмотр документа недоступен</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="light" />

        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          scrollEnabled={!zoomActive && !pinching}
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={items.length ? Math.min(initialIndex, items.length - 1) : 0}
          getItemLayout={(_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
          onScrollToIndexFailed={({ index: failedIndex }) => {
            requestAnimationFrame(() => {
              listRef.current?.scrollToOffset({
                offset: failedIndex * SCREEN_WIDTH,
                animated: false,
              });
            });
          }}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          renderItem={renderSlide}
          style={styles.list}
        />

        <Animated.View
          style={[styles.chromeLayer, { opacity: chromeOpacity }]}
          pointerEvents={uiVisible ? 'box-none' : 'none'}
        >
          {index > 0 ? (
            <Pressable style={[styles.navBtn, styles.navBtnLeft]} onPress={() => goTo(index - 1)}>
              <Icon name="chevL" size={22} color="#fff" strokeWidth={2.2} />
            </Pressable>
          ) : null}
          {index < items.length - 1 ? (
            <Pressable style={[styles.navBtn, styles.navBtnRight]} onPress={() => goTo(index + 1)}>
              <Icon name="chevR" size={22} color="#fff" strokeWidth={2.2} />
            </Pressable>
          ) : null}

          <LinearGradient
            colors={['rgba(0,0,0,0.92)', 'rgba(0,0,0,0.55)', 'transparent']}
            style={[styles.topGradient, { paddingTop: insets.top + 8 }]}
            pointerEvents="box-none"
          >
            <View style={styles.topBar}>
              <Pressable style={styles.hudBtn} onPress={onClose} hitSlop={8}>
                <Icon name="chevL" size={22} color="#fff" strokeWidth={2.2} />
              </Pressable>
              <View style={styles.topCenter}>
                <Text style={styles.counter}>
                  {items.length ? `${index + 1} / ${items.length}` : '0 / 0'}
                </Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              <Pressable style={styles.hudBtn} onPress={shareCurrent} hitSlop={8}>
                <Icon name="upload" size={20} color="#fff" strokeWidth={2} />
              </Pressable>
            </View>
          </LinearGradient>

          <View style={styles.bottomWrap} pointerEvents="box-none">
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.82)']}
              style={styles.footerMeta}
              pointerEvents="box-none"
            >
              {caption ? (
                <Text style={styles.caption} numberOfLines={2}>
                  {caption}
                </Text>
              ) : null}
              {items.length > 1 ? (
                <View style={styles.dots}>
                  {items.map((item, dotIndex) => (
                    <Pressable key={item.id} onPress={() => goTo(dotIndex)}>
                      <View style={[styles.dot, dotIndex === index && styles.dotActive]} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </LinearGradient>

            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
              {isImage ? (
                <View style={styles.toolbar}>
                  <ViewerTool icon="chevL" label="Повернуть −90°" onPress={() => rotateBy(-90)} />
                  <ViewerTool icon="chevR" label="Повернуть +90°" onPress={() => rotateBy(90)} />
                  <ViewerTool icon="target" label="Сбросить" onPress={resetView} />
                  <ViewerTool icon="upload" label="Сохранить" onPress={saveCurrent} />
                </View>
              ) : (
                <View style={styles.toolbar}>
                  <ViewerTool icon="upload" label="Сохранить" onPress={saveCurrent} />
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function ViewerTool({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.tool} onPress={onPress}>
      <View style={styles.toolIconWrap}>
        <Icon name={icon} size={18} color="#fff" strokeWidth={2} />
      </View>
      <Text style={styles.toolLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0E0F0E',
  },
  list: {
    flex: 1,
  },
  chromeLayer: {
    ...StyleSheet.absoluteFill,
  },
  slide: {
    flex: 1,
  },
  imageFrame: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  docPreview: {
    flex: 1,
    width: '100%',
    maxWidth: SCREEN_WIDTH * 0.8,
    alignSelf: 'center',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  docName: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: '#fff',
    textAlign: 'center',
  },
  docHint: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hudBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
  },
  counter: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: '#fff',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnLeft: {
    left: 8,
  },
  navBtnRight: {
    right: 8,
  },
  bottomWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  footerMeta: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 14,
  },
  caption: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    width: 22,
    backgroundColor: '#fff',
  },
  bottomBar: {
    backgroundColor: 'rgba(8,8,8,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    gap: 8,
  },
  tool: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  toolIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: {
    fontSize: 10,
    fontFamily: 'Manrope_600SemiBold',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 13,
  },
});
