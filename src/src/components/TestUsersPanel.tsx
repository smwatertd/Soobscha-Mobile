import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatPhoneDisplay, TEST_USERS, TestUser } from '../config/testUsers';
import { RADIUS, T, CARD_BG } from '../theme/tokens';
import { Icon, IconName } from './Icon';

type Props = {
  onSelect: (user: TestUser) => void;
  disabled?: boolean;
};

export function TestUsersPanel({ onSelect, disabled }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Icon name="flask" size={18} color={T.info} strokeWidth={2} />
        <Text style={styles.headerText}>Тестовые пользователи</Text>
      </View>
      {TEST_USERS.map((user) => (
        <Pressable
          key={user.id}
          disabled={disabled}
          onPress={() => onSelect(user)}
          style={({ pressed }) => [styles.item, pressed && styles.itemPressed, disabled && styles.itemDisabled]}
        >
          <View style={[styles.iconWrap, { backgroundColor: user.iconBg }]}>
            <Icon
              name={user.role === 'VOLUNTEER' ? 'handshake' : 'user'}
              size={22}
              color={user.iconColor}
              strokeWidth={1.8}
            />
          </View>
          <View style={styles.itemBody}>
            <Text style={styles.itemTitle}>{user.label}</Text>
            <Text style={styles.itemPhone}>+7 {formatPhoneDisplay(user.phoneDigits)}</Text>
          </View>
          <Icon name="chevR" size={18} color={T.mutedSoft} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: T.surface2,
    borderRadius: RADIUS.lg,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  headerText: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.info,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: T.bg,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  itemPressed: {
    opacity: 0.88,
  },
  itemDisabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  itemPhone: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 2,
  },
});
