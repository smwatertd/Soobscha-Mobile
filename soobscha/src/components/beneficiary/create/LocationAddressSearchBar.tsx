import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MapPoint } from '../../../api/integrationTypes';
import {
  AddressSuggestion,
  fetchAddressSuggestions,
  MIN_ADDRESS_SUGGEST_QUERY_LENGTH,
  resetAddressSuggestions,
  resolveAddressSuggestion,
} from '../../../integrations/yandex/addressSuggest';
import { Icon } from '../../Icon';
import { RADIUS, T, shadowSm } from '../../../theme/tokens';

const SUGGEST_DEBOUNCE_MS = 450;

type Props = {
  userLocation?: MapPoint | null;
  mapBias?: MapPoint | null;
  onSelect: (point: MapPoint, address: string) => void;
};

export function LocationAddressSearchBar({ userLocation, mapBias, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const requestId = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      inputRef.current?.blur();
      Keyboard.dismiss();
      resetAddressSuggestions().catch(() => undefined);
    };
  }, []);

  const loadSuggestions = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (trimmed.length < MIN_ADDRESS_SUGGEST_QUERY_LENGTH) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      const currentRequest = requestId.current + 1;
      requestId.current = currentRequest;
      setLoading(true);

      try {
        const items = await fetchAddressSuggestions(trimmed, userLocation, mapBias);
        if (requestId.current !== currentRequest) return;
        setSuggestions(items);
      } finally {
        if (requestId.current === currentRequest) {
          setLoading(false);
        }
      }
    },
    [userLocation, mapBias],
  );

  const handleChangeText = (value: string) => {
    setQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (value.trim().length < MIN_ADDRESS_SUGGEST_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      setDropdownOpen(false);
      return;
    }

    setDropdownOpen(true);
    setLoading(true);
    debounceTimer.current = setTimeout(() => {
      loadSuggestions(value);
    }, SUGGEST_DEBOUNCE_MS);
  };

  const handleSelect = async (item: AddressSuggestion) => {
    setDropdownOpen(false);
    setSuggestions([]);
    setLoading(false);
    requestId.current += 1;
    setResolving(true);
    inputRef.current?.blur();
    Keyboard.dismiss();

    try {
      const resolved = await resolveAddressSuggestion(item, userLocation, mapBias);
      if (!resolved) return;

      const label = [item.title, item.subtitle].filter(Boolean).join(', ');
      setQuery(label);
      onSelect(resolved.point, resolved.address);
    } finally {
      setResolving(false);
      resetAddressSuggestions().catch(() => undefined);
    }
  };

  const showSuggestions = dropdownOpen && query.trim().length >= MIN_ADDRESS_SUGGEST_QUERY_LENGTH;

  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <Icon name="search" size={18} color={T.muted} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={handleChangeText}
          onFocus={() => {
            if (query.trim().length >= MIN_ADDRESS_SUGGEST_QUERY_LENGTH) setDropdownOpen(true);
          }}
          onBlur={() => setDropdownOpen(false)}
          placeholder="Поиск улицы или адреса"
          placeholderTextColor={T.mutedSoft}
          style={styles.input}
          returnKeyType="search"
          blurOnSubmit
          onSubmitEditing={Keyboard.dismiss}
          editable={!resolving}
        />
        {loading || resolving ? (
          <ActivityIndicator color={T.primary} size="small" />
        ) : query.length > 0 ? (
          <Pressable
            hitSlop={8}
            onPress={() => {
              setQuery('');
              setSuggestions([]);
              setDropdownOpen(false);
              resetAddressSuggestions().catch(() => undefined);
            }}
          >
            <Icon name="close" size={16} color={T.muted} />
          </Pressable>
        ) : null}
      </View>

      {showSuggestions ? (
        <View style={[styles.dropdown, shadowSm]}>
          {suggestions.length ? (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled
              style={styles.dropdownList}
              showsVerticalScrollIndicator
              renderItem={({ item }) => (
                <Pressable
                  style={styles.suggestionRow}
                  onPress={() => handleSelect(item)}
                >
                  <Icon name="pin" size={16} color={T.primary} />
                  <View style={styles.suggestionText}>
                    <Text style={styles.suggestionTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.subtitle ? (
                      <Text style={styles.suggestionSubtitle} numberOfLines={2}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              )}
            />
          ) : (
            <View style={styles.emptyState}>
              {loading ? (
                <Text style={styles.emptyText}>Ищем адреса…</Text>
              ) : (
                <Text style={styles.emptyText}>Ничего не найдено</Text>
              )}
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    zIndex: 5,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.surface,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Manrope_500Medium',
    color: T.ink,
    paddingVertical: 10,
  },
  dropdown: {
    marginTop: 6,
    maxHeight: 220,
    borderRadius: RADIUS.md,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.borderSoft,
    overflow: 'hidden',
  },
  dropdownList: {
    maxHeight: 220,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  suggestionText: {
    flex: 1,
    gap: 2,
  },
  suggestionTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink,
  },
  suggestionSubtitle: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  emptyState: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
    textAlign: 'center',
  },
});
