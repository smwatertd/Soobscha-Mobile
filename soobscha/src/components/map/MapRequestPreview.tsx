import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CachedImage } from '../media/CachedImage';
import { Icon } from '../Icon';
import { getMapRequestCoverImage, MapHelpRequestPin } from '../../utils/mapHelpRequest';
import { RADIUS, T, CARD_BG, shadowLg } from '../../theme/tokens';

type Props = {
  request: MapHelpRequestPin;
  onPress?: () => void;
};

export function MapRequestPreview({ request, onPress }: Props) {
  const cover = getMapRequestCoverImage(request);
  const isSocial = request.type === 'SOCIAL';
  const metaLine = isSocial
    ? `${request.min_volunteers ?? 0}–${request.max_volunteers ?? 0} волонтёров`
    : 'Материальная помощь';

  return (
    <Pressable onPress={onPress} style={[styles.card, shadowLg]}>
      <View style={styles.row}>
        {cover.uri ? (
          <Image
            source={{ uri: cover.uri }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : cover.mediaId ? (
          <CachedImage mediaId={cover.mediaId} variant="preview" style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.imagePh, isSocial ? styles.imagePhSocial : styles.imagePhMaterial]}>
            <Icon name={isSocial ? 'handshake' : 'coin'} size={24} color={isSocial ? T.primary : T.accent} />
          </View>
        )}
        <View style={styles.body}>
          <View style={styles.chips}>
            <View style={[styles.chipPrimary, isSocial ? styles.chipSocial : styles.chipMaterial]}>
              <Text style={[styles.chipPrimaryText, isSocial ? styles.chipSocialText : styles.chipMaterialText]}>
                {request.address_text?.split(',')[0] ?? (isSocial ? 'Делом' : 'Сбор')}
              </Text>
            </View>
            {request.start_at ? (
              <View style={styles.chipDefault}>
                <Text style={styles.chipDefaultText}>{formatStartAt(request.start_at)}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {request.title}
          </Text>
          <View style={styles.meta}>
            <Icon name={isSocial ? 'user' : 'coin'} size={12} color={T.muted} />
            <Text style={styles.metaText}>{metaLine}</Text>
          </View>
        </View>
        <Icon name="chevR" size={20} color={T.mutedSoft} />
      </View>
    </Pressable>
  );
}

function formatStartAt(value: string): string {
  try {
    const d = new Date(value);
    return d.toLocaleString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePh: {
    backgroundColor: T.surface2,
  },
  imagePhSocial: {
    backgroundColor: T.primarySoft,
  },
  imagePhMaterial: {
    backgroundColor: T.accentSoft,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  chipPrimary: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.pill,
  },
  chipSocial: {
    backgroundColor: T.primarySoft,
  },
  chipMaterial: {
    backgroundColor: T.accentSoft,
  },
  chipPrimaryText: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
  },
  chipSocialText: {
    color: T.primaryDark,
  },
  chipMaterialText: {
    color: T.accentDark,
  },
  chipDefault: {
    backgroundColor: T.surface2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.pill,
  },
  chipDefaultText: {
    fontSize: 11,
    fontFamily: 'Manrope_500Medium',
    color: T.ink2,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
});
