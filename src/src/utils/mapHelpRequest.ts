import {
  HelpRequestType,
  MediaDownloadUrlResponse,
  SocialHelpRequestSummary,
} from '../api/integrationTypes';
import { buildHelpRequestImageSlides } from './parseHelpRequestMediaFiles';

type MapRequestRaw = Record<string, any>;

function isObject(value: any): value is MapRequestRaw {
  return (
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

function isString(value: any): value is string {
  return Object.prototype.toString.call(value) === '[object String]';
}

function isNumber(value: any): value is number {
  return Object.prototype.toString.call(value) === '[object Number]' && Number.isFinite(value);
}

/** Минимальная форма заявки для карты (без импорта api/helpRequests в тестах). */
export type MapHelpRequestSource = SocialHelpRequestSummary | MapRequestRaw;

export type MapHelpRequestPin = {
  id: string;
  type: HelpRequestType;
  title: string;
  latitude: number;
  longitude: number;
  category: string;
  address_text?: string | null;
  place_name?: string | null;
  start_at?: string;
  min_volunteers?: number;
  max_volunteers?: number;
  media_files?: MediaDownloadUrlResponse[];
};

export type MapRequestCoverImage = {
  mediaId: string | null;
  uri: string | null;
};

function readStringField(file: MapRequestRaw, ...keys: string[]): string {
  for (const key of keys) {
    const value = file[key];
    if (isString(value) && value) return value;
  }
  return '';
}

export function normalizeHelpRequestMediaFiles(raw: any): MediaDownloadUrlResponse[] {
  if (!Array.isArray(raw)) return [];

  const normalized: MediaDownloadUrlResponse[] = [];
  for (const item of raw) {
    if (!isObject(item)) continue;
    const file = item as MapRequestRaw;
    const media_id = readStringField(file, 'media_id', 'mediaId', 'id');
    if (!media_id) continue;

    const preview_url = readStringField(file, 'preview_url', 'previewUrl') || null;
    const url = readStringField(file, 'url');
    const expires_at = readStringField(file, 'expires_at', 'expiresAt');

    normalized.push({ media_id, url, preview_url, expires_at });
  }

  return normalized;
}

export function getMapRequestCoverImage(
  pin: Pick<MapHelpRequestPin, 'media_files'>,
): MapRequestCoverImage {
  const mediaFiles = normalizeHelpRequestMediaFiles(pin.media_files);
  const slides = buildHelpRequestImageSlides(mediaFiles);
  const firstSlide = slides[0];

  if (firstSlide) {
    return {
      mediaId: firstSlide.mediaId,
      uri: firstSlide.uri ?? null,
    };
  }

  const firstFile = mediaFiles[0];
  if (!firstFile) {
    return { mediaId: null, uri: null };
  }

  return {
    mediaId: firstFile.media_id,
    uri: firstFile.preview_url || firstFile.url || null,
  };
}

function readMapCoordinate(value: any): number | null {
  if (isNumber(value)) return value;
  if (isString(value) && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readOptionalString(raw: MapRequestRaw, key: string): string | null {
  const value = raw[key];
  return isString(value) ? value : null;
}

export function helpRequestToMapPin(item: MapHelpRequestSource): MapHelpRequestPin | null {
  const raw = item as MapRequestRaw;
  const location = isObject(raw.location) ? raw.location : null;

  const latitude =
    readMapCoordinate(raw.latitude) ??
    readMapCoordinate(location?.latitude) ??
    readMapCoordinate(location?.lat);
  const longitude =
    readMapCoordinate(raw.longitude) ??
    readMapCoordinate(location?.longitude) ??
    readMapCoordinate(location?.lon);

  if (latitude === null || longitude === null) {
    return null;
  }

  const type = raw.type === 'MATERIAL' ? 'MATERIAL' : 'SOCIAL';
  const id = readStringField(raw, 'id');

  return {
    id,
    type,
    title: readStringField(raw, 'title') || 'Заявка',
    latitude,
    longitude,
    category: readStringField(raw, 'category'),
    address_text: readOptionalString(raw, 'address_text'),
    place_name: readOptionalString(raw, 'place_name'),
    start_at: readOptionalString(raw, 'start_at') ?? undefined,
    min_volunteers: isNumber(raw.min_volunteers) ? raw.min_volunteers : undefined,
    max_volunteers: isNumber(raw.max_volunteers) ? raw.max_volunteers : undefined,
    media_files: (() => {
      const files = normalizeHelpRequestMediaFiles(raw.media_files);
      return files.length > 0 ? files : undefined;
    })(),
  };
}

export function collectMapPins(items: MapHelpRequestSource[]): MapHelpRequestPin[] {
  const pins: MapHelpRequestPin[] = [];
  for (const item of items) {
    const pin = helpRequestToMapPin(item);
    if (pin?.id) pins.push(pin);
  }
  return pins;
}
