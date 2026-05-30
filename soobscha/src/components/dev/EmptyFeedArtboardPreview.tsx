import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FeedEmptyState } from '../volunteer/FeedEmptyState';
import { Icon } from '../Icon';
import { VolunteerFeedFilterChip } from '../../utils/volunteerFeedFilterChips';
import { RADIUS, T } from '../../theme/tokens';

const MOCK_FILTER_CHIPS: VolunteerFeedFilterChip[] = [
  { id: 'type-social', label: 'Делом' },
  { id: 'city', label: 'Москва, Юг' },
  { id: 'category-walk', label: 'Прогулка с собакой' },
];

type Props = {
  /** true — пустая лента с активными фильтрами (e-4); false — без заявок в городе */
  filtered?: boolean;
};

/** Превью artboard e-4 «Пустая лента». */
export function EmptyFeedArtboardPreview({ filtered = true }: Props) {
  return (
    <View style={styles.frame}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Заявки</Text>
          <Text style={styles.subtitle}>
            {filtered ? '0 совпадений' : 'Нет заявок в городе'}
          </Text>
        </View>
        <Pressable style={styles.filterBtn} hitSlop={8}>
          <Icon name="filter" size={18} color={T.ink} strokeWidth={2} />
        </Pressable>
      </View>

      <FeedEmptyState
        filterChips={filtered ? MOCK_FILTER_CHIPS : []}
        hasActiveFilters={filtered}
        onFiltersPress={() => undefined}
        onResetFilters={filtered ? () => undefined : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: T.bg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 1,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
