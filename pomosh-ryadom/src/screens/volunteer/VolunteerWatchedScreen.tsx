import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WatchableVolunteerRequestCard } from '../../components/volunteer/WatchableVolunteerRequestCard';
import { VolunteerRequestCardSkeleton } from '../../components/volunteer/VolunteerRequestCardSkeleton';
import { Icon } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useVolunteerWatchedFeed } from '../../hooks/useVolunteerWatchedFeed';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { T } from '../../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VolunteerWatched'>;
};

export function VolunteerWatchedScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { items, loading, refreshing, loadingMore, error, hasMore, reload, loadMore } =
    useVolunteerWatchedFeed();
  const [listScrollEnabled, setListScrollEnabled] = useState(true);

  const openRequest = useCallback(
    (helpRequestId: string) => {
      navigation.navigate('HelpRequestDetail', { helpRequestId });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof items)[number] }) => (
      <WatchableVolunteerRequestCard
        request={item}
        onPress={() => openRequest(item.id)}
        onHelpPress={() => openRequest(item.id)}
        onCarouselInteractionChange={(active) => setListScrollEnabled(!active)}
      />
    ),
    [openRequest],
  );

  const listEmpty = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <VolunteerRequestCardSkeleton />
          <VolunteerRequestCardSkeleton />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={() => void reload()}>
            Повторить
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Icon name="heart" size={28} color={T.danger} strokeWidth={2} />
        </View>
        <Text style={styles.emptyTitle}>Пока пусто</Text>
        <Text style={styles.emptySub}>
          Нажмите сердечко на карточке заявки в ленте — она появится здесь.
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader title="Избранное" onBack={() => navigation.goBack()} />
      <Text style={styles.subtitle}>
        {loading ? 'Загрузка…' : `${items.length}${hasMore ? '+' : ''} заявок`}
      </Text>

      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 24 },
          items.length === 0 && styles.listContentEmpty,
        ]}
        data={loading && items.length === 0 ? [] : items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={listEmpty}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        scrollEnabled={listScrollEnabled}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={T.primary} />
        }
        onEndReached={() => {
          if (!loading && !refreshing && hasMore) void loadMore();
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={T.primary} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  gap: {
    height: 14,
  },
  center: {
    paddingTop: 24,
    gap: 14,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.primary,
    textAlign: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
