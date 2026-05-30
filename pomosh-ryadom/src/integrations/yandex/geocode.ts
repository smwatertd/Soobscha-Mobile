import { Address, AddressKind, Search } from 'react-native-yamap-plus';
import { MapPoint } from '../../api/integrationTypes';
import {
  geocodeCacheKey,
  isYandexMapsConfigured,
  toYamapPoint,
} from './mapUtils';

const REVERSE_GEOCODE_ZOOM = 18;
const GEOCODE_CACHE_MAX = 150;
const GEOCODE_TIMEOUT_MS = 6000;

const geocodeCache = new Map<string, string>();

function formatCoordsFallback(point: MapPoint): string {
  return `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;
}

function rememberGeocode(point: MapPoint, address: string): string {
  const key = geocodeCacheKey(point);
  if (geocodeCache.size >= GEOCODE_CACHE_MAX) {
    const oldest = geocodeCache.keys().next().value;
    if (oldest) geocodeCache.delete(oldest);
  }
  geocodeCache.set(key, address);
  return address;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function componentName(address: Address, ...kinds: AddressKind[]): string | undefined {
  for (let i = address.Components.length - 1; i >= 0; i -= 1) {
    const item = address.Components[i];
    if (item.name && kinds.includes(item.kind)) {
      return item.name.trim();
    }
  }
  return undefined;
}

function stripCountry(formatted: string): string {
  return formatted.replace(/^Россия,\s*/, '').trim();
}

function formatDetailedAddress(address: Address): string | null {
  const city =
    componentName(address, AddressKind.LOCALITY) ??
    componentName(address, AddressKind.AREA);
  const street =
    componentName(address, AddressKind.STREET) ??
    componentName(address, AddressKind.ROUTE);
  const house = componentName(address, AddressKind.HOUSE);

  const parts: string[] = [];
  if (city) parts.push(city);
  if (street) parts.push(street);
  if (house) parts.push(house);

  if (parts.length >= 2) return parts.join(', ');
  if (street) return house ? `${street}, ${house}` : street;

  const formatted = address.formatted?.trim();
  if (!formatted) return null;

  const withoutCountry = stripCountry(formatted);
  return withoutCountry.length >= 3 ? withoutCountry : null;
}

function formatAddressResult(point: MapPoint, address: Address): string {
  return (
    formatDetailedAddress(address) ??
    stripCountry(address.formatted ?? '') ??
    formatCoordsFallback(point)
  );
}

async function searchAddressAtPoint(point: MapPoint): Promise<Address | null> {
  const yamapPoint = toYamapPoint(point);
  return withTimeout(Search.searchPoint(yamapPoint, REVERSE_GEOCODE_ZOOM), GEOCODE_TIMEOUT_MS);
}

export async function reverseGeocodePoint(point: MapPoint): Promise<string> {
  const cached = geocodeCache.get(geocodeCacheKey(point));
  if (cached) return cached;

  if (!isYandexMapsConfigured()) {
    return formatCoordsFallback(point);
  }

  const address = await searchAddressAtPoint(point);
  if (address) {
    return rememberGeocode(point, formatAddressResult(point, address));
  }

  const fallback = formatCoordsFallback(point);
  return rememberGeocode(point, fallback);
}

export function clearGeocodeCache(): void {
  geocodeCache.clear();
}
