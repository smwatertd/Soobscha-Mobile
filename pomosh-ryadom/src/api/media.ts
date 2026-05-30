import * as FileSystem from 'expo-file-system/legacy';
import { apiRequest } from './client';
import {
  CompleteMediaUploadResponse,
  InitMediaUploadRequest,
  InitMediaUploadResponse,
  MediaDownloadUrlResponse,
} from './integrationTypes';

export async function initMediaUpload(body: InitMediaUploadRequest): Promise<InitMediaUploadResponse> {
  return apiRequest<InitMediaUploadResponse>('/api/media/upload-init', {
    method: 'POST',
    body,
    auth: true,
  });
}

export async function completeMediaUpload(mediaId: string): Promise<CompleteMediaUploadResponse> {
  return apiRequest<CompleteMediaUploadResponse>(`/api/media/${mediaId}/upload-complete`, {
    method: 'POST',
    auth: true,
  });
}

export async function getMediaDownloadUrl(mediaId: string): Promise<MediaDownloadUrlResponse> {
  return apiRequest<MediaDownloadUrlResponse>(`/api/media/${mediaId}/download-url`, {
    auth: true,
  });
}

export async function deleteMedia(mediaId: string): Promise<void> {
  await apiRequest<void>(`/api/media/${mediaId}`, {
    method: 'DELETE',
    auth: true,
  });
}

/** PUT файла на presigned URL из upload-init */
export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  method: string,
  headers: Record<string, string>,
  fileUri: string,
  contentType: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const requestHeaders = { ...headers };
  if (!requestHeaders['Content-Type'] && !requestHeaders['content-type']) {
    requestHeaders['Content-Type'] = contentType;
  }

  const uploadTask = FileSystem.createUploadTask(
    uploadUrl,
    fileUri,
    {
      httpMethod: method.toUpperCase(),
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: requestHeaders,
    },
    (progress) => {
      if (progress.totalBytesExpectedToSend > 0 && onProgress) {
        onProgress(progress.totalBytesSent / progress.totalBytesExpectedToSend);
      }
    },
  );

  const result = await uploadTask.uploadAsync();
  const status = result?.status ?? 0;

  if (status < 200 || status >= 300) {
    throw new Error(`Upload failed: HTTP ${status || 'unknown'}`);
  }
}
