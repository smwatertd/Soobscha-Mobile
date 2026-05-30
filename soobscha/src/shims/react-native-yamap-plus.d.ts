declare module 'react-native-yamap-plus' {
  import type { ComponentType, ReactNode } from 'react';
  import type { ImageSourcePropType, ViewProps, ViewStyle } from 'react-native';

  export type Point = { lat: number; lon: number };

  export const YamapInstance: {
    init: (apiKey: string) => Promise<void>;
    setLocale: (locale: string) => Promise<void>;
    getLocale: () => Promise<string>;
    resetLocale: () => Promise<void>;
  };

  export type YamapRef = {
    setCenter: (
      center: Point,
      zoom?: number,
      azimuth?: number,
      tilt?: number,
      duration?: number,
      animation?: number,
    ) => void;
    fitMarkers?: (points: Point[], duration?: number, animation?: number) => void;
    getScreenPoints?: (
      points: Point[],
      callback: (result: { screenPoints: Array<{ x: number; y: number }> }) => void,
    ) => void;
  };

  export const Search: {
    geocodePoint: (point: Point) => Promise<{ formatted?: string; point?: Point }>;
    searchText: (
      query: string,
      figure?: { point?: Point },
      options?: Record<string, unknown>,
    ) => Promise<{
      formatted?: string;
      point?: Point;
      Components?: Array<{ name: string; kind: number }>;
    }>;
    searchPoint: (point: Point, zoom?: number, options?: Record<string, unknown>) => Promise<{
      formatted?: string;
      point?: Point;
      Components?: Array<{ name: string; kind: number }>;
    }>;
    geocodeAddress: (address: string) => Promise<Point>;
    resolveURI: (uri: string, options?: Record<string, unknown>) => Promise<{
      formatted?: string;
      point?: Point;
    }>;
    searchByURI: (uri: string, options?: Record<string, unknown>) => Promise<{
      formatted?: string;
      point?: Point;
    }>;
  };

  export enum SuggestType {
    UNSPECIFIED = 'UNSPECIFIED',
    GEO = 'GEO',
    BIZ = 'BIZ',
    TRANSIT = 'TRANSIT',
  }

  export type YamapSuggest = {
    title: string;
    subtitle?: string;
    uri?: string;
    center?: Point;
  };

  export const Suggest: {
    suggest: (
      query: string,
      options?: {
        userPosition?: Point;
        suggestTypes?: SuggestType[];
      },
    ) => Promise<YamapSuggest[]>;
    reset: () => Promise<void>;
  };

  export type YamapProps = ViewProps & {
    ref?: React.Ref<YamapRef>;
    style?: ViewStyle;
    initialRegion?: { lat: number; lon: number; zoom?: number };
    showUserPosition?: boolean;
    userLocationAccuracyFillColor?: string;
    userLocationAccuracyStrokeColor?: string;
    userLocationAccuracyStrokeWidth?: number;
    onCameraPositionChange?: (event: {
      nativeEvent: { point: Point; zoom?: number; reason?: string };
    }) => void;
    onMapLoaded?: () => void;
    onCameraPositionChangeEnd?: (event: {
      nativeEvent: { point: Point; zoom?: number; reason?: string };
    }) => void;
    onMapPress?: (event: { nativeEvent: Point }) => void;
    children?: ReactNode;
  };

  export type MarkerProps = {
    point: Point;
    onPress?: () => void;
    source?: ImageSourcePropType;
    visible?: boolean;
  };

  export type CircleProps = {
    center: Point;
    radius: number;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    zIndex?: number;
  };

  export const Yamap: ComponentType<YamapProps>;
  export const Marker: ComponentType<MarkerProps>;
  export const Circle: ComponentType<CircleProps>;
}
