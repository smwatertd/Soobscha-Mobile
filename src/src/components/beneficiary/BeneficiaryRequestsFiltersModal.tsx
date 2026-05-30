import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ensureLabelCatalogLoaded } from '../../services/labelCatalog';
import { Chip } from '../Chip';
import { Icon, IconName } from '../Icon';
import { Button } from '../Button';
import { CustomDateRangeSection } from '../filters/CustomDateRangeSection';
import { SumRangeSlider } from '../SumRangeSlider';
import { BenRequestCardData } from './BenRequestCard';
import { BeneficiaryFilterRow } from './BeneficiaryFilterRow';
import {
  applyBeneficiaryRequestFilters,
  BENEFICIARY_CREATED_PRESETS,
  BENEFICIARY_SPECIAL_FILTER_OPTIONS,
  BENEFICIARY_STATUS_FILTER_OPTIONS,
  BeneficiaryRequestsFilters,
  BeneficiaryRequestsSortOrder,
  BeneficiarySpecialFilter,
  countSpecialFilterMatches,
  countStatusMatchesOnTab,
  DEFAULT_BENEFICIARY_REQUESTS_FILTERS,
  beneficiaryRequestFiltersEqual,
  SUM_FILTER_MAX_RUB,
  SUM_FILTER_MIN_RUB,
} from '../../utils/beneficiaryRequestsFilters';
import { RADIUS, T } from '../../theme/tokens';

type Props = {
  visible: boolean;
  value: BeneficiaryRequestsFilters;
  items: BenRequestCardData[];
  searchQuery: string;
  onClose: () => void;
  onApply: (value: BeneficiaryRequestsFilters) => void;
};

const SORT_OPTIONS: { id: BeneficiaryRequestsSortOrder; label: string; icon: IconName }[] = [
  { id: 'new', label: 'Сначала новые', icon: 'star' },
  { id: 'urgent', label: 'Сначала требующие действия', icon: 'warn' },
  { id: 'progress', label: 'По прогрессу сбора', icon: 'coin' },
  { id: 'deadline', label: 'По ближайшему дедлайну', icon: 'clock' },
];

function FilterGroup({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      {typeof label === 'string' ? <Text style={styles.groupLabel}>{label}</Text> : label}
      {children}
    </View>
  );
}

function FilterTypeCard({
  icon,
  label,
  sub,
  active,
  color,
  bg,
  onPress,
}: {
  icon: IconName;
  label: string;
  sub?: string;
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
        active && { borderColor: color, backgroundColor: bg },
      ]}
    >
      <View style={[styles.typeCardIcon, active && { backgroundColor: color }]}>
        <Icon name={icon} size={20} color={active ? '#fff' : T.muted} strokeWidth={2} />
      </View>
      <Text style={[styles.typeCardLabel, active && { color }]}>{label}</Text>
      {sub ? <Text style={styles.typeCardSub}>{sub}</Text> : null}
    </Pressable>
  );
}

export function BeneficiaryRequestsFiltersModal({
  visible,
  value,
  items,
  searchQuery,
  onClose,
  onApply,
}: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<BeneficiaryRequestsFilters>(value);
  const [categories, setCategories] = useState<{ code: string; label: string }[]>([]);

  useEffect(() => {
    if (!visible) return;
    setDraft(value);
  }, [value, visible]);

  useEffect(() => {
    if (!visible) return;
    ensureLabelCatalogLoaded()
      .then((response) => {
        const merged = [...response.social, ...response.material];
        const unique = new Map<string, { code: string; label: string }>();
        for (const item of merged) unique.set(item.code, item);
        setCategories([...unique.values()]);
      })
      .catch(() => undefined);
  }, [visible]);

  const typeCounts = useMemo(() => {
    const social = items.filter((item) => item.type === 'social').length;
    const material = items.filter((item) => item.type === 'material').length;
    return { social, material };
  }, [items]);

  const filtersDirty = useMemo(
    () => !beneficiaryRequestFiltersEqual(draft, value),
    [draft, value],
  );

  const previewCount = useMemo(
    () => applyBeneficiaryRequestFilters(items, draft, searchQuery).length,
    [draft, items, searchQuery],
  );

  const statusTabMatches = useMemo(
    () => countStatusMatchesOnTab(items, draft.statusCodes),
    [draft.statusCodes, items],
  );

  const showStatusTabHint =
    draft.statusCodes.length > 0 && statusTabMatches === 0 && items.length > 0;

  const showSumRange = draft.typeFilter !== 'social';

  const toggleStatus = (code: string) => {
    setDraft((prev) => ({
      ...prev,
      statusCodes: prev.statusCodes.includes(code)
        ? prev.statusCodes.filter((item) => item !== code)
        : [...prev.statusCodes, code],
    }));
  };

  const toggleSpecial = (id: BeneficiarySpecialFilter) => {
    setDraft((prev) => ({
      ...prev,
      specialFilters: prev.specialFilters.includes(id)
        ? prev.specialFilters.filter((item) => item !== id)
        : [...prev.specialFilters, id],
    }));
  };

  const applyLabel = filtersDirty
    ? 'Применить фильтры'
    : `Показать ${previewCount} ${previewCount === 1 ? 'заявку' : previewCount < 5 ? 'заявки' : 'заявок'}`;

  const sumLabel = `${Math.round(draft.sumMinRub / 1000)} — ${Math.round(draft.sumMaxRub / 1000)} тыс. ₽`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
            <Icon name="close" size={18} color={T.ink2} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.headerTitle}>Фильтры</Text>
          <Pressable onPress={() => setDraft(DEFAULT_BENEFICIARY_REQUESTS_FILTERS)} hitSlop={8}>
            <Text style={styles.resetText}>Сбросить</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FilterGroup label="Тип заявки">
            <View style={styles.typeRow}>
              <FilterTypeCard
                icon="handshake"
                label="Делом"
                sub={`${typeCounts.social} заявок`}
                active={draft.typeFilter === 'social'}
                color={T.primary}
                bg={T.primarySoft}
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    typeFilter: prev.typeFilter === 'social' ? 'all' : 'social',
                  }))
                }
              />
              <FilterTypeCard
                icon="coin"
                label="Сбор средств"
                sub={`${typeCounts.material} заявок`}
                active={draft.typeFilter === 'material'}
                color={T.accent}
                bg={T.accentSoft}
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    typeFilter: prev.typeFilter === 'material' ? 'all' : 'material',
                  }))
                }
              />
            </View>
          </FilterGroup>

          <FilterGroup label="Статус">
            <View style={styles.chips}>
              {BENEFICIARY_STATUS_FILTER_OPTIONS.map((option) => (
                <Chip
                  key={option.code}
                  label={option.label}
                  active={draft.statusCodes.includes(option.code)}
                  onPress={() => toggleStatus(option.code)}
                />
              ))}
            </View>
            {showStatusTabHint ? (
              <Text style={styles.statusHint}>
                Выбранные статусы не встречаются на текущей вкладке. Смените вкладку или снимите
                часть статусов — иначе список будет пустым.
              </Text>
            ) : null}
          </FilterGroup>

          <FilterGroup label="Особые">
            <View style={styles.specialList}>
              {BENEFICIARY_SPECIAL_FILTER_OPTIONS.map((option) => (
                <BeneficiaryFilterRow
                  key={option.id}
                  icon={option.icon}
                  color={option.color}
                  title={option.title}
                  sub={option.sub}
                  count={countSpecialFilterMatches(items, option.id)}
                  active={draft.specialFilters.includes(option.id)}
                  onPress={() => toggleSpecial(option.id)}
                />
              ))}
            </View>
          </FilterGroup>

          <FilterGroup label="Создано">
            <View style={styles.dateGrid}>
              {BENEFICIARY_CREATED_PRESETS.map((preset) => (
                <Chip
                  key={preset.id}
                  label={preset.label}
                  active={draft.createdPreset === preset.id}
                  onPress={() =>
                    setDraft((prev) => {
                      const nextPreset = prev.createdPreset === preset.id ? 'all' : preset.id;
                      return {
                        ...prev,
                        createdPreset: nextPreset,
                        createdFromIso: nextPreset === 'custom' ? prev.createdFromIso : null,
                        createdToIso: nextPreset === 'custom' ? prev.createdToIso : null,
                      };
                    })
                  }
                  style={styles.dateChip}
                />
              ))}
            </View>
            {draft.createdPreset === 'custom' ? (
              <CustomDateRangeSection
                allowPast
                fromIso={draft.createdFromIso ?? null}
                toIso={draft.createdToIso ?? null}
                onChange={(createdFromIso, createdToIso) =>
                  setDraft((prev) => ({ ...prev, createdFromIso, createdToIso }))
                }
              />
            ) : null}
          </FilterGroup>

          {showSumRange ? (
            <FilterGroup
              label={
                <Text style={styles.groupLabel}>
                  Сумма сбора
                  <Text style={styles.groupLabelAccent}> · {sumLabel}</Text>
                </Text>
              }
            >
              <SumRangeSlider
                minValue={SUM_FILTER_MIN_RUB}
                maxValue={SUM_FILTER_MAX_RUB}
                rangeMin={draft.sumMinRub}
                rangeMax={draft.sumMaxRub}
                onChange={(sumMinRub, sumMaxRub) =>
                  setDraft((prev) => ({ ...prev, sumMinRub, sumMaxRub }))
                }
              />
            </FilterGroup>
          ) : null}

          {categories.length > 0 ? (
            <FilterGroup label="Категория">
              <View style={styles.chips}>
                {categories.map((category) => (
                  <Chip
                    key={category.code}
                    label={category.label}
                    active={draft.categoryCodes.includes(category.code)}
                    onPress={() =>
                      setDraft((prev) => ({
                        ...prev,
                        categoryCodes: prev.categoryCodes.includes(category.code)
                          ? prev.categoryCodes.filter((item) => item !== category.code)
                          : [...prev.categoryCodes, category.code],
                      }))
                    }
                  />
                ))}
              </View>
            </FilterGroup>
          ) : null}

          <FilterGroup label="Сортировать">
            {SORT_OPTIONS.map((option) => {
              const active = draft.sortOrder === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setDraft((prev) => ({ ...prev, sortOrder: option.id }))}
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

        <View style={styles.footer}>
          <Button kind="primary" size="lg" full onPress={() => onApply(draft)}>
            {applyLabel}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
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
  resetText: { fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: T.primary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  group: { marginBottom: 24 },
  groupLabel: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: T.ink, marginBottom: 12 },
  groupLabelAccent: { color: T.accent },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeCard: {
    flex: 1,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: T.surface,
    borderWidth: 2,
    borderColor: T.borderSoft,
    gap: 6,
  },
  typeCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeCardLabel: { fontSize: 13, fontFamily: 'Manrope_700Bold', color: T.ink },
  typeCardSub: { fontSize: 11, fontFamily: 'Manrope_500Medium', color: T.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusHint: {
    marginTop: 10,
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.accentDark,
    lineHeight: 17,
  },
  specialList: { gap: 8 },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateChip: { flexBasis: '31%', flexGrow: 1 },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: T.surface,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: T.borderSoft,
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
    backgroundColor: T.bg,
  },
});
