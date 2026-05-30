import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CodeLabel } from '../api/helpRequests';
import { ensureLabelCatalogLoaded } from '../services/labelCatalog';
import { BottomNav, TabId } from '../components/BottomNav';
import { Chip } from '../components/Chip';
import { Icon } from '../components/Icon';
import { MapRequestPreview } from '../components/map/MapRequestPreview';
import { HelpRequestsMap, HelpRequestsMapRef } from '../integrations/yandex/HelpRequestsMap';
import { useHelpMapRequests } from '../hooks/useHelpMapRequests';
import { useVolunteerMapLocation } from '../hooks/useVolunteerMapLocation';
import { MapHelpRequestPin } from '../utils/mapHelpRequest';
import { MapPinCluster } from '../utils/clusterMapPins';
import {
  countActiveMapFilters,
  DEFAULT_VOLUNTEER_MAP_FILTERS,
  VolunteerMapFilters,
} from '../types/volunteerMapFilters';
import { RADIUS, T, CARD_BG, shadowLg, shadowMd } from '../theme/tokens';

const MAP_LEGEND_REQUEST = T.primary;
const MAP_LEGEND_USER = '#3B82F6';

function mapRequestCountLabel(count: number): string {
  if (count <= 0) return 'Заявки на карте';
  const mod10 = count % 10;
  const mod100 = count % 100;
  let word = 'заявок';
  if (mod10 === 1 && mod100 !== 11) word = 'заявка';
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) word = 'заявки';
  return `${count} ${word} на карте`;
}

type Props = {
  activeTab?: TabId;
  onTabPress?: (tab: TabId) => void;
  onRequestPress?: (requestId: string) => void;
  mapFilters?: VolunteerMapFilters;
  onMapFiltersChange?: (next: VolunteerMapFilters) => void;
  onFiltersPress?: () => void;
};

type CategoryFilter = { id: string | null; label: string };

export function VolunteerMapScreen({
  activeTab = 'map',
  onTabPress,
  onRequestPress,
  mapFilters = DEFAULT_VOLUNTEER_MAP_FILTERS,
  onMapFiltersChange,
  onFiltersPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<HelpRequestsMapRef>(null);
  const { userLocation, refresh: refreshUserLocation } = useVolunteerMapLocation(true);
  const { allRequests, loading, error, updateVisibleRegion, reload } =
    useHelpMapRequests(mapFilters, userLocation);
  const [selected, setSelected] = useState<MapHelpRequestPin | null>(null);
  const [socialCategories, setSocialCategories] = useState<CodeLabel[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showAllSocialCategories, setShowAllSocialCategories] = useState(false);

  useEffect(() => {
    ensureLabelCatalogLoaded()
      .then((snapshot) => {
        setSocialCategories(snapshot.social);
      })
      .catch(() => {
        // categories are optional for map filtering
      });
  }, []);

  useEffect(() => {
    setSelected(null);
    if (mapFilters.socialCategories.length === 0) {
      return;
    }
    const needsExpand = mapFilters.socialCategories.some((code) => {
      const index = socialCategories.findIndex((item) => item.code === code);
      return index >= 4;
    });
    if (needsExpand) {
      setShowAllSocialCategories(true);
    }
  }, [mapFilters.socialCategories, socialCategories]);

  const socialCategoryFilters = useMemo<CategoryFilter[]>(() => {
    const items: CategoryFilter[] = [{ id: null, label: 'Все категории' }];
    for (const category of socialCategories) {
      items.push({ id: category.code, label: category.label });
    }
    return items;
  }, [socialCategories]);

  const mapRequests = allRequests;

  const MAP_PREVIEW_CARD_HEIGHT = 94;
  const geoFabBottom = selected ? 14 + MAP_PREVIEW_CARD_HEIGHT + 12 : 16;
  const legendTop = 114;
  const activeFilterCount = countActiveMapFilters(mapFilters);

  const visibleSocialCategoryFilters = showAllSocialCategories
    ? socialCategoryFilters
    : socialCategoryFilters.slice(0, 4);
  const errorBannerTop = legendTop + 40;

  const handleRequestPress = useCallback((request: MapHelpRequestPin) => {
    setSelected((current) => (current?.id === request.id ? current : request));
  }, []);

  const handleClusterPress = useCallback((cluster: MapPinCluster) => {
    setSelected(null);
    mapRef.current?.zoomToCluster(cluster);
  }, []);

  const handleMapPress = useCallback(() => {
    setSelected(null);
  }, []);

  const handlePreviewPress = () => {
    if (selected) {
      onRequestPress?.(selected.id);
    }
  };

  const handleAvailableToMePress = () => {
    setSelected(null);
    const next = !mapFilters.availableToMe;
    onMapFiltersChange?.({
      ...mapFilters,
      availableToMe: next,
      social: true,
      material: false,
      materialCategories: [],
    });
  };

  const handleSocialCategoryPress = (categoryId: string | null) => {
    setSelected(null);
    onMapFiltersChange?.({
      ...mapFilters,
      socialCategories: categoryId ? [categoryId] : [],
    });
  };

  const handleGeoPress = useCallback(() => {
    setGeoLoading(true);
    void refreshUserLocation({ preferFresh: true })
      .then((point) => {
        if (!point) return;
        mapRef.current?.centerOn(point, 14);
        updateVisibleRegion({
          latitude: point.latitude,
          longitude: point.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      })
      .finally(() => {
        setGeoLoading(false);
      });
  }, [refreshUserLocation, updateVisibleRegion]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.mapWrap}>
        <HelpRequestsMap
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          requests={mapRequests}
          userLocation={userLocation}
          selectedRequestId={selected?.id ?? null}
          initialCenter={userLocation ?? undefined}
          loading={loading}
          onRequestPress={handleRequestPress}
          onClusterPress={handleClusterPress}
          onMapPress={handleMapPress}
          onRegionChange={updateVisibleRegion}
        />

        <View style={[styles.searchBar, shadowLg]}>
          <Icon name="search" size={20} color={T.muted} />
          <Text style={styles.searchText} numberOfLines={1}>
            {mapRequestCountLabel(mapRequests.length)}
          </Text>
          <Pressable style={styles.filterBtn} onPress={onFiltersPress} hitSlop={8}>
            <Icon
              name="filter"
              size={18}
              color={activeFilterCount > 0 ? T.primary : T.ink2}
            />
            {activeFilterCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersChipsScroll}
          contentContainerStyle={styles.chipsContent}
        >
          <Chip
            label="Доступные мне"
            active={mapFilters.availableToMe}
            onPress={handleAvailableToMePress}
          />
          {visibleSocialCategoryFilters.map((filter) => {
            const isActive =
              filter.id === null
                ? mapFilters.socialCategories.length === 0
                : mapFilters.socialCategories.includes(filter.id);
            return (
              <Chip
                key={filter.id ?? 'all-social-cat'}
                label={filter.label}
                active={isActive}
                onPress={() => handleSocialCategoryPress(filter.id)}
              />
            );
          })}
          {!showAllSocialCategories && socialCategoryFilters.length > 4 ? (
            <Chip label="Ещё…" onPress={() => setShowAllSocialCategories(true)} />
          ) : null}
        </ScrollView>

        {error ? (
          <Pressable style={[styles.errorBanner, { top: errorBannerTop }]} onPress={reload}>
            <Text style={styles.errorText}>Не удалось загрузить заявки. Нажмите, чтобы повторить.</Text>
          </Pressable>
        ) : null}

        <View style={[styles.legend, shadowMd, { top: legendTop }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: MAP_LEGEND_REQUEST }]} />
            <Text style={styles.legendText}>Заявка</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: MAP_LEGEND_USER }]} />
            <Text style={styles.legendText}>Вы</Text>
          </View>
        </View>

        <Pressable
          style={[styles.geoFab, { bottom: geoFabBottom }]}
          onPress={handleGeoPress}
          disabled={geoLoading}
        >
          {geoLoading ? (
            <ActivityIndicator color={T.primary} size="small" />
          ) : (
            <Icon name="target" size={22} color={T.primary} strokeWidth={2} />
          )}
        </Pressable>

        {selected ? (
          <View
            style={styles.previewWrap}
            onStartShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
          >
            <MapRequestPreview request={selected} onPress={handlePreviewPress} />
          </View>
        ) : null}
      </View>

      <BottomNav active={activeTab} onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  mapWrap: {
    flex: 1,
    position: 'relative',
  },
  searchBar: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    height: 46,
    borderRadius: RADIUS.md,
    backgroundColor: CARD_BG,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    zIndex: 2,
  },
  searchText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink,
  },
  filterBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontFamily: 'Manrope_700Bold',
    color: '#fff',
  },
  filtersChipsScroll: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    zIndex: 2,
    maxHeight: 40,
  },
  chipsContent: {
    paddingHorizontal: 14,
    gap: 6,
    alignItems: 'center',
  },
  legend: {
    position: 'absolute',
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: CARD_BG,
    zIndex: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  geoFab: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    ...shadowLg,
  },
  previewWrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    zIndex: 3,
  },
  errorBanner: {
    position: 'absolute',
    left: 14,
    right: 14,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.sm,
    padding: 10,
    ...shadowMd,
    zIndex: 2,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    textAlign: 'center',
  },
});
