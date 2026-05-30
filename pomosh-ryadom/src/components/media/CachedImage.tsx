import { Image, ImageContentFit, ImageProps } from 'expo-image';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import { MediaVariant } from '../../api/integrationTypes';
import { useMediaUrl } from '../../hooks/useMediaUrl';
import { T } from '../../theme/tokens';

type Props = Omit<ImageProps, 'source'> & {
  mediaId?: string | null;
  variant?: MediaVariant;
  containerStyle?: ViewStyle;
  contentFit?: ImageContentFit;
};

export function CachedImage({
  mediaId,
  variant = 'preview',
  containerStyle,
  style,
  contentFit = 'cover',
  ...rest
}: Props) {
  const { url, loading, error } = useMediaUrl(mediaId, variant);

  if (!mediaId) {
    return <View style={[styles.placeholder, containerStyle, style]} />;
  }

  if (loading && !url) {
    return (
      <View style={[styles.placeholder, containerStyle, style]}>
        <ActivityIndicator color={T.primary} />
      </View>
    );
  }

  if (error || !url) {
    return <View style={[styles.placeholder, styles.error, containerStyle, style]} />;
  }

  return (
    <Image
      {...rest}
      source={{ uri: url }}
      style={style}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      recyclingKey={`${mediaId}:${variant}`}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    backgroundColor: T.dangerSoft,
  },
});
