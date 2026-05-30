import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from './Icon';
import { T } from '../theme/tokens';

type TabId = 'home' | 'feed' | 'my' | 'map' | 'profile';

export type { TabId };

type Props = {
  active?: TabId;
  onTabPress?: (tab: TabId) => void;
};

const ITEMS: { id: TabId; icon: IconName; label: string }[] = [
  { id: 'home', icon: 'home', label: 'Главная' },
  { id: 'feed', icon: 'list', label: 'Заявки' },
  { id: 'my', icon: 'heart', label: 'Мои дела' },
  { id: 'map', icon: 'map', label: 'Карта' },
  { id: 'profile', icon: 'user', label: 'Профиль' },
];

export function BottomNav({ active = 'home', onTabPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {ITEMS.map((it) => {
        const isActive = it.id === active;
        return (
          <Pressable
            key={it.id}
            onPress={() => onTabPress?.(it.id)}
            style={styles.item}
          >
            <Icon
              name={it.icon}
              size={22}
              color={isActive ? T.primary : T.mutedSoft}
              strokeWidth={isActive ? 2 : 1.6}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>{it.label}</Text>
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
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 52,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Manrope_500Medium',
    color: T.mutedSoft,
  },
  labelActive: {
    fontFamily: 'Manrope_700Bold',
    color: T.primary,
  },
});
