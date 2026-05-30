import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPoint } from '../../../api/integrationTypes';
import { Icon } from '../../Icon';
import { LocationPickerMap } from '../../../integrations/yandex/LocationPickerMap';
import { isYandexMapsConfigured, DEFAULT_MAP_CENTER } from '../../../integrations/yandex/mapUtils';
import { RADIUS, T, CARD_BG, shadowSm } from '../../../theme/tokens';

type Props = {
  point: MapPoint | null;
  onPress?: () => void;
  /** Тап по превью (например, открыть маршрут во внешних картах). */
  onMapPress?: () => void;
  readOnly?: boolean;
  compact?: boolean;
  addressLabel?: string | null;
};

export function HelpRequestLocationPreview({
  point,
  onPress,
  onMapPress,
  readOnly = false,
  compact = false,
  addressLabel,
}: Props) {
  const configured = isYandexMapsConfigured();
  const mapBody = (
    <>
      {configured ? (
        <View style={styles.mapWrap} pointerEvents="none">
          <LocationPickerMap
            value={point}
            onChange={() => {}}
            initialCenter={point ?? DEFAULT_MAP_CENTER}
            initialZoom={point ? 15 : 11}
            interactive={false}
            style={styles.map}
          />
          {!point && (
            <View style={styles.hintOverlay} pointerEvents="none">
              <View style={styles.hint}>
                <Text style={styles.hintText}>Нажмите «Выбрать», чтобы указать место на карте</Text>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.fallback}>
          <Icon name="pin" size={28} color={T.primary} />
          <Text style={styles.fallbackText}>Карта недоступна — задайте EXPO_PUBLIC_YANDEX_MAPS_API_KEY</Text>
        </View>
      )}
      {!readOnly && onPress ? (
        <Pressable style={styles.editBtn} onPress={onPress}>
          <Icon name="edit" size={12} color={T.primary} strokeWidth={2} />
          <Text style={styles.editText}>{point ? 'Изменить' : 'Выбрать'}</Text>
        </Pressable>
      ) : null}
      {readOnly && onMapPress && point ? (
        <View style={styles.openMapHint} pointerEvents="none">
          <Text style={styles.openMapHintText}>Нажмите, чтобы открыть карту</Text>
        </View>
      ) : null}
      {readOnly && addressLabel ? (
        <View style={styles.addressOverlay}>
          <Icon name="pin" size={14} color={T.primary} strokeWidth={2.2} />
          <Text style={styles.addressOverlayText} numberOfLines={2}>
            {addressLabel}
          </Text>
        </View>
      ) : null}
    </>
  );

  const wrapStyle = [
    styles.wrap,
    compact && styles.wrapCompact,
    readOnly && !compact && styles.wrapDetail,
    shadowSm,
  ];

  if (readOnly && onMapPress && point) {
    return (
      <Pressable style={wrapStyle} onPress={onMapPress} accessibilityRole="button">
        {mapBody}
      </Pressable>
    );
  }

  return <View style={wrapStyle}>{mapBody}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    height: 180,
    marginTop: 8,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#E5EBE4',
    borderWidth: 1,
    borderColor: T.borderSoft,
    position: 'relative',
  },
  wrapCompact: {
    height: 110,
  },
  wrapDetail: {
    height: 132,
  },
  mapWrap: {
    flex: 1,
  },
  map: {
    flex: 1,
    borderRadius: 0,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    backgroundColor: T.surface2,
  },
  fallbackText: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
    textAlign: 'center',
    lineHeight: 17,
  },
  hintOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
  },
  hint: {
    margin: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  hintText: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
    textAlign: 'center',
  },
  editBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    zIndex: 2,
  },
  editText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.primary,
  },
  addressOverlay: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 2,
  },
  addressOverlayText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink,
  },
  openMapHint: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    left: 12,
    right: 12,
    alignItems: 'center',
    zIndex: 2,
  },
  openMapHintText: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
});
