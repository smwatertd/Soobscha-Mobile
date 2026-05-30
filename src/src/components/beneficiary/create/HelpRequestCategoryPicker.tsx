import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { CodeLabel } from '../../../api/helpRequests';
import { ensureLabelCatalogLoaded } from '../../../services/labelCatalog';
import { HelpRequestType } from '../../../navigation/createHelpRequestTypes';
import { Chip } from '../../Chip';
import { CompactSelectionField } from './CompactSelectionField';
import { FieldError } from './FieldError';
import { GroupedOption, GroupedOptionsModal } from './GroupedOptionsModal';
import { T } from '../../../theme/tokens';

type Props = {
  requestType: HelpRequestType;
  value: string | null;
  selectedLabel?: string;
  onChange: (code: string, label: string) => void;
  error?: string;
  variant?: 'field' | 'chips';
};

export const MATERIAL_CHIP_ICONS = {
  FOOD: 'heart',
  MEDICINE: 'document',
  MEDICAL_SUPPLIES: 'heart',
  CLOTHING: 'document',
  HYGIENE: 'document',
  CHILDREN_GOODS: 'heart',
  HOUSEHOLD_GOODS: 'document',
  TRANSPORT: 'car',
  HOUSING_UTILITIES: 'document',
  TREATMENT: 'heart',
  REHABILITATION: 'leaf',
  EQUIPMENT: 'edit',
  PROPERTY: 'document',
  OTHER: 'plus',
} as const;

export function HelpRequestCategoryPicker({
  requestType,
  value,
  selectedLabel,
  onChange,
  error,
  variant = 'field',
}: Props) {
  const [categories, setCategories] = useState<CodeLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const snapshot = await ensureLabelCatalogLoaded();
        const list = requestType === 'material' ? snapshot.material : snapshot.social;
        if (!cancelled) {
          setCategories(list);
        }
      } catch {
        if (!cancelled) {
          setLoadError('Не удалось загрузить категории');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requestType]);

  const options = useMemo<GroupedOption[]>(
    () =>
      categories.map((item) => ({
        code: item.code,
        label: item.label,
        groupLabel: requestType === 'material' ? 'Материальная помощь' : 'Социальная помощь',
      })),
    [categories, requestType],
  );

  const displayLabel =
    selectedLabel ||
    categories.find((item) => item.code === value)?.label ||
    null;

  const label =
    requestType === 'material' ? 'Категория сбора' : 'Категория заявки';

  const helperText =
    requestType === 'social'
      ? 'Например: уборка, сборка мебели, доставка — волонтёры увидят категорию в ленте.'
      : 'Поможет волонтёрам и партнёру быстрее разобраться.';

  if (loading) {
    return (
      <View style={styles.root}>
        <Text style={styles.label}>{label}</Text>
        <ActivityIndicator color={T.primary} style={styles.loader} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.root}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.error}>{loadError}</Text>
      </View>
    );
  }

  if (variant === 'chips') {
    return (
      <View style={styles.root}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.chips}>
          {categories.map((item) => (
            <Chip
              key={item.code}
              label={item.label}
              icon={
                requestType === 'material'
                  ? MATERIAL_CHIP_ICONS[item.code as keyof typeof MATERIAL_CHIP_ICONS]
                  : undefined
              }
              active={value === item.code}
              onPress={() => onChange(item.code, item.label)}
            />
          ))}
        </View>
        <Text style={styles.helper}>{helperText}</Text>
        <FieldError message={error} />
      </View>
    );
  }

  return (
    <>
      <CompactSelectionField
        label={label}
        value={displayLabel}
        placeholder="Выберите категорию"
        onPress={() => setModalOpen(true)}
        error={error}
      />
      <Text style={styles.helper}>{helperText}</Text>

      <GroupedOptionsModal
        visible={modalOpen}
        title={label}
        subtitle="Выберите тип помощи"
        options={options}
        mode="single"
        selectedCode={value}
        onSelectSingle={onChange}
        onClose={() => setModalOpen(false)}
        searchPlaceholder="Поиск категории…"
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  helper: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 16,
    marginTop: -4,
  },
  error: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
  },
  loader: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
});
