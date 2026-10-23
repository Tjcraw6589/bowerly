import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { addMonths, daysInMonth, formatDate, isSameDay, startOfDay, toISODate } from '@/lib/dates';
import { selectionHaptic } from '@/services/haptics';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Sheet } from './Sheet';

interface DateSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  value: Date;
  onChange: (date: Date) => void;
  locale: string;
  minDate?: Date;
  testID?: string;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** A compact month calendar. Built in so it looks and behaves identically on every platform. */
export function DateSheet({ visible, onClose, title, value, onChange, locale, minDate, testID }: DateSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title} testID={testID}>
      {/* Keyed on the value so the month shown resets to the selected date each time the sheet opens. */}
      <Calendar key={`${toISODate(value)}-${visible ? 'open' : 'closed'}`} value={value} onChange={onChange} onClose={onClose} locale={locale} minDate={minDate} testID={testID} />
    </Sheet>
  );
}

interface CalendarProps {
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
  locale: string;
  minDate?: Date;
  testID?: string;
}

function Calendar({ value, onChange, onClose, locale, minDate, testID }: CalendarProps) {
  const { colors, radius, spacing } = useTheme();
  const [cursor, setCursor] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const leading = new Date(year, month, 1).getDay();
    const total = daysInMonth(year, month);
    const list: (Date | null)[] = [];
    for (let i = 0; i < leading; i++) list.push(null);
    for (let day = 1; day <= total; day++) list.push(new Date(year, month, day));
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [cursor]);

  const today = startOfDay(new Date());
  const min = minDate ? startOfDay(minDate) : null;

  const pick = (d: Date) => {
    selectionHaptic();
    onChange(d);
    onClose();
  };

  return (
    <View style={{ paddingHorizontal: spacing.lg }}>
      <View style={styles.monthRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" hitSlop={10} onPress={() => setCursor(addMonths(cursor, -1))}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <AppText variant="h3">{formatDate(cursor, locale, { month: 'long', year: 'numeric' })}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" hitSlop={10} onPress={() => setCursor(addMonths(cursor, 1))}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.grid}>
        {WEEKDAYS.map((w, i) => (
          <View key={`${w}-${i}`} style={styles.cell}>
            <AppText variant="small" tone="faint">
              {w}
            </AppText>
          </View>
        ))}
        {cells.map((d, i) => {
          if (!d) return <View key={`empty-${i}`} style={styles.cell} />;
          const selected = isSameDay(d, value);
          const isToday = isSameDay(d, today);
          const disabled = min !== null && d.getTime() < min.getTime();
          return (
            <Pressable
              key={d.toISOString()}
              accessibilityRole="button"
              accessibilityLabel={formatDate(d, locale)}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => pick(d)}
              testID={testID ? `${testID}-day-${d.getDate()}` : undefined}
              style={styles.cell}
            >
              <View
                style={[
                  styles.day,
                  { borderRadius: radius.pill },
                  selected && { backgroundColor: colors.primary },
                  !selected && isToday && { borderWidth: 1, borderColor: colors.primary },
                ]}
              >
                <AppText variant="body" style={{ color: selected ? colors.onPrimary : disabled ? colors.textFaint : colors.text }}>
                  {d.getDate()}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.footer, { marginTop: spacing.md }]}>
        <Button label="Today" variant="secondary" size="sm" onPress={() => pick(today)} />
        <AppText variant="caption" tone="muted">
          Selected: {formatDate(value, locale)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', justifyContent: 'center', paddingVertical: 3 },
  day: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
