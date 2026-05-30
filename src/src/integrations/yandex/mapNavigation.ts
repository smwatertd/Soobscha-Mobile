import { Alert, Linking, Platform } from 'react-native';
import type { MapPoint } from '../../api/integrationTypes';

export type OpenMapRouteOptions = {
  /** Подпись точки в системных картах (Android geo:). */
  label?: string | null;
};

function yandexMapsAppUrl(point: MapPoint): string {
  const { latitude, longitude } = point;
  return `yandexmaps://maps.yandex.ru/?rtext=~${latitude},${longitude}&rtt=auto`;
}

function yandexNaviUrl(point: MapPoint): string {
  return `yandexnavi://build_route_on_map?lat_to=${point.latitude}&lon_to=${point.longitude}`;
}

function yandexMapsWebUrl(point: MapPoint): string {
  const { latitude, longitude } = point;
  return `https://yandex.ru/maps/?rtext=~${latitude},${longitude}&rtt=auto`;
}

function platformMapsUrl(point: MapPoint, label?: string | null): string | null {
  const { latitude, longitude } = point;
  if (Platform.OS === 'ios') {
    const query = label ? encodeURIComponent(label) : `${latitude},${longitude}`;
    return `maps://?daddr=${latitude},${longitude}&q=${query}`;
  }
  if (Platform.OS === 'android') {
    const q = label
      ? `${latitude},${longitude}(${encodeURIComponent(label)})`
      : `${latitude},${longitude}`;
    return `geo:${latitude},${longitude}?q=${q}`;
  }
  return null;
}

/** Открывает маршрут до точки в Яндекс.Картах / Навигаторе или системных картах. */
export async function openMapRoute(
  point: MapPoint,
  options?: OpenMapRouteOptions,
): Promise<boolean> {
  const label = options?.label?.trim() || null;
  const candidates = [
    yandexMapsAppUrl(point),
    yandexNaviUrl(point),
    platformMapsUrl(point, label),
    yandexMapsWebUrl(point),
  ].filter((url): url is string => Boolean(url));

  for (const url of candidates) {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) continue;
      await Linking.openURL(url);
      return true;
    } catch {
      // пробуем следующий вариант
    }
  }

  try {
    await Linking.openURL(yandexMapsWebUrl(point));
    return true;
  } catch {
    Alert.alert(
      'Не удалось открыть карту',
      'Установите Яндекс.Карты или другое приложение с картами.',
    );
    return false;
  }
}
