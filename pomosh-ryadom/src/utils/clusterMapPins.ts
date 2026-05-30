import { MapHelpRequestPin } from './mapHelpRequest';

export type MapPinCluster = {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  requests: MapHelpRequestPin[];
};

export type ClusteredMapPins = {
  clusters: MapPinCluster[];
  singles: MapHelpRequestPin[];
};

/** Ниже этого масштаба (крупная область) включаем кластеризацию. */
export const CLUSTER_MAX_LATITUDE_DELTA = 0.055;

export function shouldClusterMapPins(latitudeDelta: number, requestCount: number): boolean {
  return latitudeDelta >= CLUSTER_MAX_LATITUDE_DELTA && requestCount >= 2;
}

function clusterCellSize(latitudeDelta: number): number {
  return Math.max(latitudeDelta * 0.14, 0.004);
}

function averageCoordinate(requests: MapHelpRequestPin[], key: 'latitude' | 'longitude'): number {
  const sum = requests.reduce((acc, item) => acc + item[key], 0);
  return sum / requests.length;
}

export function clusterMapRequests(
  requests: MapHelpRequestPin[],
  latitudeDelta: number,
): ClusteredMapPins {
  if (!shouldClusterMapPins(latitudeDelta, requests.length)) {
    return { clusters: [], singles: requests };
  }

  const cellSize = clusterCellSize(latitudeDelta);
  const buckets = new Map<string, MapHelpRequestPin[]>();

  for (const request of requests) {
    const cellLat = Math.floor(request.latitude / cellSize);
    const cellLon = Math.floor(request.longitude / cellSize);
    const key = `${cellLat}:${cellLon}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(request);
    buckets.set(key, bucket);
  }

  const clusters: MapPinCluster[] = [];
  const singles: MapHelpRequestPin[] = [];

  for (const [key, items] of buckets) {
    if (items.length === 1) {
      singles.push(items[0]);
      continue;
    }

    clusters.push({
      id: `cluster-${key}`,
      latitude: averageCoordinate(items, 'latitude'),
      longitude: averageCoordinate(items, 'longitude'),
      count: items.length,
      requests: items,
    });
  }

  return { clusters, singles };
}
