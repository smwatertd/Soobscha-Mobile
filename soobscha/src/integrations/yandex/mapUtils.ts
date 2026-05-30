import Constants from 'expo-constants';
import { MapBounds, MapPoint, SocialHelpRequestSummary } from '../../api/integrationTypes';

export function getYandexMapsApiKey(): string {
  return (
    process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY ??
    (Constants.expoConfig?.extra?.yandexMapsApiKey as string | undefined) ??
    ''
  );
}

export function isYandexMapsConfigured(): boolean {
  return getYandexMapsApiKey().length > 0;
}

export function filterMapPointsInBounds<T extends MapPoint>(
  points: T[],
  bounds: MapBounds,
): T[] {
  return points.filter(
    (point) =>
      point.latitude >= bounds.minLat &&
      point.latitude <= bounds.maxLat &&
      point.longitude >= bounds.minLon &&
      point.longitude <= bounds.maxLon,
  );
}

export function filterRequestsInBounds(
  requests: SocialHelpRequestSummary[],
  bounds: MapBounds,
): SocialHelpRequestSummary[] {
  return filterMapPointsInBounds(requests, bounds);
}

export function boundsFromRegion(
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  },
  padding = 1,
): MapBounds {
  const halfLat = (region.latitudeDelta / 2) * padding;
  const halfLon = (region.longitudeDelta / 2) * padding;

  return {
    minLat: region.latitude - halfLat,
    maxLat: region.latitude + halfLat,
    minLon: region.longitude - halfLon,
    maxLon: region.longitude + halfLon,
  };
}

export const DEFAULT_MAP_CENTER: MapPoint = {
  latitude: 55.751244,
  longitude: 37.618423,
};

export const DEFAULT_MAP_ZOOM = 11;

export function toYamapPoint(point: MapPoint) {
  return { lat: point.latitude, lon: point.longitude };
}

export function fromYamapPoint(point: { lat: number; lon: number }): MapPoint {
  return { latitude: point.lat, longitude: point.lon };
}

/** ~1.1 m precision — enough to reuse geocode results for nearby taps. */
export function geocodeCacheKey(point: MapPoint): string {
  return `${point.latitude.toFixed(5)},${point.longitude.toFixed(5)}`;
}

export function distanceBetweenMapPointsMeters(a: MapPoint, b: MapPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusM = 6_371_000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * earthRadiusM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Skip reverse geocode when the pin barely moved (saves MapKit geocoder tokens). */
export const MIN_REVERSE_GEOCODE_DISTANCE_M = 40;
