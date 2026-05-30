import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../Icon';
import { T, shadowMd } from '../../theme/tokens';

export type BeneficiaryTabId = 'home' | 'requests' | 'create' | 'notifications' | 'profile';

type Props = {
  active?: BeneficiaryTabId;
  onTabPress?: (tab: BeneficiaryTabId) => void;
  notificationsUnread?: number;
};

const ITEMS: { id: BeneficiaryTabId; icon: IconName; label: string }[] = [
  { id: 'home', icon: 'home', label: 'Главная' },
  { id: 'requests', icon: 'document', label: 'Мои заявки' },
  { id: 'create', icon: 'plus', label: '' },
  { id: 'notifications', icon: 'bell', label: 'Уведомления' },
  { id: 'profile', icon: 'user', label: 'Профиль' },
];

export function BeneficiaryBottomNav({ active = 'home', onTabPress, notificationsUnread = 0 }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {ITEMS.map((it) => {
        if (it.id === 'create') {
          return (
            <Pressable
              key={it.id}
              onPress={() => onTabPress?.('create')}
              style={[styles.fab, shadowMd]}
            >
              <Icon name="plus" size={24} color="#fff" strokeWidth={2.2} />
            </Pressable>
          );
        }

        const isActive = it.id === active;
        const showDot = it.id === 'notifications' && notificationsUnread > 0;

        return (
          <Pressable key={it.id} onPress={() => onTabPress?.(it.id)} style={styles.item}>
            <View>
              <Icon
                name={it.icon}
                size={22}
                color={isActive ? T.primary : T.mutedSoft}
                strokeWidth={isActive ? 2 : 1.6}
              />
              {showDot && <View style={styles.dot} />}
            </View>
            {it.label ? (
              <Text
                style={[styles.label, isActive && styles.labelActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {it.label}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 8,
    backgroundColor: T.bg,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Manrope_500Medium',
    color: T.mutedSoft,
    textAlign: 'center',
  },
  labelActive: {
    fontFamily: 'Manrope_700Bold',
    color: T.primary,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
  },
  dot: {
    position: 'absolute',
    top: 0,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.accent,
    borderWidth: 1.5,
    borderColor: T.bg,
  },
});
