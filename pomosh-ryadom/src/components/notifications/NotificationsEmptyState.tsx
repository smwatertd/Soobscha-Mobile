import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../Icon';
import { T, CARD_BG } from '../../theme/tokens';
import { NotificationFilterId } from '../../utils/notificationFilters';

type Props = {
  filter: NotificationFilterId;
};

const MESSAGES: Record<NotificationFilterId, { title: string; subtitle: string }> = {
  all: {
    title: 'Пока нет уведомлений',
    subtitle: 'Здесь появятся статусы заявок, верификации и другие важные события',
  },
  requests: {
    title: 'Нет уведомлений по заявкам',
    subtitle: 'Модерация, отклики волонтёров и изменения статуса будут здесь',
  },
  verification: {
    title: 'Нет уведомлений по верификации',
    subtitle: 'Результаты проверки документов появятся в этом разделе',
  },
  payments: {
    title: 'Нет уведомлений о пожертвованиях',
    subtitle: 'Поступления и изменения по сбору средств будут здесь',
  },
};

export function NotificationsEmptyState({ filter }: Props) {
  const copy = MESSAGES[filter];

  return (
    <View style={styles.root}>
      <View style={styles.iconCircle}>
        <Icon name="bell" size={28} color={T.muted} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    textAlign: 'center',
    lineHeight: 21,
  },
});
