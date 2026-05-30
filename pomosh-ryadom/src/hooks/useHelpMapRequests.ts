import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getHelpRequestsForMap } from '../api/helpRequests';
import { MapBounds, MapPoint } from '../api/integrationTypes';
import { boundsFromRegion, filterMapPointsInBounds } from '../integrations/yandex/mapUtils';
import { mapFiltersForSocialRequests, VolunteerMapFilters } from '../types/volunteerMapFilters';
import { collectMapPins, MapHelpRequestPin } from '../utils/mapHelpRequest';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export function useHelpMapRequests(
  filters: VolunteerMapFilters,
  userLocation?: MapPoint | null,
) {
  const [allRequests, setAllRequests] = useState<MapHelpRequestPin[]>([]);
  const [visibleRequests, setVisibleRequests] = useState<MapHelpRequestPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const regionRef = useRef<Region | null>(null);

  const applyRegionFilter = useCallback((items: MapHelpRequestPin[], region: Region | null) => {
    if (!region) {
      setVisibleRequests(items);
      return;
    }
    const bounds: MapBounds = boundsFromRegion(region, 1.25);
    setVisibleRequests(filterMapPointsInBounds(items, bounds));
  }, []);

  const socialMapFilters = useMemo(() => mapFiltersForSocialRequests(filters), [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const items = await getHelpRequestsForMap(socialMapFilters, userLocation);
      const pins = collectMapPins(items);
      setAllRequests(pins);
      applyRegionFilter(pins, regionRef.current);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Не удалось загрузить заявки для карты'));
    } finally {
      setLoading(false);
    }
  }, [applyRegionFilter, socialMapFilters, userLocation]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateVisibleRegion = useCallback(
    (nextRegion: Region) => {
      regionRef.current = nextRegion;
      applyRegionFilter(allRequests, nextRegion);
    },
    [allRequests, applyRegionFilter],
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
