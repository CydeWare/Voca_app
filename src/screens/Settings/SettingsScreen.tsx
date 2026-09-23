import { useStatusBar } from '../../hooks/useStatusBar';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { PrimaryButton } from '../../components/Buttons';
import { Segmented } from '../../components/Segmented/Segmented';
import { SettingRow } from '../../components/SettingRow/SettingRow';
import { SOUND_OPTIONS, VOLUME_OPTIONS } from '../../constants';
import { PROMPT_CATEGORY_LABELS } from '../../data/prompts/prompts';
import { AlarmService, type SettingsTarget, type SystemStatus } from '../../services/alarm';
import { speechRecognition } from '../../services/speech';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectSettings } from '../../store/selectors/alarmSelectors';
import { settingsChanged } from '../../store/slices/settingsSlice';
import { space, useThemed, type AppTheme } from '../../theme';
import type { PromptCategory, PromptDifficulty } from '../../types/prompt';
import type { SpeechCapabilities, VoiceMode, VoiceStrictness } from '../../types/speech';
import { checkMicrophone, requestMicrophone, requestNotifications } from '../../utils/permissions';

const TEST_ALARM_SECONDS = 60;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { styles } = useThemed(makeStyles);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export function SettingsScreen() {
  const { t, styles } = useThemed(makeStyles);
  useStatusBar('app');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [mic, setMic] = useState<boolean | null>(null);
  const [speech, setSpeech] = useState<SpeechCapabilities | null>(null);
  const [testing, setTesting] = useState(false);

  const refresh = useCallback(async () => {
    setStatus(await AlarmService.getSystemStatus().catch(() => null));
    setMic(await checkMicrophone().catch(() => false));
    setSpeech(await speechRecognition.getCapabilities().catch(() => null));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // Users come back from Android settings screens; re-check what they changed.
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);

  const set = (patch: Parameters<typeof settingsChanged>[0]) => dispatch(settingsChanged(patch));
  const open = (target: SettingsTarget) => AlarmService.openSystemSettings(target).catch(() => false);

  const ok = (v: boolean | undefined) => (v ? { ok: true, text: 'On' } : { ok: false, text: 'Off' });

  const runTest = async () => {
    setTesting(true);
    try {
      if (!mic) await requestMicrophone();
      await requestNotifications();
      const r = await AlarmService.scheduleTestAlarm(
        TEST_ALARM_SECONDS,
        settings.defaultSoundId,
        settings.defaultVibration,
        settings.defaultVolume,
      );
      Alert.alert(
        'Test alarm set',
        `It will ring in about ${TEST_ALARM_SECONDS} seconds${
          r.exact ? '' : ' (exact alarms are off, so it may be late)'
        }. Lock your phone now to test the lock-screen experience.`,
      );
    } catch {
      Alert.alert("We couldn't schedule this alarm.", 'Please check your alarm permissions.');
    } finally {
      setTesting(false);
    }
  };

  const engineText = !speech
    ? 'Checking…'
    : !speech.available
    ? 'No speech recognizer installed. You will get the puzzle instead.'
    : speech.onDeviceAvailable
    ? 'On-device recognizer available. Speech stays on your phone.'
    : 'Using the system recognizer. It prefers offline, but may need internet if no offline language pack is installed.';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + space.xl, paddingBottom: space.xxxl, paddingHorizontal: space.xl }}>
      <Text style={styles.title} accessibilityRole="header">
        Settings
      </Text>

      <Section title="Appearance">
        <SettingRow
          title="Theme"
          subtitle={`${t.name} · ${t.tagline}`}
          onPress={() => navigation.navigate('Themes')}
          trailing="Change ›"
        />
      </Section>

      <Section title="Make sure it rings">
        {!AlarmService.isSupported ? (
          <Text style={styles.note}>Alarms can only ring on Android in this version.</Text>
        ) : (
          <>
            <SettingRow
              title="Alarms & reminders"
              subtitle="Lets VOCA ring at the exact minute."
              status={ok(status?.exactAlarms)}
              onPress={() => open('exact_alarm')}
            />
            <SettingRow
              title="Notifications"
              subtitle="Required to show the alarm on the lock screen."
              status={ok(status?.notifications)}
              onPress={async () => {
                const r = await requestNotifications();
                if (r !== 'granted') open('notifications');
                refresh();
              }}
            />
            <SettingRow
              title="Full-screen alarm"
              subtitle="Shows the challenge over the lock screen."
              status={ok(status?.fullScreenIntent)}
              onPress={() => open('full_screen')}
            />
            <SettingRow
              title="Battery: unrestricted"
              subtitle={
                status?.manufacturer
                  ? `Recommended on ${status.manufacturer} phones, which may stop background apps.`
                  : 'Stops aggressive battery savers from killing alarms.'
              }
              status={ok(status?.batteryUnrestricted)}
              onPress={() => open('battery')}
            />
            <SettingRow
              title="Microphone"
              subtitle="Needed to hear you read the sentence."
              status={ok(mic ?? false)}
              onPress={async () => {
                const r = await requestMicrophone();
                if (r === 'blocked') open('app');
                refresh();
              }}
            />
            <PrimaryButton
              label={`Ring a test alarm in ${TEST_ALARM_SECONDS}s`}
              onPress={runTest}
              loading={testing}
              style={{ marginTop: space.lg }}
              accessibilityHint="Schedules a real alarm through Android so you can try the full flow"
            />
          </>
        )}
      </Section>

      <Section title="New alarm defaults">
        <SettingRow title="Sentence type">
          <Segmented<PromptCategory>
            value={settings.defaultPromptCategory}
            onChange={v => set({ defaultPromptCategory: v })}
            options={(['random', 'motivation', 'fun_fact', 'tongue_twister'] as PromptCategory[]).map(v => ({
              value: v,
              label: PROMPT_CATEGORY_LABELS[v],
            }))}
          />
        </SettingRow>
        <SettingRow title="Difficulty">
          <Segmented<PromptDifficulty>
            value={settings.defaultDifficulty}
            onChange={v => set({ defaultDifficulty: v })}
            options={[
              { value: 'easy', label: 'Easy' },
              { value: 'normal', label: 'Normal' },
              { value: 'hard', label: 'Hard' },
            ]}
          />
        </SettingRow>
        <SettingRow title="Sound">
          <Segmented
            value={settings.defaultSoundId}
            onChange={v => set({ defaultSoundId: v })}
            options={SOUND_OPTIONS.map(s => ({ value: s.id, label: s.label }))}
          />
        </SettingRow>
        <SettingRow title="Loudness" subtitle="Your phone's alarm volume while an alarm rings.">
          <Segmented
            value={settings.defaultVolume}
            onChange={v => set({ defaultVolume: v })}
            options={VOLUME_OPTIONS.map(v => ({ value: v.value, label: v.label }))}
          />
        </SettingRow>
        <SettingRow
          title="Vibration"
          value={settings.defaultVibration}
          onValueChange={v => set({ defaultVibration: v })}
        />
      </Section>

      <Section title="Voice">
        <SettingRow
          title="How closely you must read"
          subtitle="Relaxed helps with a hoarse morning voice or a strong accent.">
          <Segmented<VoiceStrictness>
            value={settings.voiceStrictness}
            onChange={v => set({ voiceStrictness: v })}
            options={[
              { value: 'relaxed', label: 'Relaxed' },
              { value: 'normal', label: 'Normal' },
              { value: 'strict', label: 'Strict' },
            ]}
          />
        </SettingRow>
        <SettingRow title="Voice mode" subtitle="Whisper mode is coming later. No engine here can reliably hear whispers yet.">
          <Segmented<VoiceMode>
            value={settings.voiceMode}
            onChange={v => set({ voiceMode: v })}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'whisper', label: 'Whisper (soon)', disabled: true },
            ]}
          />
        </SettingRow>
        <SettingRow
          title="Prefer on-device recognition"
          subtitle={engineText}
          value={settings.preferOnDeviceSpeech}
          onValueChange={v => set({ preferOnDeviceSpeech: v })}
        />
      </Section>

      <Text style={styles.footer}>VOCA · Wake up your brain, not just your phone.</Text>
    </ScrollView>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.background },
  title: { ...t.type.title, color: t.colors.textPrimary },
  section: { marginTop: space.xl },
  sectionTitle: {
    ...t.type.caption,
    color: t.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: space.sm,
  },
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    borderWidth: t.shape.cardBorderWidth,
    borderColor: t.colors.outline,
  },
  note: { ...t.type.body, color: t.colors.textSecondary, paddingTop: space.lg },
  footer: { ...t.type.caption, color: t.colors.textMuted, textAlign: 'center', marginTop: space.xxl },
});
