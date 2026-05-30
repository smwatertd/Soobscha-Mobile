import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { CustomDateRangeSection } from '../../components/filters/CustomDateRangeSection';
import { DistanceSlider } from '../../components/DistanceSlider';
import { Icon, IconName } from '../../components/Icon';
import { CodeLabel } from '../../api/helpRequests';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { ensureLabelCatalogLoaded } from '../../services/labelCatalog';
import {
  resolveBeneficiaryFilterCategoryIcon,
  resolveMaterialFilterCategoryIcon,
  resolveSocialFilterCategoryIcon,
} from '../../utils/filterCategoryChipIcons';
import {
  DEFAULT_VOLUNTEER_FEED_FILTERS,
  normalizeVolunteerFeedFilters,
  VolunteerFeedDatePreset,
  VolunteerFeedFilters,
  VolunteerFeedSort,
} from '../../types/volunteerFeedFilters';
import {
  DEFAULT_VOLUNTEER_MAP_FILTERS,
  VolunteerMapFilters,
} from '../../types/volunteerMapFilters';
import { cloneVolunteerMapFilters } from '../../utils/volunteerMapQuickFilters';
import { RADIUS, T, CARD_BG } from '../../theme/tokens';

type FilterRouteName = 'VolunteerFeedFilters' | 'VolunteerMapFilters';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, FilterRouteName>;
};

const SORT_OPTIONS: { id: VolunteerFeedSort; label: string; icon: IconName }[] = [
  { id: 'near', label: 'Сначала ближе', icon: 'pin' },
  { id: 'urgent', label: 'Срочные', icon: 'clock' },
  { id: 'new', label: 'Новые', icon: 'star' },
];

const DATE_PRESETS: { id: VolunteerFeedDatePreset; label: string }[] = [
  { id: 'today', label: 'Сегодня' },
  { id: 'tomorrow', label: 'Завтра' },
  { id: 'this_week', label: 'Эта неделя' },
  { id: 'next_week', label: 'След. неделя' },
  { id: 'this_month', label: 'В этом месяце' },
  { id: 'custom', label: 'Выбрать дату' },
];

export function VolunteerFiltersScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const isMap = route.name === 'VolunteerMapFilters';
  const routeFilters = (
    route.params as { filters?: VolunteerFeedFilters | VolunteerMapFilters } | undefined
  )?.filters;
  const normalized = normalizeVolunteerFeedFilters(
    routeFilters ??
      (isMap ? DEFAULT_VOLUNTEER_MAP_FILTERS : DEFAULT_VOLUNTEER_FEED_FILTERS),
  );
  const [filters, setFilters] = useState<VolunteerFeedFilters | VolunteerMapFilters>(() =>
    isMap
      ? {
          ...DEFAULT_VOLUNTEER_MAP_FILTERS,
          ...normalized,
          availableToMe: (routeFilters as VolunteerMapFilters | undefined)?.availableToMe ?? false,
        }
      : normalized,
  );
  const [socialCategoryOptions, setSocialCategoryOptions] = useState<CodeLabel[]>([]);
  const [materialCategoryOptions, setMaterialCategoryOptions] = useState<CodeLabel[]>([]);
  const [beneficiaryCategories, setBeneficiaryCategories] = useState<CodeLabel[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError(null);

    void ensureLabelCatalogLoaded()
      .then((snapshot) => {
        if (cancelled) return;
        setSocialCategoryOptions(snapshot.social);
        setMaterialCategoryOptions(snapshot.material);
        setBeneficiaryCategories(snapshot.beneficiary);
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogError('Не удалось загрузить категории с сервера');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSocialCategory = (code: string) => {
    setFilters((prev) => ({
      ...prev,
      socialCategories: prev.socialCategories.includes(code)
        ? prev.socialCategories.filter((item) => item !== code)
        : [...prev.socialCategories, code],
    }));
  };

  const toggleMaterialCategory = (code: string) => {
    setFilters((prev) => ({
      ...prev,
      materialCategories: prev.materialCategories.includes(code)
        ? prev.materialCategories.filter((item) => item !== code)
        : [...prev.materialCategories, code],
    }));
  };

  const toggleBeneficiaryCategory = (code: string) => {
    setFilters((prev) => ({
      ...prev,
      beneficiaryCategories: prev.beneficiaryCategories.includes(code)
        ? prev.beneficiaryCategories.filter((item) => item !== code)
        : [...prev.beneficiaryCategories, code],
    }));
  };

  const toggleDatePreset = (preset: VolunteerFeedDatePreset) => {
    setFilters((prev) => {
      const nextPreset = prev.datePreset === preset ? null : preset;
      return {
        ...prev,
        datePreset: nextPreset,
        customDateFromIso: nextPreset === 'custom' ? prev.customDateFromIso : null,
        customDateToIso: nextPreset === 'custom' ? prev.customDateToIso : null,
      };
    });
  };

  const apply = () => {
    navigation.navigate({
      name: 'VolunteerMain',
      params: isMap
        ? {
            initialTab: 'map',
            mapFilters: cloneVolunteerMapFilters(filters as VolunteerMapFilters),
          }
        : {
            initialTab: 'feed',
            feedFilters: { ...filters } as VolunteerFeedFilters,
          },
      merge: true,
    });
  };

  const reset = () => setFilters(isMap ? DEFAULT_VOLUNTEER_MAP_FILTERS : DEFAULT_VOLUNTEER_FEED_FILTERS);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn} hitSlop={8}>
          <Icon name="close" size={18} color={T.ink2} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>Фильтры</Text>
        <Pressable onPress={reset} hitSlop={8}>
          <Text style={styles.reset}>Сбросить</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        <FilterGroup title="Тип заявки">
          <View style={styles.typeRow}>
            <FilterTypeCard
              icon="handshake"
              label="Делом"
              active={filters.social}
              color={T.primary}
              bg={T.primarySoft}
              onPress={() => setFilters((prev) => ({ ...prev, social: !prev.social }))}
            />
            <FilterTypeCard
              icon="coin"
              label="Деньгами"
              active={filters.material}
              color={T.accent}
              bg={T.accentSoft}
              onPress={() => setFilters((prev) => ({ ...prev, material: !prev.material }))}
            />
          </View>
        </FilterGroup>

        {isMap ? (
          <FilterGroup title="Доступность">
            <Pressable
              onPress={() =>
                setFilters((prev) => ({
                  ...prev,
                  availableToMe: !(prev as VolunteerMapFilters).availableToMe,
                }))
              }
              style={[
                styles.availableRow,
                (filters as VolunteerMapFilters).availableToMe && styles.availableRowActive,
              ]}
            >
              <View style={styles.availableTextWrap}>
                <Text style={styles.availableTitle}>Доступные мне</Text>
                <Text style={styles.availableHint}>
                  Заявки, к которым вы можете присоединиться по навыкам и городу
                </Text>
              </View>
              <View
                style={[
                  styles.availableCheck,
                  (filters as VolunteerMapFilters).availableToMe && styles.availableCheckActive,
                ]}
              >
                {(filters as VolunteerMapFilters).availableToMe ? (
                  <Icon name="check" size={14} color="#fff" strokeWidth={2.5} />
                ) : null}
              </View>
            </Pressable>
          </FilterGroup>
        ) : null}

        {filters.social ? (
          <FilterGroup title="Категория заявки · делом">
            {catalogLoading ? (
              <View style={styles.catalogLoading}>
                <ActivityIndicator color={T.primary} />
              </View>
            ) : catalogError ? (
              <Text style={styles.catalogError}>{catalogError}</Text>
            ) : socialCategoryOptions.length === 0 ? (
              <Text style={styles.catalogHint}>Нет категорий социальной помощи</Text>
            ) : (
              <View style={styles.chipsWrap}>
                {socialCategoryOptions.map((category) => (
                  <Chip
                    key={category.code}
                    label={category.label}
                    icon={resolveSocialFilterCategoryIcon(category.code)}
                    active={filters.socialCategories.includes(category.code)}
                    onPress={() => toggleSocialCategory(category.code)}
                  />
                ))}
              </View>
            )}
          </FilterGroup>
        ) : null}

        {filters.material ? (
          <FilterGroup title="Категория сбора">
            {catalogLoading ? (
              <View style={styles.catalogLoading}>
                <ActivityIndicator color={T.primary} />
              </View>
            ) : catalogError ? (
              <Text style={styles.catalogError}>{catalogError}</Text>
            ) : materialCategoryOptions.length === 0 ? (
              <Text style={styles.catalogHint}>Нет категорий материальной помощи</Text>
            ) : (
              <View style={styles.chipsWrap}>
                {materialCategoryOptions.map((category) => (
                  <Chip
                    key={category.code}
                    label={category.label}
                    icon={resolveMaterialFilterCategoryIcon(category.code)}
                    active={filters.materialCategories.includes(category.code)}
                    onPress={() => toggleMaterialCategory(category.code)}
                  />
                ))}
              </View>
            )}
          </FilterGroup>
        ) : null}

        <FilterGroup title="Категория получателя">
          {catalogLoading ? (
            <View style={styles.catalogLoading}>
              <ActivityIndicator color={T.primary} />
            </View>
          ) : catalogError ? (
            <Text style={styles.catalogError}>{catalogError}</Text>
          ) : beneficiaryCategories.length === 0 ? (
            <Text style={styles.catalogHint}>Нет категорий получателей</Text>
          ) : (
            <View style={styles.chipsWrap}>
              {beneficiaryCategories.map((option) => (
                <Chip
                  key={option.code}
                  label={option.label}
                  icon={resolveBeneficiaryFilterCategoryIcon(option.code)}
                  active={filters.beneficiaryCategories.includes(option.code)}
                  onPress={() => toggleBeneficiaryCategory(option.code)}
                />
              ))}
            </View>
          )}
        </FilterGroup>

        <FilterGroup
          title={
            <Text style={styles.groupTitle}>
              Расстояние
              <Text style={styles.groupTitleAccent}> · до {filters.maxDistanceKm} км</Text>
            </Text>
          }
        >
          <DistanceSlider
            value={filters.maxDistanceKm}
            min={1}
            max={30}
            onChange={(maxDistanceKm) => setFilters((prev) => ({ ...prev, maxDistanceKm }))}
          />
          <View style={styles.distanceLabels}>
            <Text style={styles.distanceEdge}>1 км</Text>
            <Text style={styles.distanceEdge}>15 км</Text>
            <Text style={styles.distanceEdge}>30 км</Text>
          </View>
        </FilterGroup>

        <FilterGroup title="Когда">
          <View style={styles.dateGrid}>
            {DATE_PRESETS.map((preset) => (
              <Chip
                key={preset.id}
                label={preset.label}
                active={filters.datePreset === preset.id}
                onPress={() => toggleDatePreset(preset.id)}
                style={styles.dateChip}
              />
            ))}
          </View>
          {filters.datePreset === 'custom' ? (
            <CustomDateRangeSection
              fromIso={filters.customDateFromIso ?? null}
              toIso={filters.customDateToIso ?? null}
              onChange={(customDateFromIso, customDateToIso) =>
                setFilters((prev) => ({ ...prev, customDateFromIso, customDateToIso }))
              }
            />
          ) : null}
        </FilterGroup>

        <FilterGroup title="Сортировать">
          {SORT_OPTIONS.map((option) => {
            const active = filters.sort === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setFilters((prev) => ({ ...prev, sort: option.id }))}
                style={[styles.sortRow, active && styles.sortRowActive]}
              >
                <Icon name={option.icon} size={18} color={active ? T.primary : T.muted} />
                <Text style={styles.sortLabel}>{option.label}</Text>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            );
          })}
        </FilterGroup>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button kind="primary" size="lg" full onPress={apply}>
          Показать заявки
        </Button>
      </View>
    </View>
  );
}

function FilterGroup({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <View style={styles.group}>
      {typeof title === 'string' ? <Text style={styles.groupTitle}>{title}</Text> : title}
      {children}
    </View>
  );
}

function FilterTypeCard({
  icon,
  label,
  active,
  color,
  bg,
  onPress,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.typeCard,
        { borderColor: active ? color : T.borderSoft, backgroundColor: active ? bg : T.surface },
      ]}
    >
      <View style={[styles.typeIcon, { backgroundColor: active ? color : T.surface2 }]}>
        <Icon name={icon} size={20} color={active ? '#fff' : T.muted} strokeWidth={2} />
      </View>
      <Text style={[styles.typeLabel, { color: active ? color : T.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontFamily: 'Manrope_700Bold', color: T.ink },
  reset: { fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: T.primary },
  group: { marginBottom: 24 },
  groupTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    marginBottom: 12,
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    gap: 8,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: { fontSize: 13, fontFamily: 'Manrope_700Bold' },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: T.borderSoft,
    backgroundColor: CARD_BG,
  },
  availableRowActive: {
    borderColor: T.primary,
    backgroundColor: T.primarySoft,
  },
  availableTextWrap: { flex: 1, gap: 4 },
  availableTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  availableHint: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 16,
  },
  availableCheck: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.surface,
  },
  availableCheckActive: {
    borderColor: T.primary,
    backgroundColor: T.primary,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catalogLoading: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  catalogError: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    lineHeight: 18,
  },
  catalogHint: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
  },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateChip: { flexBasis: '31%', flexGrow: 1 },
  groupTitleAccent: { color: T.primary },
  distanceLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  distanceEdge: { fontSize: 12, fontFamily: 'Manrope_500Medium', color: T.muted },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: T.borderSoft,
    marginBottom: 8,
  },
  sortRowActive: { borderColor: T.primary },
  sortLabel: { flex: 1, fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: T.ink },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: T.primary, backgroundColor: T.primary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: T.bg,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
  },
});
