import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Сообща',
  slug: 'soobscha',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#1E7A4F',
  },
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'ru.soobscha.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Геолокация нужна для отображения заявок на карте и выбора места встречи.',
      LSApplicationQueriesSchemes: ['yandexmaps', 'yandexnavi', 'comgooglemaps'],
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#1E7A4F',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    package: 'ru.soobscha.app',
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'POST_NOTIFICATIONS',
    ],
    ...(process.env.GOOGLE_SERVICES_JSON
      ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON }
      : {}),
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-font',
    'expo-status-bar',
    'expo-secure-store',
    'expo-image',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        backgroundColor: '#1E7A4F',
        imageWidth: 280,
        resizeMode: 'contain',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Приложению нужен доступ к фото, чтобы добавить изображения к заявке.',
        cameraPermission:
          'Приложению нужен доступ к камере, чтобы сделать фото для заявки.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#1E7A4F',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Геолокация нужна для отображения заявок на карте и выбора места встречи.',
      },
    ],
    './plugins/withYandexMaps.js',
  ],
  extra: {
    yandexMapsApiKey: process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY ?? '',
  },
};

export default config;
