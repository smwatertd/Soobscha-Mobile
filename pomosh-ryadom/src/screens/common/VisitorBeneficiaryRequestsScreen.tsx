import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { VisitorHelpRequestRow } from '../../components/visitor/VisitorHelpRequestRow';
import { useVisitorBeneficiaryProfile } from '../../hooks/useVisitorBeneficiaryProfile';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { VolunteerFeedItem } from '../volunteer/volunteerFeedTypes';
import { RADIUS, T } from '../../theme/tokens';

type TabId = 'active' | 'completed';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VisitorBeneficiaryRequests'>;
  route: RouteProp<RootStackParamList, 'VisitorBeneficiaryRequests'>;
};

export function VisitorBeneficiaryRequestsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { userId, displayName, initialTab = 'active' } = route.params;
  const [tab, setTab] = useState<TabId>(initialTab === 'completed' ? 'completed' : 'active');
  const { buckets, loading, refreshing, error, reload } = useVisitorBeneficiaryProfile(
    userId,
    displayName,
  );

  const tabs = useMemo(
    () => [
      { id: 'active' as const, label: 'Активные', count: buckets.active.length },
      { id: 'completed' as const, label: 'Завершённые', count: buckets.completed.length },
    ],
    [buckets.active.length, buckets.completed.length],
  );

  const items = useMemo(() => {
    if (tab === 'completed') return buckets.completed;
    return buckets.active;
  }, [buckets.active, buckets.completed, tab]);

  const openRequest = (item: VolunteerFeedItem) => {
    navigation.navigate('HelpRequestDetail', { helpRequestId: item.id });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader title="Заявки благополучателя" onBack={() => navigation.goBack()} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
              <View style={[styles.tabCount, active && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>
                  {item.count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={T.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void reload()}>
            <Text style={styles.retry}>Повторить</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: insets.bottom + 20,
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void reload()} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {tab === 'active' ? 'Нет активных заявок' : 'Нет завершённых заявок'}
            </Text>
          }
          renderItem={({ item, index }) => (
            <VisitorHelpRequestRow
              item={item}
              last={index === items.length - 1}
              onPress={() => openRequest(item)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  tabsContent: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: T.surface2,
  },
  tabActive: { backgroundColor: T.accentSoft },
  tabLabel: { fontSize: 13, fontFamily: 'Manrope_600SemiBold', color: T.muted },
  tabLabelActive: { color: T.accentDark },
  tabCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: T.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabCountActive: { backgroundColor: T.accent },
  tabCountText: { fontSize: 11, fontFamily: 'Manrope_700Bold', color: T.muted },
  tabCountTextActive: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  errorText: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    textAlign: 'center',
  },
  retry: { fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: T.primary },
  emptyText: {
    paddingTop: 32,
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
    textAlign: 'center',
  },
});
