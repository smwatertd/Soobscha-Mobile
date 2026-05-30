import { useCallback, useEffect, useRef, useState } from 'react';
import { MediaVariant } from '../api/integrationTypes';
import { resolveMediaUrl, resolveMediaUrls } from '../services/mediaResolver';

type State = {
  url: string | null;
  loading: boolean;
  error: Error | null;
};

export function useMediaUrl(mediaId?: string | null, variant: MediaVariant = 'preview') {
  const [state, setState] = useState<State>({
    url: null,
    loading: false,
    error: null,
  });

  const reload = useCallback(async () => {
    if (!mediaId) {
      setState({ url: null, loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const url = await resolveMediaUrl(mediaId, variant);
      setState({ url, loading: false, error: null });
    } catch (err) {
      setState({
        url: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Не удалось загрузить медиа'),
      });
    }
  }, [mediaId, variant]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}

export function useMediaUrls(mediaIds: string[], variant: MediaVariant = 'preview') {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const idsKey = mediaIds.join('|');

  const reload = useCallback(async () => {
    if (!mediaIds.length) {
      setUrls({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resolved = await resolveMediaUrls(mediaIds, variant);
      setUrls(resolved);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Не удалось загрузить медиа'));
    } finally {
      setLoading(false);
    }
  }, [idsKey, variant]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { urls, loading, error, reload };
}
