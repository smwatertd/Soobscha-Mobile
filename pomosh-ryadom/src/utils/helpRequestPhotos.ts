import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ImagePickerAsset } from 'expo-image-picker';

export const MAX_HELP_REQUEST_PHOTOS = 10;
export const MAX_HELP_REQUEST_PHOTO_BYTES = 50 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export function isImageContentType(contentType: string): boolean {
  return ALLOWED_IMAGE_TYPES.has(contentType);
}

export function isDocumentContentType(contentType: string): boolean {
  return ALLOWED_DOCUMENT_TYPES.has(contentType);
}

export function normalizePhotoContentType(mimeType?: string | null, uri?: string): string | null {
  if (mimeType && ALLOWED_IMAGE_TYPES.has(mimeType)) {
    return mimeType;
  }

  const extension = uri?.split('.').pop()?.toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';

  return null;
}

export function normalizeDocumentContentType(mimeType?: string | null, name?: string): string | null {
  if (mimeType && (ALLOWED_DOCUMENT_TYPES.has(mimeType) || mimeType.startsWith('image/'))) {
    if (ALLOWED_IMAGE_TYPES.has(mimeType)) {
      return mimeType;
    }
    if (ALLOWED_DOCUMENT_TYPES.has(mimeType)) {
      return mimeType;
    }
  }

  const extension = name?.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'doc') return 'application/msword';
  if (extension === 'docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';

  return null;
}

export function buildPhotoFileName(contentType: string, asset?: ImagePickerAsset): string {
  if (asset?.fileName?.trim()) {
    return asset.fileName.trim();
  }

  const extension = contentType === 'image/png'
    ? 'png'
    : contentType === 'image/webp'
      ? 'webp'
      : 'jpg';

  return `help-request-${Date.now()}.${extension}`;
}

export function buildDocumentFileName(contentType: string, name?: string | null): string {
  if (name?.trim()) {
    return name.trim();
  }

  if (contentType === 'application/pdf') return `help-request-${Date.now()}.pdf`;
  if (contentType === 'application/msword') return `help-request-${Date.now()}.doc`;
  if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return `help-request-${Date.now()}.docx`;
  }

  return `help-request-${Date.now()}`;
}

async function validateFileSize(uri: string, sizeFromAsset?: number | null): Promise<string | null> {
  if (typeof sizeFromAsset === 'number' && sizeFromAsset > MAX_HELP_REQUEST_PHOTO_BYTES) {
    return 'Файл больше 50 МБ';
  }

  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists && 'size' in info && typeof info.size === 'number' && info.size > MAX_HELP_REQUEST_PHOTO_BYTES) {
    return 'Файл больше 50 МБ';
  }

  return null;
}

export async function validateHelpRequestPhotoAsset(
  asset: ImagePickerAsset,
): Promise<{ uri: string; fileName: string; contentType: string } | string> {
  const uri = asset.uri;
  const contentType = normalizePhotoContentType(asset.mimeType, uri);

  if (!contentType) {
    return 'Поддерживаются только JPG, PNG и WebP';
  }

  const sizeError = await validateFileSize(uri, asset.fileSize);
  if (sizeError) return sizeError;

  return {
    uri,
    fileName: buildPhotoFileName(contentType, asset),
    contentType,
  };
}

export async function validateHelpRequestDocumentAsset(
  asset: DocumentPicker.DocumentPickerAsset,
): Promise<{ uri: string; fileName: string; contentType: string } | string> {
  const uri = asset.uri;
  const contentType = normalizeDocumentContentType(asset.mimeType ?? null, asset.name);

  if (!contentType) {
    return 'Поддерживаются изображения (JPG, PNG, WebP), PDF и документы Word';
  }

  const sizeError = await validateFileSize(uri, asset.size ?? null);
  if (sizeError) return sizeError;

  return {
    uri,
    fileName: buildDocumentFileName(contentType, asset.name),
    contentType,
  };
}

export function getMediaKind(contentType: string): 'image' | 'document' {
  return isImageContentType(contentType) ? 'image' : 'document';
}

export function getMediaStatusLabel(
  status: 'uploading' | 'uploaded' | 'error' | undefined,
  options?: { hasMediaId?: boolean; progress?: number },
): string {
  if (options?.hasMediaId) return 'Загружено · нажмите для просмотра';
  if (status === 'uploading') {
    if ((options?.progress ?? 0) >= 0.9) return 'Сохранение…';
    return 'Загрузка…';
  }
  if (status === 'uploaded') return 'Загружено · нажмите для просмотра';
  if (status === 'error') return 'Ошибка загрузки';
  return '';
}
