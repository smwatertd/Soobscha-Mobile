import { MediaDownloadUrlResponse } from '../api/integrationTypes';
import {
  isImageContentType,
  normalizeDocumentContentType,
  normalizePhotoContentType,
} from './helpRequestPhotos';

export type HelpRequestMediaItem = {
  mediaId: string;
  url?: string;
  previewUrl?: string | null;
  contentType: string;
  fileName: string;
};

function extractFileName(url: string): string | undefined {
  try {
    const pathname = new URL(url).pathname;
    const base = pathname.split('/').pop();
    if (!base) return undefined;
    return decodeURIComponent(base.split('?')[0]);
  } catch {
    const fallback = url.split('?')[0]?.split('/').pop();
    return fallback ? decodeURIComponent(fallback) : undefined;
  }
}

function inferContentType(file: MediaDownloadUrlResponse, fileName: string): string {
  const fromName =
    normalizePhotoContentType(null, fileName) ?? normalizeDocumentContentType(null, fileName);
  if (fromName) return fromName;
  if (file.preview_url) return 'image/jpeg';
  return 'application/octet-stream';
}

export function parseHelpRequestMediaFiles(
  files: MediaDownloadUrlResponse[] | undefined,
): HelpRequestMediaItem[] {
  return (files ?? [])
    .filter((file) => Boolean(file.media_id))
    .map((file) => {
      const fileName = extractFileName(file.url) ?? `file-${file.media_id.slice(0, 8)}`;
      const contentType = inferContentType(file, fileName);
      return {
        mediaId: file.media_id,
        url: file.url,
        previewUrl: file.preview_url,
        contentType,
        fileName,
      };
    });
}

export function splitHelpRequestMedia(items: HelpRequestMediaItem[]) {
  const images = items.filter((item) => isImageContentType(item.contentType));
  const documents = items.filter((item) => !isImageContentType(item.contentType));
  return { images, documents };
}

export type HelpRequestImageSlide = {
  mediaId: string;
  uri?: string;
};

export function extractHelpRequestImageMediaIds(
  files: MediaDownloadUrlResponse[] | undefined,
): string[] {
  return buildHelpRequestImageSlides(files).map((item) => item.mediaId);
}

export function buildHelpRequestImageSlides(
  files: MediaDownloadUrlResponse[] | undefined,
): HelpRequestImageSlide[] {
  return splitHelpRequestMedia(parseHelpRequestMediaFiles(files)).images.map((item) => ({
    mediaId: item.mediaId,
    uri: item.previewUrl ?? item.url,
  }));
}
