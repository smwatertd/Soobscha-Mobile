import { useCallback, useState } from 'react';
import { UploadMediaInput, UploadMediaResult } from '../api/integrationTypes';
import { uploadMedia, uploadMediaBatch } from '../services/mediaUpload';

type UploadState = {
  uploading: boolean;
  progress: number;
  error: Error | null;
  results: UploadMediaResult[];
};

export function useMediaUpload() {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    results: [],
  });

  const uploadOne = useCallback(async (input: UploadMediaInput) => {
    setState({ uploading: true, progress: 0, error: null, results: [] });

    try {
      const result = await uploadMedia({
        ...input,
        onProgress: (p) => setState((s) => ({ ...s, progress: p })),
      });
      setState({ uploading: false, progress: 1, error: null, results: [result] });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Не удалось загрузить файл');
      setState({ uploading: false, progress: 0, error, results: [] });
      throw error;
    }
  }, []);

  const uploadMany = useCallback(async (items: UploadMediaInput[]) => {
    setState({ uploading: true, progress: 0, error: null, results: [] });

    try {
      const results = await uploadMediaBatch(items, (_index, progress) => {
        setState((s) => ({ ...s, progress }));
      });
      setState({ uploading: false, progress: 1, error: null, results });
      return results;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Не удалось загрузить файлы');
      setState({ uploading: false, progress: 0, error, results: [] });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ uploading: false, progress: 0, error: null, results: [] });
  }, []);

  return { ...state, uploadOne, uploadMany, reset };
}
