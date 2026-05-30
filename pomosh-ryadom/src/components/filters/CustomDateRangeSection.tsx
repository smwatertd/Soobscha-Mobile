import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RADIUS, T } from '../../theme/tokens';

type Props = {
  fromIso: string | null;
  toIso: string | null;
  onChange: (fromIso: string | null, toIso: string | null) => void;
  /** Для «Создано» — можно выбирать прошлые даты */
  allowPast?: boolean;
  horizonDays?: number;
};

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDayChip(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function buildDayOptions(allowPast: boolean, horizonDays: number): string[] {
  const today = startOfDay(new Date());
  const days: string[] = [];
  const startOffset = allowPast ? -horizonDays : 0;
  const endOffset = allowPast ? 0 : horizonDays;

  for (let offset = startOffset; offset <= endOffset; offset += 1) {
    const day = new Date(today);
    day.setDate(day.getDate() + offset);
    days.push(toIsoDate(day));
  }
  return days;
}

function DayRow({
  label,
  selectedIso,
  options,
  onSelect,
}: {
  label: string;
  selectedIso: string | null;
  options: string[];
  onSelect: (iso: string) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysScroll}
      >
        {options.map((iso) => {
          const active = selectedIso === iso;
          return (
            <Pressable
              key={iso}
              onPress={() => onSelect(iso)}
              style={[styles.dayChip, active && styles.dayChipActive]}
            >
              <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                {formatDayChip(iso)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function CustomDateRangeSection({
  fromIso,
  toIso,
  onChange,
  allowPast = false,
  horizonDays = 60,
}: Props) {
  const options = useMemo(
    () => buildDayOptions(allowPast, horizonDays),
    [allowPast, horizonDays],
  );

  const handleFrom = (iso: string) => {
    const nextFrom = iso;
    let nextTo = toIso;
    if (nextTo && nextTo < nextFrom) nextTo = nextFrom;
    onChange(nextFrom, nextTo);
  };

  const handleTo = (iso: string) => {
    const nextTo = iso;
    let nextFrom = fromIso;
    if (nextFrom && nextTo < nextFrom) nextFrom = nextTo;
    onChange(nextFrom, nextTo);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>Выберите начало и конец периода</Text>
      <DayRow label="С" selectedIso={fromIso} options={options} onSelect={handleFrom} />
      <DayRow label="По" selectedIso={toIso} options={options} onSelect={handleTo} />
      {fromIso && toIso ? (
        <Text style={styles.summary}>
          {formatDayChip(fromIso)} — {formatDayChip(toIso)}
        </Text>
      ) : (
        <Text style={styles.summaryMuted}>Укажите обе даты периода</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    padding: 12,
    backgroundColor: T.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.borderSoft,
    gap: 10,
  },
  hint: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
  },
  row: { gap: 6 },
  rowLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.ink2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  daysScroll: { gap: 6, paddingRight: 4 },
  dayChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: T.surface2,
    borderWidth: 1.5,
    borderColor: T.borderSoft,
  },
  dayChipActive: {
    borderColor: T.primary,
    backgroundColor: T.primarySoft,
  },
  dayChipText: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  dayChipTextActive: { color: T.primary },
  summary: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primary,
  },
  summaryMuted: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.mutedSoft,
  },
});
