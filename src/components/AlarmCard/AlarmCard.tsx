import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { Alarm } from '../../types/alarm';
import { space, useThemed, type AppTheme } from '../../theme';
import { describeRepeat, formatTime } from '../../utils/dateUtils';
import { PROMPT_CATEGORY_LABELS } from '../../data/prompts/prompts';

type Props = {
  alarm: Alarm;
  isNext: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onToggle: (enabled: boolean) => void;
};

/** A list row rather than a card: time carries the weight, details stay quiet. */
export function AlarmCard({ alarm, isNext, onPress, onLongPress, onToggle }: Props) {
  const { t, styles } = useThemed(makeStyles);
  const muted = !alarm.enabled;
  const details = [describeRepeat(alarm.repeatDays), PROMPT_CATEGORY_LABELS[alarm.promptCategory]];
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`Alarm ${formatTime(alarm.hour, alarm.minute)}, ${details.join(', ')}${alarm.enabled ? '' : ', off'}`}
      accessibilityHint="Opens the alarm editor. Long press for more options."
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: t.colors.primarySoft }]}>
      <View style={[styles.marker, isNext && alarm.enabled && styles.markerNext]} />
      <View style={styles.body}>
        <Text style={[styles.time, muted && styles.muted]}>{formatTime(alarm.hour, alarm.minute)}</Text>
        <Text style={[styles.meta, muted && styles.mutedMeta]} numberOfLines={1}>
          {alarm.label ? `${alarm.label} — ` : ''}
          {details.join(', ')}
        </Text>
      </View>
      <Switch
        value={alarm.enabled}
        onValueChange={onToggle}
        accessibilityLabel={alarm.enabled ? 'Turn alarm off' : 'Turn alarm on'}
        trackColor={{ true: t.colors.primary, false: t.colors.border }}
        thumbColor={t.colors.switchThumb}
      />
    </Pressable>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.lg,
    paddingRight: space.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.colors.border,
  },
  marker: { width: 4, alignSelf: 'stretch', marginRight: space.xl - 4, borderRadius: 2 },
  markerNext: { backgroundColor: t.colors.accent },
  body: { flex: 1 },
  time: { ...t.type.clockRow, color: t.colors.textPrimary },
  meta: { ...t.type.small, color: t.colors.textSecondary, marginTop: 2 },
  muted: { color: t.colors.onHeroSoft },
  mutedMeta: { color: t.colors.textMuted },
});
