import { Search, Suggest, SuggestType } from 'react-native-yamap-plus';
import { MapPoint } from '../../api/integrationTypes';
import { DEFAULT_MAP_CENTER, isYandexMapsConfigured, toYamapPoint } from './mapUtils';

export const MIN_ADDRESS_SUGGEST_QUERY_LENGTH = 3;

export type AddressSuggestion = {
  id: string;
  title: string;
  subtitle?: string;
  uri?: string;
  center?: MapPoint;
};

type SearchAddressResult = {
  formatted?: string;
  point?: { lat: number; lon: number };
};

function formatSuggestionAddress(suggestion: AddressSuggestion): string {
  return [suggestion.title, suggestion.subtitle].filter(Boolean).join(', ');
}

function pointFromSearchResult(result: SearchAddressResult | null | undefined): MapPoint | null {
  const lat = result?.point?.lat;
  const lon = result?.point?.lon;
  if (typeof lat !== 'number' || typeof lon !== 'number') return null;
  return { latitude: lat, longitude: lon };
}

function getBiasPoint(userLocation?: MapPoint | null, mapBias?: MapPoint | null): MapPoint {
  return userLocation ?? mapBias ?? DEFAULT_MAP_CENTER;
}

export async function fetchAddressSuggestions(
  query: string,
  userLocation?: MapPoint | null,
  mapBias?: MapPoint | null,
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (!isYandexMapsConfigured() || trimmed.length < MIN_ADDRESS_SUGGEST_QUERY_LENGTH) {
    return [];
  }

  try {
    const items = await Suggest.suggest(trimmed, {
      userPosition: userLocation ? toYamapPoint(userLocation) : undefined,
      suggestTypes: [SuggestType.GEO],
    });

    return items.map((item, index) => ({
      id: item.uri ?? `${item.title}-${item.subtitle ?? ''}-${index}`,
      title: item.title,
      subtitle: item.subtitle,
      uri: item.uri,
      center: item.center
        ? { latitude: item.center.lat, longitude: item.center.lon }
        : undefined,
    }));
  } catch {
    return [];
  }
}

async function resolveByUri(uri: string): Promise<{ point: MapPoint; address: string } | null> {
  try {
    const resolved = await Search.resolveURI(uri, { geometry: true });
    const point = pointFromSearchResult(resolved);
    if (point) {
      return {
        point,
        address: resolved?.formatted?.trim() || '',
      };
    }
  } catch {
    return null;
  }

  return null;
}

async function resolveByText(
  query: string,
  biasPoint: MapPoint,
): Promise<{ point: MapPoint; address: string } | null> {
  try {
    const resolved = await Search.searchText(
      query,
      { point: toYamapPoint(biasPoint) },
      { geometry: true },
    );
    const point = pointFromSearchResult(resolved);
    if (point) {
      return {
        point,
        address: resolved?.formatted?.trim() || query,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export async function resolveAddressSuggestion(
  suggestion: AddressSuggestion,
  userLocation?: MapPoint | null,
  mapBias?: MapPoint | null,
): Promise<{ point: MapPoint; address: string } | null> {
  if (!isYandexMapsConfigured()) return null;

  const formatted = formatSuggestionAddress(suggestion);
  const biasPoint = getBiasPoint(userLocation, mapBias);

  if (suggestion.uri) {
    const byUri = await resolveByUri(suggestion.uri);
    if (byUri) {
      return { ...byUri, address: byUri.address || formatted };
    }
  }

  if (suggestion.center) {
    return { point: suggestion.center, address: formatted };
  }

  return resolveByText(formatted, biasPoint);
}

export async function resetAddressSuggestions(): Promise<void> {
  try {
    await Suggest.reset();
  } catch {
    // suggest session may be unavailable in lite mapkit
  }
}
