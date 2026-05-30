import { useCallback, useEffect, useState } from 'react';
import { MapBounds, SocialHelpRequestSummary } from '../api/integrationTypes';
import { getSocialHelpRequestsForMap } from '../api/helpRequests';
import { boundsFromRegion, filterRequestsInBounds } from '../integrations/yandex/mapUtils';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export function useSocialMapRequests(initialRegion?: Region) {
  const [allRequests, setAllRequests] = useState<SocialHelpRequestSummary[]>([]);
  const [visibleRequests, setVisibleRequests] = useState<SocialHelpRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [region, setRegion] = useState<Region | null>(initialRegion ?? null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const items = await getSocialHelpRequestsForMap();
      setAllRequests(items);

      if (region) {
        setVisibleRequests(filterRequestsInBounds(items, boundsFromRegion(region)));
      } else {
        setVisibleRequests(items);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Не удалось загрузить заявки для карты'));
    } finally {
      setLoading(false);
    }
  }, [region]);

  useEffect(() => {
    load();
  }, []);

  const updateVisibleRegion = useCallback(
    (nextRegion: Region) => {
      setRegion(nextRegion);
      const bounds: MapBounds = boundsFromRegion(nextRegion);
      setVisibleRequests(filterRequestsInBounds(allRequests, bounds));
    },
    [allRequests],
  );

  return {
    allRequests,
    visibleRequests,
    loading,
    error,
    reload: load,
    updateVisibleRegion,
  };
}
