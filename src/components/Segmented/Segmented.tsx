import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemed, type AppTheme } from '../../theme';

export type SegmentOption<T extends string | number> = { value: T; label: string; disabled?: boolean };

/** Wrapping choice chips; one selected. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { styles } = useThemed(makeStyles);
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {options.map(o => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            disabled={o.disabled}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on, disabled: !!o.disabled }}
            style={[styles.chip, on && styles.chipOn, o.disabled && styles.chipDisabled]}>
            <Text style={[styles.text, on && styles.textOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surface,
    borderWidth: 1.5,
    borderColor: t.colors.border,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: t.colors.textPrimary, borderColor: t.colors.textPrimary },
  chipDisabled: { opacity: 0.4 },
  text: { ...t.type.smallStrong, color: t.colors.textSecondary },
  textOn: { color: t.colors.background },
});
