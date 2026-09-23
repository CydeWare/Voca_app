import { useStatusBar } from '../../hooks/useStatusBar';
import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectHistory, selectHistoryStats, wakeUpDelayMs } from '../../store/selectors/historySelectors';
import { historyCleared } from '../../store/slices/historySlice';
import { space, useThemed, type AppTheme } from '../../theme';
import type { AlarmHistoryEntry } from '../../types/history';
import { formatDateShort, formatDuration, formatTime } from '../../utils/dateUtils';

function Stat({ label, value }: { label: string; value: string }) {
  const { styles } = useThemed(makeStyles);
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function HistoryRow({ entry }: { entry: AlarmHistoryEntry }) {
  const { t, styles } = useThemed(makeStyles);
  const scheduled = new Date(entry.scheduledAt);
  const delay = formatDuration(wakeUpDelayMs(entry));
  const voice = entry.dismissalMethod === 'speech';
  const attemptsText = `${entry.speechAttempts} ${entry.speechAttempts === 1 ? 'attempt' : 'attempts'}`;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${formatDateShort(entry.scheduledAt)} at ${formatTime(
        scheduled.getHours(),
        scheduled.getMinutes(),
      )}. Dismissed by ${voice ? 'voice' : 'fallback puzzle'} after ${delay}. ${attemptsText}.`}>
      <View style={styles.rowTop}>
        <Text style={styles.rowTime}>{formatTime(scheduled.getHours(), scheduled.getMinutes())}</Text>
        <Text style={styles.rowDate}>{formatDateShort(entry.scheduledAt)}</Text>
        <View style={{ flex: 1 }} />
        {entry.isTest ? <Text style={styles.testTag}>TEST</Text> : null}
        <View style={[styles.method, voice ? styles.methodVoice : styles.methodPuzzle]}>
          <Text style={[styles.methodText, { color: voice ? t.colors.primaryDeep : t.colors.textSecondary }]}>
            {voice ? 'Voice' : 'Puzzle'}
          </Text>
        </View>
      </View>
      {entry.promptText ? (
        <Text style={styles.prompt} numberOfLines={2}>
          “{entry.promptText}”
        </Text>
      ) : null}
      <Text style={styles.meta}>
        Up in {delay} · {attemptsText}
        {entry.bestScore != null ? ` · best match ${Math.round(entry.bestScore * 100)}%` : ''}
      </Text>
    </View>
  );
}

export function AlarmHistoryScreen() {
  const { styles } = useThemed(makeStyles);
  useStatusBar('app');
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectHistory);
  const stats = useAppSelector(selectHistoryStats);

  const confirmClear = () =>
    Alert.alert('Clear history?', 'This removes every wake-up record on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => dispatch(historyCleared()) },
    ]);

  const header = (
    <View style={{ paddingTop: insets.top + space.xl }}>
      <View style={styles.titleRow}>
        <Text style={styles.title} accessibilityRole="header">
          Wake-ups
        </Text>
        {entries.length > 0 && (
          <Pressable onPress={confirmClear} accessibilityRole="button" hitSlop={12}>
            <Text style={styles.clear}>Clear</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.subtitle}>How long it took you to get up after each alarm.</Text>

      {stats ? (
        <View style={styles.statsCard}>
          <Stat label="Avg. wake-up delay" value={formatDuration(stats.avgDelayMs)} />
          <View style={styles.divider} />
          <Stat label="Beaten by voice" value={`${Math.round(stats.voiceRate * 100)}%`} />
          <View style={styles.divider} />
          <Stat label="Mornings" value={String(stats.count)} />
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={entries}
        keyExtractor={e => e.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => <HistoryRow entry={item} />}
        contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: space.xxxl }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No mornings yet</Text>
            <Text style={styles.emptyBody}>
              Each time you turn off an alarm, VOCA records when it rang, how you dismissed it, and how long it
              took. Nothing leaves your phone.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.background },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...t.type.title, color: t.colors.textPrimary },
  clear: { ...t.type.smallStrong, color: t.colors.error },
  subtitle: { ...t.type.small, color: t.colors.textMuted, marginTop: 2, marginBottom: space.lg },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: t.colors.hero,
    borderRadius: t.radius.lg,
    paddingVertical: space.xl,
    paddingHorizontal: space.md,
    marginBottom: space.lg,
    borderWidth: t.shape.cardBorderWidth,
    borderColor: t.colors.outline,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...t.type.heading, color: t.colors.onHero, fontVariant: ['tabular-nums'] },
  statLabel: { ...t.type.caption, color: t.colors.onHeroSoft, marginTop: 4, textAlign: 'center' },
  divider: { width: StyleSheet.hairlineWidth, backgroundColor: t.colors.heroLine },
  row: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.md,
    padding: space.lg,
    marginBottom: space.md,
    borderWidth: t.shape.cardBorderWidth,
    borderColor: t.colors.outline,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rowTime: { ...t.type.heading, color: t.colors.textPrimary, fontVariant: ['tabular-nums'] },
  rowDate: { ...t.type.small, color: t.colors.textMuted },
  testTag: { ...t.type.caption, color: t.colors.textMuted, letterSpacing: 1 },
  method: { borderRadius: t.radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  methodVoice: { backgroundColor: t.colors.primarySoft },
  methodPuzzle: { backgroundColor: t.colors.surfaceSecondary },
  methodText: { ...t.type.caption, fontWeight: '700' },
  prompt: { ...t.type.small, color: t.colors.textSecondary, marginTop: space.sm, fontStyle: 'italic' },
  meta: { ...t.type.caption, color: t.colors.textMuted, marginTop: space.sm },
  empty: { paddingTop: space.xl },
  emptyTitle: { ...t.type.heading, color: t.colors.textPrimary },
  emptyBody: { ...t.type.body, color: t.colors.textSecondary, marginTop: space.sm },
});
