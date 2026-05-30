import { describe, expect, it } from 'vitest';
import { clusterMapRequests, shouldClusterMapPins } from './clusterMapPins';
import { MapHelpRequestPin } from './mapHelpRequest';

function pin(id: string, lat: number, lon: number): MapHelpRequestPin {
  return {
    id,
    type: 'SOCIAL',
    title: id,
    latitude: lat,
    longitude: lon,
    category: 'ELDERLY',
  };
}

describe('clusterMapPins', () => {
  it('does not cluster when zoomed in', () => {
    const requests = [pin('a', 55.75, 37.62), pin('b', 55.751, 37.621)];
    const result = clusterMapRequests(requests, 0.02);
    expect(result.clusters).toHaveLength(0);
    expect(result.singles).toHaveLength(2);
  });

  it('clusters nearby pins when zoomed out', () => {
    const requests = [
      pin('a', 55.75, 37.62),
      pin('b', 55.751, 37.621),
      pin('c', 55.9, 37.9),
    ];
    const result = clusterMapRequests(requests, 0.2);
    expect(result.clusters.length).toBeGreaterThanOrEqual(1);
    expect(result.clusters[0].count).toBeGreaterThanOrEqual(2);
  });

  it('shouldClusterMapPins respects threshold', () => {
    expect(shouldClusterMapPins(0.2, 3)).toBe(true);
    expect(shouldClusterMapPins(0.02, 3)).toBe(false);
    expect(shouldClusterMapPins(0.2, 1)).toBe(false);
  });
});
