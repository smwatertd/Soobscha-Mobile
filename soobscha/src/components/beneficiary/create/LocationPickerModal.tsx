import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPoint } from '../../../api/integrationTypes';
import { Button } from '../../Button';
import { Icon } from '../../Icon';
import {
  LocationPickerMap,
  LocationPickerMapHandle,
} from '../../../integrations/yandex/LocationPickerMap';
import { resetAddressSuggestions } from '../../../integrations/yandex/addressSuggest';
import { reverseGeocodePoint } from '../../../integrations/yandex/geocode';
import { DEFAULT_MAP_CENTER, distanceBetweenMapPointsMeters, MIN_REVERSE_GEOCODE_DISTANCE_M } from '../../../integrations/yandex/mapUtils';
import { resolveVolunteerMapPoint } from '../../../services/userLocation';
import { RADIUS, T, shadowMd } from '../../../theme/tokens';

const COORDS_ADDRESS = /^-?\d+\.\d+,\s*-?\d+\.\d+$/;
const GEOCODE_DEBOUNCE_MS = 600;

function isCoordsAddress(value: string): boolean {
  return COORDS_ADDRESS.test(value.trim());
}

function formatCoordsFallback(point: MapPoint): string {
  return `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;
}

type Props = {
  visible: boolean;
  initialPoint?: MapPoint | null;
  initialAddress?: string;
  onClose: () => void;
  onConfirm: (point: MapPoint, address: string) => void;
};

export function LocationPickerModal({
  visible,
  initialPoint,
  initialAddress = '',
  onClose,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<LocationPickerMapHandle>(null);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodeRequestId = useRef(0);
  const lastGeocodedPoint = useRef<MapPoint | null>(null);
  const [point, setPoint] = useState<MapPoint | null>(initialPoint ?? null);
  const [address, setAddress] = useState(initialAddress);
  const [geocoding, setGeocoding] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<MapPoint | null>(null);
  const [mapCenter, setMapCenter] = useState<MapPoint>(initialPoint ?? DEFAULT_MAP_CENTER);

  useEffect(() => {
    if (!visible) return;
    setPoint(initialPoint ?? null);
    setAddress(initialAddress);
    setMapCenter(initialPoint ?? DEFAULT_MAP_CENTER);
    setGeocoding(false);
    setUserLocation(null);
    lastGeocodedPoint.current = initialPoint ?? null;

    let cancelled = false;
    void resolveVolunteerMapPoint({ silent: true, preferFresh: true }).then((point) => {
      if (!cancelled && point) setUserLocation(point);
    });

    return () => {
      cancelled = true;
      resetAddressSuggestions().catch(() => undefined);
    };
  }, [visible, initialPoint, initialAddress]);

  const scheduleGeocode = useCallback((next: MapPoint) => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);

    const previous = lastGeocodedPoint.current;
    if (
      previous &&
      distanceBetweenMapPointsMeters(previous, next) < MIN_REVERSE_GEOCODE_DISTANCE_M
    ) {
      return;
    }

    const requestId = geocodeRequestId.current + 1;
    geocodeRequestId.current = requestId;
    setGeocoding(true);

    geocodeTimer.current = setTimeout(async () => {
      const formatted = await reverseGeocodePoint(next);
      if (geocodeRequestId.current !== requestId) return;

      lastGeocodedPoint.current = next;
      setAddress(isCoordsAddress(formatted) ? '' : formatted);
      setGeocoding(false);
    }, GEOCODE_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    };
  }, []);

  const handlePointChange = (next: MapPoint) => {
    setPoint(next);
    setMapCenter(next);
    scheduleGeocode(next);
  };

  const handleMyLocation = () => {
    setGeoLoading(true);
    void resolveVolunteerMapPoint({ preferFresh: true })
      .then((fresh) => {
        if (!fresh) return;
        setUserLocation(fresh);
        handlePointChange(fresh);
      })
      .finally(() => {
        setGeoLoading(false);
      });
  };

  const handleConfirm = () => {
    if (!point) return;
    const resolvedAddress =
      address.trim() ||
      (geocoding ? '' : formatCoordsFallback(point));
    Keyboard.dismiss();
    onConfirm(point, resolvedAddress.trim() || formatCoordsFallback(point));
    onClose();
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const addressLabel = !point
    ? 'Нажмите на карту, чтобы указать место встречи'
    : geocoding && !address
      ? 'Определяем адрес…'
      : address || 'Не удалось определить адрес';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} hitSlop={8} style={styles.backBtn}>
            <Icon name="arrowL" size={22} color={T.ink} />
          </Pressable>
          <Text style={styles.title}>Место встречи</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.mapWrap}>
          <LocationPickerMap
            ref={mapRef}
            value={point}
            userLocation={userLocation}
            onChange={handlePointChange}
            initialCenter={mapCenter}
            initialZoom={point ? 16 : 12}
            style={StyleSheet.absoluteFill}
          />

          <Pressable
            style={[styles.geoFab, shadowMd]}
            onPress={handleMyLocation}
            disabled={geoLoading}
          >
            {geoLoading ? (
              <ActivityIndicator color={T.primary} size="small" />
            ) : (
              <Icon name="target" size={22} color={T.primary} strokeWidth={2} />
            )}
          </Pressable>
        </View>

        <View style={[styles.panel, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.panelLabel}>Адрес</Text>
          {point ? (
            <View style={styles.addressRow}>
              {geocoding ? (
                <ActivityIndicator color={T.primary} size="small" />
              ) : null}
              <Text
                style={[
                  styles.addressText,
                  geocoding && address ? styles.addressPending : null,
                ]}
              >
                {addressLabel}
              </Text>
            </View>
          ) : (
            <Text style={styles.addressText}>{addressLabel}</Text>
          )}
          <Button kind="primary" size="lg" full onPress={handleConfirm} disabled={!point}>
            Готово
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  mapWrap: {
    flex: 1,
    position: 'relative',
  },
  geoFab: {
    position: 'absolute',
    right: 12,
    bottom: 52,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  panel: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
    backgroundColor: T.bg,
  },
  panelLabel: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
  },
  addressText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Manrope_500Medium',
    color: T.ink,
    lineHeight: 21,
  },
  addressPending: {
    color: T.muted,
  },
});
