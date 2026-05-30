import { forwardRef, useImperativeHandle, useRef } from 'react';
import { ViewStyle } from 'react-native';
import { MapPoint, SocialHelpRequestSummary } from '../../api/integrationTypes';
import { collectMapPins, MapHelpRequestPin } from '../../utils/mapHelpRequest';
import { HelpRequestsMap, HelpRequestsMapRef } from './HelpRequestsMap';

export type SocialMapRef = {
  centerOn: (point: MapPoint, zoom?: number) => void;
  fitRequests: (requests: MapHelpRequestPin[]) => void;
  fitMapContent: (requests: MapHelpRequestPin[], user?: MapPoint | null) => void;
};

type Props = {
  requests: SocialHelpRequestSummary[];
  loading?: boolean;
  style?: ViewStyle;
  initialCenter?: MapPoint;
  initialZoom?: number;
  showUserPosition?: boolean;
  onRequestPress?: (request: SocialHelpRequestSummary) => void;
  onRegionChange?: (region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => void;
};

export const SocialRequestsMap = forwardRef<SocialMapRef, Props>(function SocialRequestsMap(
  { requests, onRequestPress, ...rest },
  ref,
) {
  const innerRef = useRef<HelpRequestsMapRef>(null);
  const pins = collectMapPins(requests);

  useImperativeHandle(ref, () => ({
    centerOn: (point, zoom) => innerRef.current?.centerOn(point, zoom),
    fitRequests: (items) => innerRef.current?.fitRequests(items),
    fitMapContent: (items, user) => innerRef.current?.fitMapContent(items, user),
  }));

  return (
    <HelpRequestsMap
      ref={innerRef}
      {...rest}
      requests={pins}
      onRequestPress={(pin) => {
        const match = requests.find((item) => item.id === pin.id);
        if (match) onRequestPress?.(match);
      }}
    />
  );
});
