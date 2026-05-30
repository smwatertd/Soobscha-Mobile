import { RefObject, useCallback, useEffect, useState } from 'react';
import { MapPoint } from '../../api/integrationTypes';
import { mapPointsToYamap, toLayoutScreenPoint } from './mapScreenPoints';
import type { YamapRef } from 'react-native-yamap-plus';

export type YamapGeoPin = {
  id: string;
  point: MapPoint;
};

export function useYamapScreenPins(
  mapRef: RefObject<YamapRef | null>,
  pins: YamapGeoPin[],
  enabled: boolean,
) {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  const update = useCallback(() => {
    if (!enabled || !mapRef.current || pins.length === 0) {
      setPositions({});
      return;
    }

    mapRef.current.getScreenPoints?.(mapPointsToYamap(pins.map((pin) => pin.point)), (result) => {
      const next: Record<string, { x: number; y: number }> = {};
      pins.forEach((pin, index) => {
        const raw = result.screenPoints?.[index];
        if (!raw || typeof raw.x !== 'number' || typeof raw.y !== 'number') return;
        next[pin.id] = toLayoutScreenPoint(raw);
      });
      setPositions(next);
    });
  }, [enabled, mapRef, pins]);

  const scheduleUpdate = useCallback(() => {
    update();
    [50, 150, 350, 600, 1000].forEach((delay) => {
      setTimeout(update, delay);
    });
  }, [update]);

  useEffect(() => {
    if (!enabled) {
      setPositions({});
      return;
    }
    scheduleUpdate();
  }, [enabled, pins, scheduleUpdate]);

  return { positions, update, scheduleUpdate };
}
