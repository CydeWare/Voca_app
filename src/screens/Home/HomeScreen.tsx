import { useStatusBar } from '../../hooks/useStatusBar';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AlarmCard } from '../../components/AlarmCard/AlarmCard';
import { OrnamentDivider, ThemeDecor } from '../../components/ThemeDecor/ThemeDecor';
import type { RootStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectHasInexactSchedule,
  selectNextAlarm,
  selectScheduleError,
  selectSortedAlarms,
} from '../../store/selectors/alarmSelectors';
import { deleteAlarm, setAlarmEnabled } from '../../store/slices/alarmSlice';
import { space, useThemed, type AppTheme } from '../../theme';
import { describeDay, describeTimeUntil, formatTime } from '../../utils/dateUtils';
import { AlarmService } from '../../services/alarm';
import type { Alarm } from '../../types/alarm';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function HomeScreen() {
  const { t, styles } = useThemed(makeStyles);
  useStatusBar('hero');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const now = useNow();
  const alarms = useAppSelector(selectSortedAlarms);
  const next = useAppSelector(s => selectNextAlarm(s, now));
  const scheduleError = useAppSelector(selectScheduleError);
  const inexact = useAppSelector(selectHasInexactSchedule);

  const openEditor = (alarmId?: string) => navigation.navigate('AlarmEditor', alarmId ? { alarmId } : undefined);

  const onLongPress = (alarm: Alarm) =>
    Alert.alert(formatTime(alarm.hour, alarm.minute), undefined, [
      { text: 'Edit', onPress: () => openEditor(alarm.id) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch(deleteAlarm(alarm.id)),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const warning = scheduleError
    ? scheduleError
    : inexact
    ? 'Exact alarms are off, so Android may ring late. Allow "Alarms & reminders" in Settings.'
    : !AlarmService.isSupported
    ? 'This build only rings alarms on Android.'
    : null;

  const header = (
    <View>
      <View style={[styles.hero, { paddingTop: insets.top + space.xl }]}>
        <ThemeDecor variant="hero" />
        <Text style={styles.wordmark} accessibilityRole="header">
          VOCA
        </Text>
        {t.copy.homeTagline ? (
          <>
            <Text style={styles.taglineThemed}>{t.copy.homeTagline}</Text>
            <OrnamentDivider style={{ alignSelf: 'flex-start', marginTop: space.md }} />
          </>
        ) : (
          <Text style={styles.tagline}>Wake up your brain, not just your phone.</Text>
        )}

        {next ? (
          <View style={styles.nextBlock} accessible accessibilityLabel={`Next alarm ${formatTime(next.at.getHours(), next.at.getMinutes())}, ${describeDay(next.at, new Date(now))}, ${describeTimeUntil(next.at, new Date(now))}`}>
            <Text style={styles.nextLabel}>Next alarm</Text>
            <Text style={styles.nextTime}>{formatTime(next.at.getHours(), next.at.getMinutes())}</Text>
            <Text style={styles.nextWhen}>
              {describeDay(next.at, new Date(now))}, {describeTimeUntil(next.at, new Date(now))}
            </Text>
          </View>
        ) : (
          <View style={styles.nextBlock}>
            <Text style={styles.nextLabel}>Next alarm</Text>
            <Text style={[styles.nextTime, { color: t.colors.heroLine }]}>--:--</Text>
            <Text style={styles.nextWhen}>Nothing scheduled</Text>
          </View>
        )}
      </View>

      {warning ? (
        <Pressable
          style={styles.warning}
          onPress={() => navigation.navigate('Main', { screen: 'Settings' })}
          accessibilityRole="button"
          accessibilityHint="Opens settings">
          <Text style={styles.warningText}>{warning}</Text>
        </Pressable>
      ) : null}

      {alarms.length > 0 && <Text style={styles.sectionTitle}>Your alarms</Text>}
    </View>
  );

  return (
    <View style={styles.screen}>
      <ThemeDecor variant="ambient" />
      <FlatList
        data={alarms}
        keyExtractor={a => a.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <AlarmCard
            alarm={item}
            isNext={next?.alarmId === item.id}
            onPress={() => openEditor(item.id)}
            onLongPress={() => onLongPress(item)}
            onToggle={enabled => dispatch(setAlarmEnabled({ id: item.id, enabled }))}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Set your first alarm</Text>
            <Text style={styles.emptyBody}>
              When it rings, you'll read one short sentence out loud to turn it off. No big off button to hit
              half asleep.
            </Text>
          </View>
        }
      />
      <Pressable
        onPress={() => openEditor()}
        accessibilityRole="button"
        accessibilityLabel="Add alarm"
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.96 }] }]}>
        <Text style={styles.fabPlus}>+</Text>
        <Text style={styles.fabText}>Add alarm</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.background },
  hero: {
    backgroundColor: t.colors.hero,
    paddingHorizontal: space.xl,
    paddingBottom: space.xxl,
    borderBottomLeftRadius: t.radius.lg,
    borderBottomRightRadius: t.radius.lg,
    overflow: 'hidden',
  },
  wordmark: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 6,
    color: t.colors.onHero,
    fontFamily: t.type.title.fontFamily,
  },
  taglineThemed: { ...t.type.accent, fontSize: 22, lineHeight: 29, color: t.colors.onHero, marginTop: space.xs },
  tagline: { ...t.type.small, color: t.colors.onHeroSoft, marginTop: 2 },
  nextBlock: { marginTop: space.xxl },
  nextLabel: { ...t.type.smallStrong, color: t.colors.accent },
  nextTime: { ...t.type.clockHero, color: t.colors.onHero, marginTop: -4 },
  nextWhen: { ...t.type.body, color: t.colors.onHeroSoft, marginTop: -4 },
  warning: {
    marginHorizontal: space.xl,
    marginTop: space.lg,
    padding: space.lg,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.errorSoft,
  },
  warningText: { ...t.type.small, color: t.colors.error },
  sectionTitle: { ...t.type.heading, color: t.colors.textPrimary, marginTop: space.xl, marginBottom: space.xs, paddingHorizontal: space.xl },
  empty: { paddingHorizontal: space.xl, paddingTop: space.xxl },
  emptyTitle: { ...t.type.title, color: t.colors.textPrimary },
  emptyBody: { ...t.type.body, color: t.colors.textSecondary, marginTop: space.sm, maxWidth: 340 },
  fab: {
    position: 'absolute',
    right: space.xl,
    bottom: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.colors.primary,
    borderRadius: t.radius.pill,
    paddingHorizontal: 22,
    height: 58,
    elevation: 6,
    shadowColor: t.colors.primaryDeep,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  fabPlus: { fontSize: 26, color: t.colors.onPrimary, fontWeight: '600', marginRight: 8, marginTop: -2 },
  fabText: { ...t.type.bodyStrong, color: t.colors.onPrimary },
});
