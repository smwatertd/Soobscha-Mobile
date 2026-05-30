import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { RADIUS, T, CARD_BG, shadowSm } from '../../theme/tokens';

type Props = {
  onOpenFeed?: () => void;
};

export function VolunteerActiveDealsEmptyState({ onOpenFeed }: Props) {
  return (
    <View style={[styles.card, shadowSm]}>
      <View style={styles.iconWrap}>
        <Icon name="handshake" size={32} color={T.primary} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>Сейчас нет заявок, в которых вы участвуете</Text>
      <Text style={styles.message}>
        Выберите подходящую заявку в ленте — помогите делом или поддержите сбор средств.
      </Text>
      {onOpenFeed ? (
        <Button kind="primary" size="md" full icon="search" onPress={onOpenFeed}>
          К списку заявок
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.borderSoft,
    padding: 20,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
});
