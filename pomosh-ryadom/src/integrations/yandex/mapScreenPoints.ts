import { PixelRatio } from 'react-native';
import { MapPoint } from '../../api/integrationTypes';
import { toYamapPoint } from './mapUtils';

export function toLayoutScreenPoint(raw: { x: number; y: number }) {
  const scale = PixelRatio.get();
  return {
    x: PixelRatio.roundToNearestPixel(raw.x / scale),
    y: PixelRatio.roundToNearestPixel(raw.y / scale),
  };
}

export function mapPointsToYamap(points: MapPoint[]) {
  return points.map(toYamapPoint);
}
