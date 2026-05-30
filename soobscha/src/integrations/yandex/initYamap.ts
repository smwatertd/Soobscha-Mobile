import { YamapInstance } from 'react-native-yamap-plus';
import { useEffect, useState } from 'react';
import { getYandexMapsApiKey, isYandexMapsConfigured } from './mapUtils';

let initialized = false;
let initPromise: Promise<boolean> | null = null;

export function initYamap(): Promise<boolean> {
  if (initialized) return Promise.resolve(true);
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const apiKey = getYandexMapsApiKey();
    if (!apiKey) {
      if (__DEV__) {
        console.warn('[Yamap] EXPO_PUBLIC_YANDEX_MAPS_API_KEY не задан');
      }
      return false;
    }

    try {
      await YamapInstance.setLocale('ru_RU');
      await YamapInstance.init(apiKey);
      initialized = true;
      return true;
    } catch (err) {
      initPromise = null;
      if (__DEV__) {
        console.warn('[Yamap] init failed', err);
      }
      return false;
    }
  })();

  return initPromise;
}

export function isYamapInitialized(): boolean {
  return initialized && isYandexMapsConfigured();
}

export function useYamapReady(): boolean {
  const [ready, setReady] = useState(isYamapInitialized);

  useEffect(() => {
    if (ready) return;
    void initYamap().then((ok) => {
      if (ok) setReady(true);
    });
  }, [ready]);

  return ready;
}
