import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { BottomNav, TabId } from '../components/BottomNav';
import { useUnreadNotificationsCount } from '../hooks/useUnreadNotificationsCount';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useVolunteerVerifDraft } from '../providers/VolunteerVerifDraftProvider';
import {
  DEFAULT_VOLUNTEER_FEED_FILTERS,
  normalizeVolunteerFeedFilters,
  VolunteerFeedFilters,
} from '../types/volunteerFeedFilters';
import {
  DEFAULT_VOLUNTEER_MAP_FILTERS,
  mapFiltersForSocialRequests,
  VolunteerMapFilters,
} from '../types/volunteerMapFilters';
import { cloneVolunteerMapFilters } from '../utils/volunteerMapQuickFilters';
import { VolunteerFeedScreen } from './volunteer/VolunteerFeedScreen';
import { VolunteerHomeScreen } from './VolunteerHomeScreen';
import { VolunteerMapScreen } from './VolunteerMapScreen';
import { VolunteerMyScreen } from './volunteer/VolunteerMyScreen';
import { VolunteerProfileScreen } from './volunteer/VolunteerProfileScreen';
import { T } from '../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VolunteerMain'>;
  route: RouteProp<RootStackParamList, 'VolunteerMain'>;
  onLogout: () => void | Promise<void>;
};

export function VolunteerMainScreen({ navigation, route, onLogout }: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabId>(route.params?.initialTab ?? 'home');
  const [feedFilters, setFeedFilters] = useState<VolunteerFeedFilters>(() =>
    normalizeVolunteerFeedFilters(route.params?.feedFilters),
  );
  const [mapFilters, setMapFilters] = useState<VolunteerMapFilters>(() =>
    mapFiltersForSocialRequests({
      ...DEFAULT_VOLUNTEER_MAP_FILTERS,
      ...normalizeVolunteerFeedFilters(route.params?.mapFilters),
      availableToMe: route.params?.mapFilters?.availableToMe ?? false,
    }),
  );
  const { unreadCount } = useUnreadNotificationsCount();
  const { resetDraft, reload } = useVolunteerVerifDraft();

  const openProfileCityPicker = useCallback(() => {
    navigation.navigate('ProfileCityPicker', { role: 'volunteer' });
  }, [navigation]);

  useEffect(() => {
    if (route.params?.initialTab) {
      setTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  useEffect(() => {
    if (route.params?.feedFilters) {
      setFeedFilters(normalizeVolunteerFeedFilters(route.params.feedFilters));
    }
    if (route.params?.mapFilters) {
      setMapFilters(
        mapFiltersForSocialRequests(
          cloneVolunteerMapFilters({
            ...DEFAULT_VOLUNTEER_MAP_FILTERS,
            ...normalizeVolunteerFeedFilters(route.params.mapFilters),
            availableToMe: route.params.mapFilters.availableToMe,
          }),
        ),
      );
    }
  }, [route.params?.feedFilters, route.params?.mapFilters]);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.initialTab) {
        setTab(route.params.initialTab);
      }
      if (route.params?.feedFilters) {
        setFeedFilters(normalizeVolunteerFeedFilters(route.params.feedFilters));
      }
      if (route.params?.mapFilters) {
        setMapFilters(
          mapFiltersForSocialRequests(
            cloneVolunteerMapFilters({
              ...DEFAULT_VOLUNTEER_MAP_FILTERS,
              ...normalizeVolunteerFeedFilters(route.params.mapFilters),
              availableToMe: route.params.mapFilters.availableToMe,
            }),
          ),
        );
      }
    }, [route.params?.initialTab, route.params?.feedFilters, route.params?.mapFilters]),
  );

  const openHelpRequest = (helpRequestId: string) => {
    navigation.navigate('HelpRequestDetail', { helpRequestId });
  };

  const openHelpRequestReport = (params: {
    helpRequestId: string;
    title: string;
    isMaterial?: boolean;
  }) => {
    navigation.navigate('BeneficiaryReportView', {
      helpRequestId: params.helpRequestId,
      title: params.title,
      isMaterial: params.isMaterial ?? false,
      readOnly: true,
    });
  };

  if (tab === 'map') {
    return (
      <VolunteerMapScreen
        activeTab={tab}
        onTabPress={setTab}
        onRequestPress={openHelpRequest}
        mapFilters={mapFilters}
        onMapFiltersChange={(next) => setMapFilters(mapFiltersForSocialRequests(next))}
        onFiltersPress={() => navigation.navigate('VolunteerMapFilters', { filters: mapFilters })}
      />
    );
  }

  if (tab === 'home') {
    return (
      <VolunteerHomeScreen
        activeTab={tab}
        onTabPress={setTab}
        unreadCount={unreadCount}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onRequestPress={openHelpRequest}
        onOpenReport={openHelpRequestReport}
        onOpenMyDeals={() => setTab('my')}
        onOpenFeed={() => setTab('feed')}
      />
    );
  }

  if (tab === 'feed') {
    return (
      <VolunteerFeedScreen
        activeTab={tab}
        onTabPress={setTab}
        unreadCount={unreadCount}
        feedFilters={feedFilters}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onFiltersPress={() => navigation.navigate('VolunteerFeedFilters', { filters: feedFilters })}
        onResetFilters={() => setFeedFilters(DEFAULT_VOLUNTEER_FEED_FILTERS)}
        onNetworkErrorPress={() => navigation.navigate('ErrorState', { variant: 'network' })}
        onMapPress={() => setTab('map')}
        onRequestPress={openHelpRequest}
      />
    );
  }

  if (tab === 'my') {
    return (
      <VolunteerMyScreen
        activeTab={tab}
        onTabPress={setTab}
        onRequestPress={openHelpRequest}
        onOpenReport={openHelpRequestReport}
      />
    );
  }

  if (tab === 'profile') {
    return (
      <VolunteerProfileScreen
        activeTab={tab}
        onTabPress={setTab}
        onLogout={onLogout}
        onOpenNotifications={() => navigation.navigate('Notifications')}
        onOpenWatched={() => navigation.navigate('VolunteerWatched')}
        onEditCity={openProfileCityPicker}
        onOpenVerification={(status) =>
          navigation.navigate('VolunteerVerifActive', { status })
        }
        onStartVerification={() => {
          resetDraft();
          void reload();
          navigation.navigate('VolunteerVerifGeneral');
        }}
      />
    );
  }

  return (
    <View style={[styles.placeholder, { paddingTop: insets.top }]}>
      <View style={styles.placeholderBody}>
        <Text style={styles.placeholderTitle}>Экран в разработке</Text>
      </View>
      <BottomNav active={tab} onTabPress={setTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: T.bg,
  },
  placeholderBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  placeholderTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    marginBottom: 8,
  },
  placeholderSub: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
});
