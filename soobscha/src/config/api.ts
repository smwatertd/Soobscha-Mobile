import Constants from 'expo-constants';

export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }

  // При разработке на телефоне берём IP машины из Expo Dev Server
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) {
    return `http://${host}:8000`;
  }

  return 'http://localhost:8000';
}
