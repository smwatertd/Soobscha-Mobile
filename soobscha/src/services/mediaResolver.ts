import { getMediaDownloadUrl } from '../api/media';
import { MediaVariant } from '../api/integrationTypes';
import { getCachedMediaUrl, setCachedMediaUrl } from './mediaCache';

export async function resolveMediaUrl(
  mediaId: string,
  variant: MediaVariant = 'preview',
): Promise<string> {
  const cached = await getCachedMediaUrl(mediaId, variant);
  if (cached) return cached.url;

  const response = await getMediaDownloadUrl(mediaId);
  const url =
    variant === 'preview' && response.preview_url ? response.preview_url : response.url;

  await setCachedMediaUrl({
    mediaId,
    variant,
    url,
    expiresAt: new Date(response.expires_at).getTime(),
  });

  if (variant === 'preview' && response.preview_url) {
    await setCachedMediaUrl({
      mediaId,
      variant: 'full',
      url: response.url,
      expiresAt: new Date(response.expires_at).getTime(),
    });
  }

  return url;
}

export async function resolveMediaUrls(
  mediaIds: string[],
  variant: MediaVariant = 'preview',
): Promise<Record<string, string>> {
  const unique = [...new Set(mediaIds.filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (id) => {
      try {
        const url = await resolveMediaUrl(id, variant);
        return [id, url] as const;
      } catch {
        return [id, ''] as const;
      }
    }),
  );

  return Object.fromEntries(entries.filter(([, url]) => url));
}
