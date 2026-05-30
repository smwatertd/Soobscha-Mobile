import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { VolunteerSkillCatalogItem } from '../../../api/volunteers';
import {
  ensureSkillCatalogLoaded,
  getVolunteerSkillCatalogItems,
} from '../../../services/skillCatalog';
import { buildSkillLabelMap, resolveSkillLabel } from '../../../utils/volunteerSkillLabels';
import { Chip } from '../../Chip';
import { CompactSelectionField } from './CompactSelectionField';
import { GroupedOption, GroupedOptionsModal } from './GroupedOptionsModal';
import { T, CARD_BG } from '../../../theme/tokens';

type Props = {
  requiredSkills: string[];
  preferredSkills: string[];
  onRequiredChange: (codes: string[]) => void;
  onPreferredChange: (codes: string[]) => void;
  requiredError?: string;
};

type SkillTab = 'required' | 'preferred';

function formatSummary(count: number, emptyLabel: string, suffix: string): string {
  if (count === 0) return emptyLabel;
  return `${count} ${suffix}`;
}

export function HelpRequestSkillsPicker({
  requiredSkills,
  preferredSkills,
  onRequiredChange,
  onPreferredChange,
  requiredError,
}: Props) {
  const [catalog, setCatalog] = useState<VolunteerSkillCatalogItem[]>(() =>
    getVolunteerSkillCatalogItems(),
  );
  const [loading, setLoading] = useState(() => getVolunteerSkillCatalogItems().length === 0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SkillTab>('required');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const items = await ensureSkillCatalogLoaded();
        if (!cancelled) {
          setCatalog(items);
        }
      } catch {
        if (!cancelled) {
          setLoadError('Не удалось загрузить каталог навыков');
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
  }, []);

  const labelByCode = useMemo(() => buildSkillLabelMap(catalog), [catalog]);

  const options = useMemo<GroupedOption[]>(
    () =>
      catalog.map((item) => ({
        code: item.code,
        label: item.label,
        groupLabel: item.group_label || item.group,
      })),
    [catalog],
  );

  const summaryValue = useMemo(() => {
    const parts: string[] = [];
    if (requiredSkills.length) {
      parts.push(formatSummary(requiredSkills.length, '', 'обязательных'));
    }
    if (preferredSkills.length) {
      parts.push(formatSummary(preferredSkills.length, '', 'желательных'));
    }
    return parts.length ? parts.join(' · ') : null;
  }, [requiredSkills.length, preferredSkills.length]);

  const activeSelectedCodes = activeTab === 'required' ? requiredSkills : preferredSkills;

  const toggleActiveTabCode = (code: string) => {
    if (activeTab === 'required') {
      if (requiredSkills.includes(code)) {
        onRequiredChange(requiredSkills.filter((item) => item !== code));
        return;
      }
      onRequiredChange([...requiredSkills, code]);
      if (preferredSkills.includes(code)) {
        onPreferredChange(preferredSkills.filter((item) => item !== code));
      }
      return;
    }

    if (preferredSkills.includes(code)) {
      onPreferredChange(preferredSkills.filter((item) => item !== code));
      return;
    }
    onPreferredChange([...preferredSkills, code]);
    if (requiredSkills.includes(code)) {
      onRequiredChange(requiredSkills.filter((item) => item !== code));
    }
  };

  const getChipStyle = (code: string, selectedInActiveTab: boolean) => {
    if (requiredSkills.includes(code)) {
      return styles.chipRequired;
    }
    if (preferredSkills.includes(code)) {
      return styles.chipPreferred;
    }
    if (selectedInActiveTab) {
      return activeTab === 'required' ? styles.chipRequired : styles.chipPreferred;
    }
    return undefined;
  };

  const modalSelectedCodes = useMemo(
    () => [...new Set([...requiredSkills, ...preferredSkills, ...activeSelectedCodes])],
    [requiredSkills, preferredSkills, activeSelectedCodes],
  );

  if (loading) {
    return (
      <View style={styles.root}>
        <Text style={styles.label}>Навыки волонтёров</Text>
        <ActivityIndicator color={T.primary} style={styles.loader} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.root}>
        <Text style={styles.label}>Навыки волонтёров</Text>
        <Text style={styles.error}>{loadError}</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.root}>
        <CompactSelectionField
          label="Навыки волонтёров"
          value={summaryValue}
          placeholder="Выберите навыки"
          onPress={() => setModalOpen(true)}
          error={requiredError}
        />

        {(requiredSkills.length > 0 || preferredSkills.length > 0) && (
          <View style={styles.preview}>
            {requiredSkills.length > 0 && (
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Обязательные</Text>
                <View style={styles.previewChips}>
                  {requiredSkills.slice(0, 4).map((code) => (
                    <Chip
                      key={`req-${code}`}
                      label={resolveSkillLabel(code, labelByCode)}
                      active
                      style={styles.chipRequired}
                    />
                  ))}
                  {requiredSkills.length > 4 ? (
                    <Text style={styles.moreText}>+{requiredSkills.length - 4}</Text>
                  ) : null}
                </View>
              </View>
            )}
            {preferredSkills.length > 0 && (
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, styles.previewLabelPreferred]}>Желательные</Text>
                <View style={styles.previewChips}>
                  {preferredSkills.slice(0, 4).map((code) => (
                    <Chip
                      key={`pref-${code}`}
                      label={resolveSkillLabel(code, labelByCode)}
                      active
                      style={styles.chipPreferred}
                    />
                  ))}
                  {preferredSkills.length > 4 ? (
                    <Text style={styles.moreText}>+{preferredSkills.length - 4}</Text>
                  ) : null}
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      <GroupedOptionsModal
        visible={modalOpen}
        title="Навыки волонтёров"
        subtitle="Отметьте обязательные и желательные навыки"
        options={options}
        mode="multi"
        selectedCodes={modalSelectedCodes}
        onToggleCode={toggleActiveTabCode}
        getChipStyle={getChipStyle}
        onClose={() => setModalOpen(false)}
        searchPlaceholder="Поиск навыка…"
        headerSlot={
          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, activeTab === 'required' && styles.tabRequiredActive]}
              onPress={() => setActiveTab('required')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'required' && styles.tabTextRequiredActive,
                ]}
              >
                Обязательные ({requiredSkills.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'preferred' && styles.tabPreferredActive]}
              onPress={() => setActiveTab('preferred')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'preferred' && styles.tabTextPreferredActive,
                ]}
              >
                Желательные ({preferredSkills.length})
              </Text>
            </Pressable>
          </View>
        }
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
  preview: {
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: T.surface2,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  previewRow: {
    gap: 6,
  },
  previewLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.danger,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  previewLabelPreferred: {
    color: T.primary,
  },
  previewChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  moreText: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: T.surface2,
    borderWidth: 1,
    borderColor: T.borderSoft,
    alignItems: 'center',
  },
  tabRequiredActive: {
    backgroundColor: T.dangerSoft,
    borderColor: T.danger,
  },
  tabPreferredActive: {
    backgroundColor: T.primarySoft,
    borderColor: T.primary,
  },
  tabText: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
    textAlign: 'center',
  },
  tabTextRequiredActive: {
    color: T.danger,
  },
  tabTextPreferredActive: {
    color: T.primaryDark,
  },
  chipRequired: {
    backgroundColor: T.dangerSoft,
    borderColor: T.danger,
  },
  chipPreferred: {
    backgroundColor: T.primarySoft,
    borderColor: T.primary,
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
