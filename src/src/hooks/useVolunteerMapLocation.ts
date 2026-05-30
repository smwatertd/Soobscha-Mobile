import { useCallback, useEffect, useState } from 'react';
import { MapPoint } from '../api/integrationTypes';
import { resolveVolunteerMapPoint } from '../services/userLocation';

export function useVolunteerMapLocation(loadOnMount = true) {
  const [userLocation, setUserLocation] = useState<MapPoint | null>(null);
  const [loading, setLoading] = useState(loadOnMount);

  const refresh = useCallback(async (options?: { silent?: boolean; preferFresh?: boolean }) => {
    setLoading(true);
    try {
      const point = await resolveVolunteerMapPoint({
        silent: options?.silent ?? false,
        preferFresh: options?.preferFresh ?? true,
      });
      if (point) setUserLocation(point);
      return point;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loadOnMount) return;
    void (async () => {
      const point = await resolveVolunteerMapPoint({ silent: true, preferFresh: true });
      if (point) setUserLocation(point);
      setLoading(false);
    })();
  }, [loadOnMount]);

  return { userLocation, loading, refresh, setUserLocation };
}
