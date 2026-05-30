import {
  completeMediaUpload,
  initMediaUpload,
  uploadFileToPresignedUrl,
} from '../api/media';
import { UploadMediaInput, UploadMediaResult } from '../api/integrationTypes';

export async function uploadMedia(input: UploadMediaInput): Promise<UploadMediaResult> {
  const init = await initMediaUpload({
    purpose: input.purpose,
    file_name: input.fileName,
    content_type: input.contentType,
  });

  await uploadFileToPresignedUrl(
    init.upload_url,
    init.upload_method,
    init.upload_headers,
    input.uri,
    input.contentType,
    (progress) => input.onProgress?.(progress * 0.88),
  );

  input.onProgress?.(0.92);
  await completeMediaUpload(init.media_id);
  input.onProgress?.(1);

  return { mediaId: init.media_id };
}

export async function uploadMediaBatch(
  items: UploadMediaInput[],
  onItemProgress?: (index: number, progress: number) => void,
): Promise<UploadMediaResult[]> {
  const results: UploadMediaResult[] = [];

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const result = await uploadMedia({
      ...item,
      onProgress: (p) => onItemProgress?.(i, p),
    });
    results.push(result);
  }

  return results;
}
