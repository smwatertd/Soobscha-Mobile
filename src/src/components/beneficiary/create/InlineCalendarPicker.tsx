import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../Icon';
import { Chip } from '../../Chip';
import { TIME_SLOTS } from '../../../navigation/createHelpRequestTypes';
import { RADIUS, T } from '../../../theme/tokens';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

type Props = {
  selectedDateIso: string;
  selectedTime: string;
  onDateChange: (iso: string) => void;
  onTimeChange: (time: string) => void;
};

function toIso(year: number, month: number, day: number) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function InlineCalendarPicker({
  selectedDateIso,
  selectedTime,
  onDateChange,
  onTimeChange,
}: Props) {
  const selected = new Date(`${selectedDateIso}T12:00:00`);
  const today = startOfDay(new Date());
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
    const result: { day: number; inMonth: boolean; iso?: string }[] = [];

    for (let i = offset - 1; i >= 0; i -= 1) {
      result.push({ day: prevMonthDays - i, inMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      result.push({ day, inMonth: true, iso: toIso(viewYear, viewMonth, day) });
    }
    while (result.length % 7 !== 0) {
      result.push({ day: result.length, inMonth: false });
    }
    return result;
  }, [viewMonth, viewYear]);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  return (
    <View>
      <Text style={styles.fieldLabel}>Когда нужна помощь</Text>
      <View style={styles.panel}>
        <View style={styles.monthRow}>
          <Pressable onPress={() => shiftMonth(-1)} style={styles.monthBtn}>
            <Icon name="chevL" size={16} color={T.ink} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.monthTitle}>
            {MONTHS[viewMonth]} {viewYear}
          </Text>
          <Pressable onPress={() => shiftMonth(1)} style={styles.monthBtn}>
            <Icon name="chevR" size={16} color={T.ink} strokeWidth={2.2} />
          </Pressable>
        </View>

        <View style={styles.weekdays}>
          {WEEKDAYS.map((d) => (
            <Text key={d} style={styles.weekday}>
              {d}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {Array.from({ length: cells.length / 7 }, (_, rowIndex) => (
            <View key={rowIndex} style={styles.gridRow}>
              {cells.slice(rowIndex * 7, rowIndex * 7 + 7).map((cell, index) => {
                const key = `${rowIndex}-${index}`;
                if (!cell.inMonth || !cell.iso) {
                  return (
                    <View key={key} style={styles.dayCell}>
                      <Text style={styles.dayMuted}>{cell.day}</Text>
                    </View>
                  );
                }

                const cellDate = startOfDay(new Date(`${cell.iso}T12:00:00`));
                const isPast = cellDate < today;
                const isSelected = cell.iso === selectedDateIso;
                const isToday =
                  cell.iso === toIso(today.getFullYear(), today.getMonth(), today.getDate());

                return (
                  <Pressable
                    key={key}
                    disabled={isPast}
                    onPress={() => onDateChange(cell.iso!)}
                    style={[
                      styles.dayCell,
                      isSelected && styles.daySelected,
                      isToday && !isSelected && styles.dayToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        isPast && styles.dayMuted,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>ВРЕМЯ НАЧАЛА</Text>
          <View style={styles.timeChips}>
            {TIME_SLOTS.map((t) => (
              <Chip
                key={t}
                label={t}
                active={selectedTime === t}
                onPress={() => onTimeChange(t)}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
    marginBottom: 8,
  },
  panel: {
    backgroundColor: T.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: T.primary,
    padding: 14,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  weekdays: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
    paddingVertical: 4,
  },
  grid: {
    gap: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  daySelected: {
    backgroundColor: T.primary,
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: T.primary,
  },
  dayText: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: T.ink,
  },
  dayTextSelected: {
    color: '#fff',
    fontFamily: 'Manrope_700Bold',
  },
  dayMuted: {
    color: T.mutedSoft,
  },
  timeBlock: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
    gap: 8,
  },
  timeLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
    letterSpacing: 0.3,
  },
  timeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
