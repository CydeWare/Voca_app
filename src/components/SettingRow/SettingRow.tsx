import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { space, useThemed, type AppTheme } from '../../theme';

type Props = {
  title: string;
  subtitle?: string;
  value?: boolean;
  onValueChange?: (v: boolean) => void;
  status?: { ok: boolean; text: string };
  onPress?: () => void;
  /** Text shown on the right of a tappable row, e.g. "Change ›". */
  trailing?: string;
  children?: React.ReactNode;
};

export function SettingRow({ title, subtitle, value, onValueChange, status, onPress, trailing, children }: Props) {
  const { t, styles } = useThemed(makeStyles);
  const content = (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: space.md }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {status ? (
        <Text style={[styles.status, { color: status.ok ? t.colors.success : t.colors.error }]}>{status.text}</Text>
      ) : null}
      {trailing ? <Text style={[styles.status, { color: t.colors.primaryDeep }]}>{trailing}</Text> : null}
      {onValueChange ? (
        <Switch
          value={!!value}
          onValueChange={onValueChange}
          accessibilityLabel={title}
          trackColor={{ true: t.colors.primary, false: t.colors.border }}
          thumbColor={t.colors.switchThumb}
        />
      ) : null}
    </View>
  );
  return (
    <View style={styles.wrap}>
      {onPress ? (
        <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => pressed && { opacity: 0.6 }}>
          {content}
        </Pressable>
      ) : (
        content
      )}
      {children ? <View style={{ marginTop: space.md }}>{children}</View> : null}
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
  wrap: {
    paddingVertical: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  title: { ...t.type.bodyStrong, color: t.colors.textPrimary },
  subtitle: { ...t.type.small, color: t.colors.textMuted, marginTop: 2 },
  status: { ...t.type.smallStrong },
});
