import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NotificationResponse } from '../../api/integrationTypes';
import { Icon } from '../Icon';
import { T, CARD_BG } from '../../theme/tokens';
import { formatNotificationTime, getNotificationMeta } from '../../utils/notificationPresentation';

type Props = {
  item: NotificationResponse;
  onPress: () => void;
};

export function NotificationCard({ item, onPress }: Props) {
  const meta = getNotificationMeta(item);
  const unread = !item.is_read;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, unread ? styles.cardUnread : styles.cardRead]}
    >
      {unread ? <View style={[styles.unreadStripe, { backgroundColor: meta.color }]} /> : null}

      <View style={[styles.iconWrap, { backgroundColor: `${meta.color}18` }]}>
        <Icon name={meta.icon} size={20} color={meta.color} strokeWidth={2} />
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={[styles.categoryChip, { backgroundColor: `${meta.color}14` }]}>
            <Text style={[styles.categoryText, { color: meta.color }]}>{meta.categoryLabel}</Text>
          </View>
          <Text style={styles.time}>{formatNotificationTime(item.created_at)}</Text>
        </View>

        <Text style={[styles.title, unread && styles.titleUnread]} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.bodyText} numberOfLines={2}>
          {item.body}
        </Text>
      </View>

      {unread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  cardUnread: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  cardRead: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unreadStripe: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'Manrope_700Bold',
    letterSpacing: 0.2,
  },
  time: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
    lineHeight: 19,
    marginBottom: 4,
  },
  titleUnread: {
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
  },
  bodyText: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.primary,
  },
});
