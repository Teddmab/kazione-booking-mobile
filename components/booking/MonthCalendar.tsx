import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/tokens';
import { startOfToday, toLocalDateString } from '@/lib/dateUtils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function mondayBasedWeekday(d: Date): number {
  const day = d.getDay();
  return day === 0 ? 6 : day - 1;
}

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const padStart = mondayBasedWeekday(first);
  const days: (Date | null)[] = [];
  for (let i = 0; i < padStart; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

interface MonthCalendarProps {
  month: Date;
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function MonthCalendar({
  month,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: MonthCalendarProps) {
  const today = startOfToday();
  const todayIso = toLocalDateString(today);
  const cells = buildMonthGrid(month.getFullYear(), month.getMonth());
  const title = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable onPress={onPrevMonth} hitSlop={12}>
          <Text style={styles.nav}>{'‹'}</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={onNextMonth} hitSlop={12}>
          <Text style={styles.nav}>{'›'}</Text>
        </Pressable>
      </View>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((date, i) => {
          if (!date) {
            return <View key={`e-${i}`} style={styles.cell} />;
          }
          const iso = toLocalDateString(date);
          const isPast = date < today;
          const selected = selectedDate === iso;
          const isToday = iso === todayIso;
          return (
            <Pressable
              key={iso}
              disabled={isPast}
              style={styles.cell}
              onPress={() => onSelectDate(iso)}>
              <View
                style={[
                  styles.dayInner,
                  selected && styles.daySelected,
                  isPast && styles.dayPast,
                ]}>
                <Text
                  style={[
                    styles.dayText,
                    selected && styles.dayTextSelected,
                    isPast && styles.dayTextPast,
                    isToday && !selected && styles.dayToday,
                  ]}>
                  {date.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACING.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  nav: { fontSize: 28, color: COLORS.orange, paddingHorizontal: SPACING.sm },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text },
  weekRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: { backgroundColor: COLORS.orange },
  dayPast: { opacity: 0.35 },
  dayText: { ...TYPOGRAPHY.body, color: COLORS.text },
  dayTextSelected: { color: COLORS.background, fontWeight: '700' },
  dayTextPast: { color: COLORS.textMuted },
  dayToday: { textDecorationLine: 'underline', color: COLORS.orange },
});
