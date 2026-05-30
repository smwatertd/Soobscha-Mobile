import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Yamap, YamapRef } from 'react-native-yamap-plus';
import {
  getPulsingPinSize,
  PulsingMapCenterPin,
} from '../../components/map/PulsingMapCenterPin';
import { MapPoint } from '../../api/integrationTypes';
import {
  DEFAULT_MAP_CENTER,
  isYandexMapsConfigured,
  toYamapPoint,
} from './mapUtils';
import { useYamapReady } from './initYamap';
import { toLayoutScreenPoint } from './mapScreenPoints';
import { T, CARD_BG, RADIUS } from '../../theme/tokens';

export type LocationPickerMapHandle = {
  fitPoints: (points: MapPoint[]) => void;
  moveCameraTo: (point: MapPoint, zoom?: number) => void;
};

type Props = {
  value?: MapPoint | null;
  onChange: (point: MapPoint) => void;
  userLocation?: MapPoint | null;
  style?: ViewStyle;
  initialCenter?: MapPoint;
  initialZoom?: number;
  interactive?: boolean;
};

export const LocationPickerMap = forwardRef<LocationPickerMapHandle, Props>(
  function LocationPickerMap(
    {
      value,
      onChange,
      userLocation,
      style,
      initialCenter = value ?? DEFAULT_MAP_CENTER,
      initialZoom = 15,
      interactive = true,
    },
    ref,
  ) {
    const yamapReady = useYamapReady();
    const mapRef = useRef<YamapRef>(null);
    const skipCameraUpdate = useRef(false);
    const mapLoadedRef = useRef(false);
    const [userScreenPoint, setUserScreenPoint] = useState<{ x: number; y: number } | null>(
      null,
    );
    const pinSize = getPulsingPinSize(interactive ? 'md' : 'sm');

    const centerOnValue = useCallback(
      (target: MapPoint, animated = interactive) => {
        skipCameraUpdate.current = true;
        mapRef.current?.setCenter(
          toYamapPoint(target),
          initialZoom,
          0,
          0,
          animated ? 0.35 : 0,
        );
      },
      [initialZoom, interactive],
    );

    const updateUserPinScreenPosition = useCallback(() => {
      if (!userLocation || !mapLoadedRef.current) return;

      mapRef.current?.getScreenPoints?.([toYamapPoint(userLocation)], (result) => {
        const raw = result.screenPoints?.[0];
        if (!raw || typeof raw.x !== 'number' || typeof raw.y !== 'number') return;
        setUserScreenPoint(toLayoutScreenPoint(raw));
      });
    }, [userLocation]);

    const scheduleUserPinUpdates = useCallback(() => {
      updateUserPinScreenPosition();
      [50, 150, 350].forEach((delay) => {
        setTimeout(updateUserPinScreenPosition, delay);
      });
    }, [updateUserPinScreenPosition]);

    useImperativeHandle(
      ref,
      () => ({
        moveCameraTo: (point, zoom = initialZoom) => {
          skipCameraUpdate.current = true;
          mapRef.current?.setCenter(toYamapPoint(point), zoom, 0, 0, 0.35);
        },
        fitPoints: (points) => {
          if (!points.length) return;
          skipCameraUpdate.current = true;
          if (points.length === 1) {
            mapRef.current?.setCenter(toYamapPoint(points[0]), initialZoom, 0, 0, 0.35);
            return;
          }
          mapRef.current?.fitMarkers?.(
            points.map(toYamapPoint),
            0.45,
          );
        },
      }),
      [initialZoom],
    );

    useEffect(() => {
      if (!value) return;
      centerOnValue(value, interactive);
    }, [value, interactive, centerOnValue]);

    useEffect(() => {
      if (!userLocation) {
        setUserScreenPoint(null);
        return;
      }
      scheduleUserPinUpdates();
    }, [userLocation, scheduleUserPinUpdates]);

    const handleMapLoaded = useCallback(() => {
      mapLoadedRef.current = true;
      scheduleUserPinUpdates();
      if (value) {
        centerOnValue(value, false);
      }
    }, [scheduleUserPinUpdates, value, centerOnValue]);

    const handleCameraChange = useCallback(() => {
      updateUserPinScreenPosition();
    }, [updateUserPinScreenPosition]);

    if (!isYandexMapsConfigured() || !yamapReady) {
      return (
        <View style={[styles.fallback, style]}>
          <Text style={styles.fallbackText}>
            Карта недоступна — добавьте ключ Яндекс.Карт в .env
          </Text>
        </View>
      );
    }

    const center = value ?? initialCenter;

    return (
      <View style={[styles.wrap, style]} pointerEvents={interactive ? 'auto' : 'box-none'}>
        <View style={StyleSheet.absoluteFill} pointerEvents={interactive ? 'auto' : 'none'}>
          <Yamap
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            lat: center.latitude,
            lon: center.longitude,
            zoom: initialZoom,
          }}
          showUserPosition={false}
          onMapLoaded={handleMapLoaded}
          onCameraPositionChange={interactive ? handleCameraChange : undefined}
          onCameraPositionChangeEnd={
            interactive
              ? (event) => {
                  handleCameraChange();

                  if (skipCameraUpdate.current) {
                    skipCameraUpdate.current = false;
                    return;
                  }
                  const native = event.nativeEvent as {
                    point?: { lat: number; lon: number };
                    lat?: number;
                    lon?: number;
                  };
                  const lat = native.point?.lat ?? native.lat;
                  const lon = native.point?.lon ?? native.lon;
                  if (lat === undefined || lon === undefined) return;
                  onChange({ latitude: lat, longitude: lon });
                }
              : undefined
          }
          onMapPress={
            interactive
              ? (event) => {
                  const { lat, lon } = event.nativeEvent;
                  skipCameraUpdate.current = true;
                  mapRef.current?.setCenter({ lat, lon }, initialZoom, 0, 0, 0.35);
                  onChange({ latitude: lat, longitude: lon });
                }
              : undefined
          }
          />
        </View>

        {userLocation && userScreenPoint ? (
          <View
            pointerEvents="none"
            style={[
              styles.geoPin,
              {
                left: userScreenPoint.x - pinSize / 2,
                top: userScreenPoint.y - pinSize / 2,
                width: pinSize,
                height: pinSize,
              },
            ]}
          >
            <PulsingMapCenterPin
              animated={interactive}
              size={interactive ? 'md' : 'sm'}
              variant="user"
            />
          </View>
        ) : null}

        {(interactive || value) && (
          <View style={styles.requestPinWrap} pointerEvents="none">
            <PulsingMapCenterPin
              animated={interactive}
              size={interactive ? 'md' : 'sm'}
              variant="request"
            />
          </View>
        )}

        {interactive && (
          <>
            <View style={styles.legend} pointerEvents="none">
              <View style={styles.legendItem}>
                <View style={styles.legendDotRequest} />
                <Text style={styles.legendText}>Место встречи</Text>
              </View>
              {userLocation ? (
                <View style={styles.legendItem}>
                  <View style={styles.legendDotUser} />
                  <Text style={styles.legendText}>Вы здесь</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.hint} pointerEvents="none">
              <Text style={styles.hintText}>Перемещайте карту или нажмите, чтобы указать место</Text>
            </View>
          </>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: T.surface2,
    borderRadius: RADIUS.lg,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.surface2,
    padding: 24,
    borderRadius: RADIUS.lg,
  },
  fallbackText: {
    textAlign: 'center',
    color: T.muted,
    fontFamily: 'Manrope_500Medium',
  },
  geoPin: {
    position: 'absolute',
    zIndex: 1,
  },
  requestPinWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  legend: {
    position: 'absolute',
    top: 10,
    left: 12,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: RADIUS.sm,
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
  hint: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: RADIUS.sm,
    paddingVertical: 7,
    paddingHorizontal: 12,
    zIndex: 3,
  },
  hintText: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.ink2,
  },
});
