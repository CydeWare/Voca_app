import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { touch, useThemed, type AppTheme } from '../../theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'brand' | 'danger' | 'dawn' | 'light';
  style?: ViewStyle;
  accessibilityHint?: string;
};

export function PrimaryButton({ label, onPress, disabled, loading, tone = 'brand', style, accessibilityHint }: Props) {
  const { t, styles } = useThemed(makeStyles);
  const bg = { brand: t.colors.primary, danger: t.colors.error, dawn: t.colors.accent, light: t.colors.onHero }[tone];
  const fg = { brand: t.colors.onPrimary, danger: t.colors.errorSoft, dawn: t.colors.onAccent, light: t.colors.hero }[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        pressed && styles.pressed,
        style,
      ]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.primaryText, { color: fg }]}>{label}</Text>}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled, style, tone }: Props) {
  const { t, styles } = useThemed(makeStyles);
  const fg = tone === 'light' ? t.colors.onHero : tone === 'danger' ? t.colors.error : t.colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.secondary, { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 }, style]}>
      <Text style={[styles.secondaryText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
  primary: {
    minHeight: 56,
    borderRadius: t.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  pressed: { transform: [{ scale: 0.98 }] },
  primaryText: { ...t.type.bodyStrong, fontSize: 17 },
  secondary: { minHeight: touch.min, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  secondaryText: { ...t.type.bodyStrong },
});
