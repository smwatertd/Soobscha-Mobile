import AsyncStorage from '@react-native-async-storage/async-storage';
import { CachedMediaUrl, MediaVariant } from '../api/integrationTypes';

const STORAGE_PREFIX = '@media_url:';
const memory = new Map<string, CachedMediaUrl>();

function cacheKey(mediaId: string, variant: MediaVariant): string {
  return `${STORAGE_PREFIX}${mediaId}:${variant}`;
}

function isExpired(entry: CachedMediaUrl, bufferMs = 60_000): boolean {
  return Date.now() >= entry.expiresAt - bufferMs;
}

export async function getCachedMediaUrl(
  mediaId: string,
  variant: MediaVariant,
): Promise<CachedMediaUrl | null> {
  const key = cacheKey(mediaId, variant);
  const mem = memory.get(key);
  if (mem && !isExpired(mem)) return mem;

  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CachedMediaUrl;
    if (isExpired(parsed)) {
      await AsyncStorage.removeItem(key);
      memory.delete(key);
      return null;
    }
    memory.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export async function setCachedMediaUrl(entry: CachedMediaUrl): Promise<void> {
  const key = cacheKey(entry.mediaId, entry.variant);
  memory.set(key, entry);
  await AsyncStorage.setItem(key, JSON.stringify(entry));
}

export async function invalidateMediaUrl(mediaId: string): Promise<void> {
  for (const variant of ['preview', 'full'] as const) {
    const key = cacheKey(mediaId, variant);
    memory.delete(key);
    await AsyncStorage.removeItem(key);
  }
}

export async function clearMediaUrlCache(): Promise<void> {
  memory.clear();
  const keys = await AsyncStorage.getAllKeys();
  const mediaKeys = keys.filter((k) => k.startsWith(STORAGE_PREFIX));
  if (mediaKeys.length) {
    await AsyncStorage.multiRemove(mediaKeys);
  }
}
