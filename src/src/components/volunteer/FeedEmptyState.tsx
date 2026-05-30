import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { Icon } from '../Icon';
import { VolunteerFeedFilterChip } from '../../utils/volunteerFeedFilterChips';
import { RADIUS, T, CARD_BG } from '../../theme/tokens';

type Props = {
  filterChips?: VolunteerFeedFilterChip[];
  hasActiveFilters?: boolean;
  onFiltersPress?: () => void;
  onResetFilters?: () => void;
};

export function FeedEmptyState({
  filterChips = [],
  hasActiveFilters = false,
  onFiltersPress,
  onResetFilters,
}: Props) {
  const filteredEmpty = hasActiveFilters || filterChips.length > 0;

  return (
    <View style={styles.wrap}>
      {filterChips.length > 0 ? (
        <View style={styles.chipsRow}>
          {filterChips.map((chip) => (
            <Chip key={chip.id} label={chip.label} kind="primary" size="sm" active />
          ))}
        </View>
      ) : null}

      <View style={styles.iconCircle}>
        <Icon name="search" size={44} color={T.muted} strokeWidth={1.4} />
      </View>

      <Text style={styles.title}>
        {filteredEmpty ? 'Ничего не нашлось' : 'Заявок пока нет'}
      </Text>
      <Text style={styles.message}>
        {filteredEmpty
          ? 'Попробуйте расширить радиус поиска или убрать часть фильтров. Возможно, в этой категории сейчас нет открытых заявок.'
          : 'Когда появятся новые заявки в вашем городе, они отобразятся здесь. Можно обновить список или посмотреть на карте.'}
      </Text>

      <View style={styles.actions}>
        {onFiltersPress ? (
          <Button kind="primary" size="md" full icon="filter" onPress={onFiltersPress}>
            {filteredEmpty ? 'Изменить фильтры' : 'Открыть фильтры'}
          </Button>
        ) : null}
        {filteredEmpty && onResetFilters ? (
          <Button kind="ghost" size="md" full onPress={onResetFilters}>
            Сбросить все
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 22,
  },
  actions: {
    width: '100%',
    maxWidth: 260,
    gap: 8,
  },
});
