import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Avatar } from '../Avatar';
import { Chip } from '../Chip';
import { Icon } from '../Icon';
import { RADIUS, T, shadowSm } from '../../theme/tokens';

export type ReportPreviewDocument = {
  fileName: string;
  url?: string;
};

type Props = {
  beneficiaryName: string;
  submittedAt: string;
  description: string;
  photoUris: string[];
  rating?: number | null;
  documents?: ReportPreviewDocument[];
  /** Цвет акцента для фото (соц. — success, мат. — accent) */
  accent?: 'success' | 'accent';
  onPhotoPress?: (index: number) => void;
  onPress?: () => void;
};

const ACCENT = {
  success: { border: `${T.success}33`, placeholder: T.successSoft, icon: T.success },
  accent: { border: `${T.accent}33`, placeholder: T.accentSoft, icon: T.accent },
};

export function HelpRequestReportPreviewCard({
  beneficiaryName,
  submittedAt,
  description,
  photoUris,
  rating = null,
  documents = [],
  accent = 'success',
  onPhotoPress,
  onPress,
}: Props) {
  const palette = ACCENT[accent];
  const submittedLabel = new Date(submittedAt).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const content = (
    <>
      <View style={styles.header}>
        <Avatar name={beneficiaryName} size={32} />
        <View style={styles.headerText}>
          <Text style={styles.authorName}>{beneficiaryName}</Text>
          <Text style={styles.submittedMeta}>{submittedLabel} · принят партнёром</Text>
        </View>
        <Chip kind="success" size="sm" icon="check" label="Принят" />
      </View>

      {description ? (
        <Text style={styles.description}>
          {description.startsWith('«') ? description : `«${description}»`}
        </Text>
      ) : null}

      {photoUris.length > 0 ? (
        <>
          <Text style={styles.mediaSectionLabel}>Фото · {photoUris.length}</Text>
          <View style={styles.photoGrid}>
            {photoUris.slice(0, 4).map((uri, index) => (
              <Pressable
                key={`${uri}-${index}`}
                style={[styles.photoCell, { borderColor: palette.border }]}
                onPress={() => onPhotoPress?.(index)}
              >
                {uri ? (
                  <Image source={{ uri }} style={styles.photoImage} contentFit="cover" />
                ) : (
                  <View style={[styles.photoPlaceholder, { backgroundColor: palette.placeholder }]}>
                    <Icon name="image" size={20} color={palette.icon} strokeWidth={1.8} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {documents.length > 0 ? (
        <>
          <Text style={styles.mediaSectionLabel}>Документы · {documents.length}</Text>
          <View style={styles.documentsWrap}>
            {documents.map((doc) => (
              <Pressable
                key={doc.fileName}
                style={styles.documentRow}
                onPress={() => {
                  if (doc.url) void Linking.openURL(doc.url);
                }}
              >
                <View style={styles.documentIcon}>
                  <Icon name="document" size={16} color={T.info} strokeWidth={2} />
                </View>
                <Text style={styles.documentName} numberOfLines={1}>
                  {doc.fileName}
                </Text>
                <Icon name="chevR" size={16} color={T.muted} />
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {rating != null ? (
        <View style={styles.ratingRow}>
          <View>
            <Text style={styles.ratingLabel}>Оценка помощи</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name="star"
                  size={16}
                  color={T.accent}
                  fill={star <= Math.round(rating) ? T.accent : 'none'}
                  strokeWidth={1.5}
                />
              ))}
            </View>
          </View>
          <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[styles.card, shadowSm]}>
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.card, shadowSm]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.borderSoft,
    padding: 14,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  headerText: { flex: 1, minWidth: 0 },
  authorName: { fontSize: 13, fontFamily: 'Manrope_700Bold', color: T.ink },
  submittedMeta: { fontSize: 11, fontFamily: 'Manrope_500Medium', color: T.muted, marginTop: 1 },
  description: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 21,
    marginBottom: 12,
  },
  mediaSectionLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  photoCell: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  photoImage: { width: '100%', height: '100%' },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentsWrap: { gap: 8, marginBottom: 12 },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: T.surface2,
    borderRadius: RADIUS.md,
  },
  documentIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: T.infoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentName: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
  },
  ratingLabel: { fontSize: 11, fontFamily: 'Manrope_600SemiBold', color: T.muted },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
  ratingValue: {
    fontSize: 22,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.5,
  },
});
