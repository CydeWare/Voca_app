import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Weekday } from '../../types/alarm';
import { useThemed, type AppTheme } from '../../theme';
import { WEEKDAYS } from '../../utils/dateUtils';

export function DayPicker({ value, onChange }: { value: Weekday[]; onChange: (days: Weekday[]) => void }) {
  const { styles } = useThemed(makeStyles);
  const toggle = (d: Weekday) =>
    onChange(value.includes(d) ? value.filter(x => x !== d) : [...value, d].sort() as Weekday[]);
  return (
    <View style={styles.row}>
      {WEEKDAYS.map(w => {
        const on = value.includes(w.day);
        return (
          <Pressable
            key={w.day}
            onPress={() => toggle(w.day)}
            accessibilityRole="checkbox"
            accessibilityLabel={w.short}
            accessibilityState={{ checked: on }}
            style={[styles.day, on && styles.dayOn]}>
            <Text style={[styles.text, on && styles.textOn]}>{w.letter}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  day: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: t.colors.border,
  },
  dayOn: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  text: { ...t.type.smallStrong, color: t.colors.textSecondary },
  textOn: { color: t.colors.onPrimary },
});
