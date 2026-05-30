import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '../../Chip';
import { Icon } from '../../Icon';
import { Button } from '../../Button';
import { RADIUS, T } from '../../../theme/tokens';

export type GroupedOption = {
  code: string;
  label: string;
  groupLabel: string;
};

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: GroupedOption[];
  onClose: () => void;
  searchPlaceholder?: string;
  mode: 'single' | 'multi';
  selectedCode?: string | null;
  onSelectSingle?: (code: string, label: string) => void;
  selectedCodes?: string[];
  onToggleCode?: (code: string) => void;
  getChipStyle?: (code: string, selected: boolean) => ViewStyle | undefined;
  headerSlot?: React.ReactNode;
  doneLabel?: string;
};

export function GroupedOptionsModal({
  visible,
  title,
  subtitle,
  options,
  onClose,
  searchPlaceholder = 'Поиск…',
  mode,
  selectedCode,
  onSelectSingle,
  selectedCodes = [],
  onToggleCode,
  getChipStyle,
  headerSlot,
  doneLabel = 'Готово',
}: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? options.filter(
          (item) =>
            item.label.toLowerCase().includes(normalized) ||
            item.groupLabel.toLowerCase().includes(normalized),
        )
      : options;

    const map = new Map<string, GroupedOption[]>();
    for (const item of filtered) {
      const list = map.get(item.groupLabel) ?? [];
      list.push(item);
      map.set(item.groupLabel, list);
    }
    return [...map.entries()];
  }, [options, query]);

  const handleSelect = (code: string, label: string) => {
    if (mode === 'single') {
      onSelectSingle?.(code, label);
      setQuery('');
      onClose();
      return;
    }
    onToggleCode?.(code);
  };

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} hitSlop={8} style={styles.backBtn}>
            <Icon name="close" size={22} color={T.ink} strokeWidth={2.2} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.searchWrap}>
          <Icon name="search" size={18} color={T.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder}
            placeholderTextColor={T.mutedSoft}
            style={styles.searchInput}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        {headerSlot}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 88 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {groups.length === 0 ? (
            <Text style={styles.empty}>Ничего не найдено</Text>
          ) : (
            groups.map(([groupLabel, items]) => (
              <View key={groupLabel} style={styles.group}>
                <Text style={styles.groupLabel}>{groupLabel}</Text>
                <View style={styles.chips}>
                  {items.map((item) => {
                    const selected =
                      mode === 'single'
                        ? selectedCode === item.code
                        : selectedCodes.includes(item.code);

                    return (
                      <Chip
                        key={item.code}
                        label={item.label}
                        active={selected}
                        onPress={() => handleSelect(item.code, item.label)}
                        style={getChipStyle?.(item.code, selected)}
                      />
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {mode === 'multi' ? (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <Button kind="primary" size="lg" full onPress={handleClose}>
              {doneLabel}
            </Button>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.surface,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Manrope_500Medium',
    color: T.ink,
    paddingVertical: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  group: {
    gap: 8,
  },
  groupLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  empty: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
    textAlign: 'center',
    paddingVertical: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
    backgroundColor: T.bg,
  },
});
