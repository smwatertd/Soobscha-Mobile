import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Yamap, YamapRef } from 'react-native-yamap-plus';
import { MapGeoPinsOverlay, MapGeoPinDescriptor } from '../../components/map/MapGeoPinsOverlay';
import { MapPoint } from '../../api/integrationTypes';
import { getMapRequestCoverImage, MapHelpRequestPin } from '../../utils/mapHelpRequest';
import { clusterMapRequests, MapPinCluster } from '../../utils/clusterMapPins';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  isYandexMapsConfigured,
  toYamapPoint,
} from './mapUtils';
import { useYamapReady } from './initYamap';
import { useYamapScreenPins, YamapGeoPin } from './useYamapScreenPins';
import { T } from '../../theme/tokens';

export type HelpRequestsMapRef = {
  centerOn: (point: MapPoint, zoom?: number) => void;
  fitRequests: (requests: MapHelpRequestPin[]) => void;
  fitMapContent: (requests: MapHelpRequestPin[], user?: MapPoint | null) => void;
  zoomToCluster: (cluster: MapPinCluster) => void;
};

type Props = {
  requests: MapHelpRequestPin[];
  userLocation?: MapPoint | null;
  selectedRequestId?: string | null;
  loading?: boolean;
  style?: ViewStyle;
  initialCenter?: MapPoint;
  initialZoom?: number;
  onRequestPress?: (request: MapHelpRequestPin) => void;
  onClusterPress?: (cluster: MapPinCluster) => void;
  onMapPress?: () => void;
  onRegionChange?: (region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
    zoom?: number;
  }) => void;
};

const USER_PIN_ID = '__user__';
const MAP_PRESS_SUPPRESS_MS = 450;

function collectMapPoints(requests: MapHelpRequestPin[], user?: MapPoint | null): MapPoint[] {
  const points: MapPoint[] = [];
  if (user) points.push(user);
  for (const request of requests) {
    points.push({ latitude: request.latitude, longitude: request.longitude });
  }
  return points;
}

export const HelpRequestsMap = forwardRef<HelpRequestsMapRef, Props>(function HelpRequestsMap(
  {
    requests,
    userLocation = null,
    selectedRequestId = null,
    loading,
    style,
    initialCenter = DEFAULT_MAP_CENTER,
    initialZoom = DEFAULT_MAP_ZOOM,
    onRequestPress,
    onClusterPress,
    onMapPress,
    onRegionChange,
  },
  ref,
) {
  const yamapReady = useYamapReady();
  const mapRef = useRef<YamapRef>(null);
  const suppressMapPressUntilRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);

  const suppressNextMapPress = useCallback(() => {
    suppressMapPressUntilRef.current = Date.now() + MAP_PRESS_SUPPRESS_MS;
  }, []);

  const handleMapPress = useCallback(() => {
    if (Date.now() < suppressMapPressUntilRef.current) return;
    onMapPress?.();
  }, [onMapPress]);
  const [latitudeDelta, setLatitudeDelta] = useState(
    360 / Math.pow(2, initialZoom),
  );

  const mapCenter = userLocation ?? initialCenter;

  const { clusters, singles } = useMemo(
    () => clusterMapRequests(requests, latitudeDelta),
    [latitudeDelta, requests],
  );

  const geoPins = useMemo<YamapGeoPin[]>(() => {
    const items: YamapGeoPin[] = [];

    for (const cluster of clusters) {
      items.push({
        id: cluster.id,
        point: { latitude: cluster.latitude, longitude: cluster.longitude },
      });
    }

    for (const request of singles) {
      items.push({
        id: request.id,
        point: { latitude: request.latitude, longitude: request.longitude },
      });
    }

    if (userLocation) {
      items.push({ id: USER_PIN_ID, point: userLocation });
    }

    return items;
  }, [clusters, singles, userLocation]);

  const { positions, scheduleUpdate } = useYamapScreenPins(mapRef, geoPins, mapReady);

  const overlayPins = useMemo<MapGeoPinDescriptor[]>(() => {
    const items: MapGeoPinDescriptor[] = [];

    for (const cluster of clusters) {
      items.push({
        id: cluster.id,
        variant: 'cluster',
        clusterCount: cluster.count,
        onPress: onClusterPress
          ? () => {
              suppressNextMapPress();
              onClusterPress(cluster);
            }
          : undefined,
      });
    }

    for (const request of singles) {
      const cover = getMapRequestCoverImage(request);
      items.push({
        id: request.id,
        variant: request.type === 'MATERIAL' ? 'material' : 'request',
        size: 'md',
        selected: selectedRequestId === request.id,
        mediaId: cover.mediaId,
        previewImageUrl: cover.uri,
        onPress: onRequestPress
          ? () => {
              suppressNextMapPress();
              onRequestPress(request);
            }
          : undefined,
      });
    }

    if (userLocation) {
      items.push({
        id: USER_PIN_ID,
        variant: 'user',
        size: 'md',
      });
    }

    return items;
  }, [clusters, onClusterPress, onRequestPress, selectedRequestId, singles, suppressNextMapPress, userLocation]);

  const fitMapContent = useCallback(
    (items: MapHelpRequestPin[], user?: MapPoint | null) => {
      if (!mapRef.current) return;

      const points = collectMapPoints(items, user);
      if (points.length === 0) return;

      const yamapPoints = points.map(toYamapPoint);
      if (points.length === 1) {
        mapRef.current.setCenter(yamapPoints[0], 14, 0, 0, 0.35);
        scheduleUpdate();
        return;
      }

      mapRef.current.fitMarkers?.(yamapPoints, 0.45);
      scheduleUpdate();
    },
    [scheduleUpdate],
  );

  const zoomToCluster = useCallback(
    (cluster: MapPinCluster) => {
      if (!mapRef.current) return;
      const yamapPoints = cluster.requests.map((request) =>
        toYamapPoint({ latitude: request.latitude, longitude: request.longitude }),
      );
      if (yamapPoints.length === 1) {
        mapRef.current.setCenter(yamapPoints[0], 15, 0, 0, 0.35);
      } else {
        mapRef.current.fitMarkers?.(yamapPoints, 0.45);
      }
      scheduleUpdate();
    },
    [scheduleUpdate],
  );

  const fitRequests = useCallback(
    (items: MapHelpRequestPin[]) => {
      fitMapContent(items, userLocation);
    },
    [fitMapContent, userLocation],
  );

  useImperativeHandle(
    ref,
    () => ({
      centerOn(point: MapPoint, zoom = 14) {
        mapRef.current?.setCenter(toYamapPoint(point), zoom, 0, 0, 0.35);
        scheduleUpdate();
      },
      fitRequests,
      fitMapContent,
      zoomToCluster,
    }),
    [fitMapContent, fitRequests, scheduleUpdate, zoomToCluster],
  );

  const didInitialFitRef = useRef(false);
  const includedUserInFitRef = useRef(false);
  const prevRequestCountRef = useRef(0);

  const handleMapLoaded = useCallback(() => {
    setMapReady(true);
  }, []);

  useEffect(() => {
    if (!mapReady) return;

    const requestCount = requests.length;
    const hadRequests = prevRequestCountRef.current > 0;
    prevRequestCountRef.current = requestCount;

    scheduleUpdate();

    const points = collectMapPoints(requests, userLocation);
    if (points.length === 0) return;

    if (!didInitialFitRef.current) {
      fitMapContent(requests, userLocation);
      didInitialFitRef.current = true;
      includedUserInFitRef.current = Boolean(userLocation);
      return;
    }

    if (requestCount > 0 && !hadRequests) {
      fitMapContent(requests, userLocation);
      includedUserInFitRef.current = Boolean(userLocation);
      return;
    }

    if (userLocation && !includedUserInFitRef.current) {
      fitMapContent(requests, userLocation);
      includedUserInFitRef.current = true;
    }
  }, [fitMapContent, mapReady, requests, scheduleUpdate, userLocation]);

  const publishCamera = useCallback(
    (point: { lat: number; lon: number }, zoom?: number) => {
      const zoomLevel = zoom ?? DEFAULT_MAP_ZOOM;
      const delta = 360 / Math.pow(2, zoomLevel);
      setLatitudeDelta(delta);
      onRegionChange?.({
        latitude: point.lat,
        longitude: point.lon,
        latitudeDelta: delta,
        longitudeDelta: delta,
        zoom: zoomLevel,
      });
    },
    [onRegionChange],
  );

  const handleCameraChange = useCallback(() => {
    scheduleUpdate();
  }, [scheduleUpdate]);

  if (!isYandexMapsConfigured() || !yamapReady) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>
          Яндекс.Карты не настроены.{'\n'}Задайте EXPO_PUBLIC_YANDEX_MAPS_API_KEY
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <Yamap
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          lat: mapCenter.latitude,
          lon: mapCenter.longitude,
          zoom: userLocation ? 13 : initialZoom,
        }}
        showUserPosition={false}
        onMapLoaded={handleMapLoaded}
        onMapPress={handleMapPress}
        onCameraPositionChange={(event) => {
          handleCameraChange();
          const { point, zoom } = event.nativeEvent;
          if (zoom !== undefined) {
            setLatitudeDelta(360 / Math.pow(2, zoom));
          }
        }}
        onCameraPositionChangeEnd={(event) => {
          handleCameraChange();
          const { point, zoom } = event.nativeEvent;
          publishCamera(point, zoom);
        }}
      />

      <View style={styles.pinsOverlay} pointerEvents="box-none">
        <MapGeoPinsOverlay positions={positions} pins={overlayPins} />
      </View>

      <View style={styles.legend} pointerEvents="none">
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotUser]} />
          <Text style={styles.legendText}>Вы</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotSocial]} />
          <Text style={styles.legendText}>Делом</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotMaterial]} />
          <Text style={styles.legendText}>Сбор</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={T.primary} />
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: T.surface2,
  },
  pinsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.surface2,
    padding: 24,
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
    right: 12,
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
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  legendDotUser: {
    backgroundColor: '#3B82F6',
  },
  legendDotSocial: {
    backgroundColor: T.primary,
  },
  legendDotMaterial: {
    backgroundColor: T.accent,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Manrope_500Medium',
    color: T.ink2,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251,247,241,0.35)',
    zIndex: 4,
  },
});
