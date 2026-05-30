import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';
import { MapPoint } from '../api/integrationTypes';
import { logger } from './logger';

export type ResolveMapPointOptions = {
  /** Не показывать Alert при отказе или ошибке (фоновая подгрузка). */
  silent?: boolean;
  /** Сначала запросить актуальные координаты, а не только кэш. */
  preferFresh?: boolean;
};

function toMapPoint(position: Location.LocationObject): MapPoint {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
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
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function ensureForegroundPermission(silent: boolean): Promise<boolean> {
  try {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.status === 'granted') return true;

    if (silent) return false;

    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') return true;

    Alert.alert(
      'Нужен доступ к геолокации',
      'Разрешите доступ к местоположению, чтобы показать вашу позицию на карте.',
      [
        { text: 'Отмена', style: 'cancel' },
        ...(!canAskAgain
          ? [{ text: 'Настройки', onPress: () => Linking.openSettings() }]
          : []),
      ],
    );
    return false;
  } catch (err) {
    logger.api.debug('location permission check failed', { err });
    return false;
  }
}

async function readLastKnownPosition(): Promise<MapPoint | null> {
  try {
    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: 10 * 60 * 1000,
      requiredAccuracy: 2000,
    });
    return lastKnown ? toMapPoint(lastKnown) : null;
  } catch {
    return null;
  }
}

async function readCurrentPosition(silent: boolean): Promise<MapPoint | null> {
  const lowAccuracy = await withTimeout(
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
      mayShowUserSettingsDialog: !silent,
    }).catch(() => null),
    5000,
  );
  if (lowAccuracy) return toMapPoint(lowAccuracy);

  const balanced = await withTimeout(
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      mayShowUserSettingsDialog: !silent,
    }).catch(() => null),
    8000,
  );

  return balanced ? toMapPoint(balanced) : null;
}

/** Безопасно получает точку волонтёра для карты (expo-location, без Yamap showUserPosition). */
export async function resolveVolunteerMapPoint(
  options: ResolveMapPointOptions = {},
): Promise<MapPoint | null> {
  const { silent = false, preferFresh = false } = options;

  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      if (!silent) {
        Alert.alert(
          'Геолокация выключена',
          'Включите службы геолокации в настройках устройства.',
          [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Настройки', onPress: () => Linking.openSettings() },
          ],
        );
      }
      return null;
    }

    if (!(await ensureForegroundPermission(silent))) {
      return null;
    }

    if (!preferFresh) {
      const cached = await readLastKnownPosition();
      if (cached) return cached;
    }

    const fresh = await readCurrentPosition(silent);
    if (fresh) return fresh;

    if (preferFresh) {
      return readLastKnownPosition();
    }

    return null;
  } catch (err) {
    logger.api.debug('resolveVolunteerMapPoint failed', { err });
    return null;
  }
}

export async function getLastKnownMapPoint(): Promise<MapPoint | null> {
  if (!(await ensureForegroundPermission(true))) return null;
  return readLastKnownPosition();
}

export async function getFreshMapPoint(): Promise<MapPoint | null> {
  return resolveVolunteerMapPoint({ silent: true, preferFresh: true });
}

export async function getCurrentMapPoint(): Promise<MapPoint | null> {
  return resolveVolunteerMapPoint({ silent: true, preferFresh: false });
}
