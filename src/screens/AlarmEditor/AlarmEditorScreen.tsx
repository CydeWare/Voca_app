import { useStatusBar } from '../../hooks/useStatusBar';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AlarmTimePicker } from '../../components/AlarmTimePicker/AlarmTimePicker';
import { DayPicker } from '../../components/DayPicker/DayPicker';
import { Segmented } from '../../components/Segmented/Segmented';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { SOUND_OPTIONS, VOLUME_OPTIONS } from '../../constants';
import { PROMPT_CATEGORY_LABELS } from '../../data/prompts/prompts';
import type { RootStackParamList } from '../../navigation/types';
import { AlarmService } from '../../services/alarm';
import { PromptGenerator } from '../../services/prompts/PromptGenerator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectAlarmById } from '../../store/selectors/alarmSelectors';
import { addAlarm, deleteAlarm, updateAlarm } from '../../store/slices/alarmSlice';
import { space, useThemed, type AppTheme } from '../../theme';
import type { AlarmDraft } from '../../types/alarm';
import type { PromptCategory, PromptDifficulty } from '../../types/prompt';
import { describeDay, describeRepeat, describeTimeUntil, getNextOccurrence } from '../../utils/dateUtils';
import { requestNotifications } from '../../utils/permissions';

type Props = NativeStackScreenProps<RootStackParamList, 'AlarmEditor'>;

const CATEGORY_OPTIONS: { value: PromptCategory; label: string }[] = (
  ['random', 'motivation', 'fun_fact', 'tongue_twister'] as PromptCategory[]
).map(value => ({ value, label: PROMPT_CATEGORY_LABELS[value] }));

const DIFFICULTY_OPTIONS: { value: PromptDifficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Hard' },
];

function Section({ title, children, hint }: { title: string; hint?: string; children: React.ReactNode }) {
  const { styles } = useThemed(makeStyles);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      <View style={{ marginTop: space.md }}>{children}</View>
    </View>
  );
}

export function AlarmEditorScreen({ navigation, route }: Props) {
  const { t, styles } = useThemed(makeStyles);
  useStatusBar('app');
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const editingId = route.params?.alarmId;
  const existing = useAppSelector(selectAlarmById(editingId));
  const settings = useAppSelector(s => s.settings);

  const [draft, setDraft] = useState<AlarmDraft>(() => {
    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = existing;
      // Alarms saved before the volume control existed won't have this field yet.
      return { ...rest, volume: rest.volume ?? settings.defaultVolume };
    }
    return {
      hour: 7,
      minute: 0,
      label: '',
      enabled: true,
      repeatDays: [],
      soundId: settings.defaultSoundId,
      volume: settings.defaultVolume,
      promptCategory: settings.defaultPromptCategory,
      difficulty: settings.defaultDifficulty,
      vibrationEnabled: settings.defaultVibration,
    };
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof AlarmDraft>(key: K, value: AlarmDraft[K]) => setDraft(d => ({ ...d, [key]: value }));

  const nextRing = getNextOccurrence(draft);
  const ringDay = describeDay(nextRing);
  const ringDayText = ringDay === 'Today' || ringDay === 'Tomorrow' ? ringDay.toLowerCase() : ringDay;
  const example = useMemo(
    () => PromptGenerator.generatePrompt({ category: draft.promptCategory, difficulty: draft.difficulty }),
    [draft.promptCategory, draft.difficulty],
  );

  const quickSet = (minutesFromNow: number) => {
    const when = new Date(Date.now() + minutesFromNow * 60000);
    setDraft(d => ({ ...d, hour: when.getHours(), minute: when.getMinutes(), repeatDays: [] }));
  };

  const save = async () => {
    setSaving(true);
    try {
      // Ask for notifications in context: they are how the alarm appears over the lock screen.
      const notif = await requestNotifications();
      if (notif !== 'granted') {
        Alert.alert(
          'Notifications are off',
          'VOCA uses a notification to show the alarm over your lock screen. The alarm will still ring, but you may need to open VOCA yourself to turn it off.',
        );
      }
      const payload = { ...draft, enabled: true, label: draft.label.trim() };
      if (existing) dispatch(updateAlarm({ id: existing.id, changes: payload }));
      else dispatch(addAlarm(payload));

      const status = await AlarmService.getSystemStatus().catch(() => null);
      if (status?.supported && !status.exactAlarms) {
        Alert.alert(
          'Allow exact alarms',
          'Without "Alarms & reminders" permission Android may ring VOCA late. Turn it on for reliable wake-ups.',
          [
            { text: 'Later', style: 'cancel', onPress: () => navigation.goBack() },
            {
              text: 'Open settings',
              onPress: () => {
                AlarmService.openSystemSettings('exact_alarm');
                navigation.goBack();
              },
            },
          ],
        );
        return;
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const remove = () =>
    Alert.alert('Delete this alarm?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (existing) dispatch(deleteAlarm(existing.id));
          navigation.goBack();
        },
      },
    ]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <SecondaryButton label="Cancel" onPress={() => navigation.goBack()} />
        <Text style={styles.topTitle} accessibilityRole="header">
          {existing ? 'Edit alarm' : 'New alarm'}
        </Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled">
        <AlarmTimePicker hour={draft.hour} minute={draft.minute} onChange={(h, m) => setDraft(d => ({ ...d, hour: h, minute: m }))} />
        <Text style={styles.ringsIn}>
          Rings {ringDayText}, {describeTimeUntil(nextRing)}
        </Text>
        <View style={styles.quickRow}>
          {[2, 10, 30].map(m => (
            <Pressable key={m} onPress={() => quickSet(m)} style={styles.quick} accessibilityRole="button">
              <Text style={styles.quickText}>In {m} min</Text>
            </Pressable>
          ))}
        </View>

        <Section title="Repeat" hint={describeRepeat(draft.repeatDays)}>
          <DayPicker value={draft.repeatDays} onChange={d => set('repeatDays', d)} />
        </Section>

        <Section title="What you'll read">
          <Segmented options={CATEGORY_OPTIONS} value={draft.promptCategory} onChange={v => set('promptCategory', v)} />
          <View style={{ height: space.md }} />
          <Segmented options={DIFFICULTY_OPTIONS} value={draft.difficulty} onChange={v => set('difficulty', v)} />
          <View style={styles.example}>
            <Text style={styles.exampleLabel}>For example</Text>
            <Text style={styles.exampleText}>“{example.text}”</Text>
          </View>
        </Section>

        <Section title="Sound">
          <Segmented
            options={SOUND_OPTIONS.map(s => ({ value: s.id, label: s.label }))}
            value={draft.soundId}
            onChange={v => set('soundId', v)}
          />
        </Section>

        <Section title="Loudness" hint="Your phone's alarm volume while this alarm rings.">
          <Segmented options={VOLUME_OPTIONS.map(v => ({ value: v.value, label: v.label }))} value={draft.volume} onChange={v => set('volume', v)} />
        </Section>

        <View style={[styles.section, styles.inlineRow]}>
          <Text style={styles.sectionTitle}>Vibrate</Text>
          <Switch
            value={draft.vibrationEnabled}
            onValueChange={v => set('vibrationEnabled', v)}
            accessibilityLabel="Vibrate"
            trackColor={{ true: t.colors.primary, false: t.colors.border }}
            thumbColor={t.colors.switchThumb}
          />
        </View>

        <Section title="Label">
          <TextInput
            value={draft.label}
            onChangeText={text => set('label', text)}
            placeholder="Morning class, gym, work…"
            placeholderTextColor={t.colors.textMuted}
            maxLength={40}
            style={styles.input}
            accessibilityLabel="Alarm label"
          />
        </Section>

        {existing ? <SecondaryButton label="Delete alarm" tone="danger" onPress={remove} style={{ marginTop: space.xl }} /> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <PrimaryButton label="Save alarm" onPress={save} loading={saving} />
      </View>
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.sm, height: 56 },
  topTitle: { ...t.type.heading, color: t.colors.textPrimary },
  ringsIn: { ...t.type.small, color: t.colors.textSecondary, textAlign: 'center', marginTop: space.sm },
  quickRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: space.md },
  quick: { paddingHorizontal: 14, height: 36, borderRadius: t.radius.pill, backgroundColor: t.colors.primarySoft, justifyContent: 'center' },
  quickText: { ...t.type.caption, color: t.colors.primaryDeep, fontSize: 13 },
  section: {
    marginHorizontal: space.xl,
    marginTop: space.xl,
    paddingTop: space.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: t.colors.border,
  },
  inlineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...t.type.heading, color: t.colors.textPrimary },
  sectionHint: { ...t.type.small, color: t.colors.textMuted, marginTop: 2 },
  example: {
    marginTop: space.lg,
    padding: space.lg,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.hero,
    borderWidth: t.shape.cardBorderWidth,
    borderColor: t.colors.outline,
  },
  exampleLabel: { ...t.type.caption, color: t.colors.onHeroSoft },
  exampleText: { ...t.type.bodyStrong, fontFamily: t.type.prompt.fontFamily, fontSize: 18, lineHeight: 25, color: t.colors.onHero, marginTop: 4 },
  input: {
    ...t.type.body,
    color: t.colors.textPrimary,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.md,
    borderWidth: 1.5,
    borderColor: t.colors.border,
    paddingHorizontal: space.lg,
    minHeight: 50,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    backgroundColor: t.colors.background,
  },
});
