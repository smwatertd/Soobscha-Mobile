import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, IconName } from '../Icon';
import { StatusBadge } from '../StatusBadge';
import { VolunteerFeedItem } from '../../screens/volunteer/volunteerFeedTypes';
import { helpRequestStatusToBadge } from '../../utils/helpRequestStatus';
import { formatVisitorBeneficiaryRequestMeta } from '../../utils/visitorBeneficiaryRequestMeta';
import { RADIUS, T, CARD_BG, shadowSm } from '../../theme/tokens';

type Props = {
  item: VolunteerFeedItem;
  onPress?: () => void;
  last?: boolean;
  /** `list` — строка внутри ProfileCard; `card` — отдельная карточка в полном списке */
  variant?: 'list' | 'card';
};

function requestIcon(type: VolunteerFeedItem['type']): IconName {
  return type === 'material' ? 'coin' : 'handshake';
}

function thumbColors(type: VolunteerFeedItem['type']) {
  return type === 'material'
    ? { bg: T.accentSoft, icon: T.accentDark }
    : { bg: T.successSoft, icon: T.success };
}

export function VisitorHelpRequestRow({ item, onPress, last, variant = 'card' }: Props) {
  const isMaterial = item.type === 'material';
  const colors = thumbColors(item.type);
  const coverUri = item.mediaSlides?.[0]?.uri ?? item.imageUri;
  const meta = formatVisitorBeneficiaryRequestMeta(item);
  const isList = variant === 'list';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        isList ? styles.listRow : styles.card,
        !isList && shadowSm,
        pressed && styles.pressed,
        isList && !last && styles.listRowBorder,
      ]}
    >
      <View style={[styles.thumb, { backgroundColor: colors.bg }]}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.thumbImage} contentFit="cover" />
        ) : (
          <Icon name={requestIcon(item.type)} size={22} color={colors.icon} />
        )}
        <View
          style={[
            styles.typeDot,
            { backgroundColor: isMaterial ? T.accent : T.primary },
          ]}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.typeLabel, isMaterial && styles.typeLabelMaterial]}>
            {isMaterial ? 'Сбор' : 'Делом'}
          </Text>
          <StatusBadge status={helpRequestStatusToBadge(item.status)} />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {meta ? (
          <Text style={styles.meta} numberOfLines={2}>
            {meta}
          </Text>
        ) : null}
      </View>

      <Icon name="chevR" size={18} color={T.mutedSoft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 10,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  listRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  pressed: { opacity: 0.92 },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  typeDot: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: CARD_BG,
  },
  body: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.primaryDark,
    letterSpacing: 0.2,
  },
  typeLabelMaterial: {
    color: T.accentDark,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    lineHeight: 18,
  },
  meta: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 16,
  },
});
