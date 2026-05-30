import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Yamap, YamapRef } from 'react-native-yamap-plus';
import { MapGeoPinsOverlay, MapGeoPinDescriptor } from '../../components/map/MapGeoPinsOverlay';
import { MapPoint } from '../../api/integrationTypes';
import { Icon } from '../../components/Icon';
import { resolveVolunteerMapPoint } from '../../services/userLocation';
import { T, shadowMd } from '../../theme/tokens';
import { useYamapReady } from './initYamap';
import {
  DEFAULT_MAP_CENTER,
  isYandexMapsConfigured,
  toYamapPoint,
} from './mapUtils';
import { useYamapScreenPins, YamapGeoPin } from './useYamapScreenPins';

type Props = {
  requestPoint: MapPoint;
  style?: ViewStyle;
};

const REQUEST_PIN_ID = '__request__';
const USER_PIN_ID = '__user__';

export function HelpRequestRouteMapView({ requestPoint, style }: Props) {
  const yamapReady = useYamapReady();
  const mapRef = useRef<YamapRef>(null);
  const [mapReady, setMapReady] = useState(false);
  const [userPoint, setUserPoint] = useState<MapPoint | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const geoPins = useMemo<YamapGeoPin[]>(() => {
    const items: YamapGeoPin[] = [
      { id: REQUEST_PIN_ID, point: requestPoint },
    ];
    if (userPoint) {
      items.push({ id: USER_PIN_ID, point: userPoint });
    }
    return items;
  }, [requestPoint, userPoint]);

  const { positions, scheduleUpdate } = useYamapScreenPins(mapRef, geoPins, mapReady);

  const overlayPins = useMemo<MapGeoPinDescriptor[]>(() => {
    const items: MapGeoPinDescriptor[] = [
      {
        id: REQUEST_PIN_ID,
        variant: 'request',
        size: 'md',
      },
    ];
    if (userPoint) {
      items.push({
        id: USER_PIN_ID,
        variant: 'user',
        size: 'md',
      });
    }
    return items;
  }, [userPoint]);

  const fitCamera = useCallback(() => {
    if (!mapReady || !mapRef.current) return;

    const points = userPoint ? [requestPoint, userPoint] : [requestPoint];
    const yamapPoints = points.map(toYamapPoint);
    if (points.length === 1) {
      mapRef.current.setCenter(yamapPoints[0], 15, 0, 0, 0.35);
      scheduleUpdate();
      return;
    }
    mapRef.current.fitMarkers?.(yamapPoints, 0.45);
    scheduleUpdate();
  }, [mapReady, requestPoint, scheduleUpdate, userPoint]);

  useEffect(() => {
    let cancelled = false;
    void resolveVolunteerMapPoint({ silent: true, preferFresh: true }).then((point) => {
      if (!cancelled && point) setUserPoint(point);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    fitCamera();
  }, [fitCamera, mapReady]);

  const handleMapLoaded = useCallback(() => {
    setMapReady(true);
  }, []);

  const handleCameraChange = useCallback(() => {
    scheduleUpdate();
  }, [scheduleUpdate]);

  const handleCenterOnUser = () => {
    setGeoLoading(true);
    void resolveVolunteerMapPoint({ preferFresh: true })
      .then((fresh) => {
        if (!fresh) return;
        setUserPoint(fresh);
        mapRef.current?.setCenter(toYamapPoint(fresh), 15, 0, 0, 0.35);
      })
      .finally(() => {
        setGeoLoading(false);
      });
  };

  if (!isYandexMapsConfigured() || !yamapReady) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>
          Карта недоступна — задайте EXPO_PUBLIC_YANDEX_MAPS_API_KEY
        </Text>
      </View>
    );
  }

  const initial = userPoint ?? requestPoint ?? DEFAULT_MAP_CENTER;

  return (
    <View style={[styles.wrap, style]}>
      <Yamap
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          lat: initial.latitude,
          lon: initial.longitude,
          zoom: 14,
        }}
        showUserPosition={false}
        onMapLoaded={handleMapLoaded}
        onCameraPositionChange={handleCameraChange}
        onCameraPositionChangeEnd={handleCameraChange}
      />

      <MapGeoPinsOverlay positions={positions} pins={overlayPins} />

      <View style={styles.legend} pointerEvents="none">
        <View style={styles.legendItem}>
          <View style={styles.legendDotRequest} />
          <Text style={styles.legendText}>Место заявки</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendDotUser} />
          <Text style={styles.legendText}>Вы</Text>
        </View>
      </View>

      <Pressable
        style={[styles.geoFab, shadowMd]}
        onPress={handleCenterOnUser}
        disabled={geoLoading}
        accessibilityRole="button"
        accessibilityLabel="Показать моё местоположение"
      >
        {geoLoading ? (
          <ActivityIndicator color={T.primary} size="small" />
        ) : (
          <Icon name="target" size={22} color={T.primary} strokeWidth={2} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: T.surface2,
    position: 'relative',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: T.surface2,
  },
  fallbackText: {
    textAlign: 'center',
    color: T.muted,
    fontFamily: 'Manrope_500Medium',
    lineHeight: 20,
  },
  legend: {
    position: 'absolute',
    top: 12,
    left: 12,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    zIndex: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotRequest: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  legendDotUser: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Manrope_500Medium',
    color: T.ink2,
  },
  geoFab: {
    position: 'absolute',
    right: 12,
    bottom: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
});
