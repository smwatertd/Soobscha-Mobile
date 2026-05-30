import { ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CityOption } from '../api/locations';
import { formatCityMetaLine } from '../utils/cityDisplay';
import { Button } from './Button';
import { Icon } from './Icon';
import { ScreenHeader } from './ScreenHeader';
import { RADIUS, T } from '../theme/tokens';

function highlightParts(label: string, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return { before: label, match: '', after: '' };

  const index = label.toLowerCase().indexOf(normalized);
  if (index === -1) return { before: label, match: '', after: '' };

  return {
    before: label.slice(0, index),
    match: label.slice(index, index + normalized.length),
    after: label.slice(index + normalized.length),
  };
}

type Props = {
  title?: string;
  onBack: () => void;
  cities: CityOption[];
  loading: boolean;
  error: string | null;
  query: string;
  onQueryChange: (value: string) => void;
  selectedCode?: string | null;
  onSelect: (city: CityOption) => void;
  onSuggestCity?: () => void;
  listHeaderExtra?: ReactNode;
};

export function CityPickerScreen({
  title = 'Выберите город',
  onBack,
  cities,
  loading,
  error,
  query,
  onQueryChange,
  selectedCode,
  onSelect,
  onSuggestCity,
  listHeaderExtra,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader title={title} onBack={onBack} />

      <View style={styles.searchWrap}>
        <View style={styles.searchField}>
          <Icon name="search" size={20} color={T.muted} />
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder="Начните вводить название"
            placeholderTextColor={T.mutedSoft}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="words"
            autoFocus
          />
          {query.length > 0 ? (
            <Pressable hitSlop={8} onPress={() => onQueryChange('')}>
              <Icon name="close" size={16} color={T.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={T.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={cities}
          keyExtractor={(item) => item.code}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          ListHeaderComponent={
            <>
              {listHeaderExtra}
              <Text style={styles.listHeader}>Совпадения · {cities.length}</Text>
            </>
          }
          renderItem={({ item }) => {
            const selected = item.code === selectedCode;
            const parts = highlightParts(item.label, query);
            const meta = formatCityMetaLine(item);

            return (
              <Pressable
                onPress={() => onSelect(item)}
                style={[styles.cityRow, selected && styles.cityRowSelected]}
              >
                <Icon name="pin" size={18} color={selected ? T.primary : T.muted} strokeWidth={2} />
                <View style={styles.cityBody}>
                  <Text style={styles.cityName}>
                    {parts.before}
                    {parts.match ? <Text style={styles.cityMatch}>{parts.match}</Text> : null}
                    {parts.after}
                  </Text>
                  {meta ? <Text style={styles.cityMeta}>{meta}</Text> : null}
                </View>
                {selected ? (
                  <View style={styles.cityCheck}>
                    <Icon name="check" size={14} color="#fff" strokeWidth={3} />
                  </View>
                ) : null}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Город не найден. Попробуйте другой запрос.</Text>
          }
          ListFooterComponent={
            <View style={styles.suggestSection}>
              <Text style={styles.suggestTitle}>Не нашли свой город?</Text>
              <Button
                kind="ghost"
                size="md"
                full
                icon="plus"
                style={styles.suggestBtn}
                onPress={onSuggestCity}
              >
                Предложить добавить
              </Button>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  searchWrap: {
    paddingTop: 4,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: T.surface,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: RADIUS.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Manrope_500Medium',
    color: T.ink,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 8,
  },
  listHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 2,
    borderRadius: 12,
  },
  cityRowSelected: {
    backgroundColor: T.primarySoft,
  },
  cityBody: {
    flex: 1,
    minWidth: 0,
  },
  cityName: {
    fontSize: 15,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink,
    lineHeight: 20,
  },
  cityMatch: {
    backgroundColor: T.accentSoft,
    color: T.accentDark,
    fontFamily: 'Manrope_800ExtraBold',
  },
  cityMeta: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  cityCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestSection: {
    marginTop: 16,
  },
  suggestTitle: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  suggestBtn: {
    marginHorizontal: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    textAlign: 'center',
  },
  emptyText: {
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    textAlign: 'center',
  },
});
