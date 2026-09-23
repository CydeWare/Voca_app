import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, BackHandler, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PermissionCard } from '../../components/PermissionCard/PermissionCard';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { PromptDisplay } from '../../components/PromptDisplay/PromptDisplay';
import { PuzzleView } from '../../components/Puzzle/PuzzleView';
import { RisingSun } from '../../components/RisingSun/RisingSun';
import { OrnamentDivider, ThemeDecor } from '../../components/ThemeDecor/ThemeDecor';
import { SpeechTranscript } from '../../components/SpeechTranscript/SpeechTranscript';
import { VoiceIndicator } from '../../components/VoiceIndicator/VoiceIndicator';
import { MAX_SPEECH_ATTEMPTS } from '../../constants';
import { useVoiceChallenge } from '../../hooks/useVoiceChallenge';
import type { RootStackParamList } from '../../navigation/types';
import { AlarmService } from '../../services/alarm';
import { finishDismissedAlarm } from '../../services/alarm/alarmFlow';
import { useAppDispatch } from '../../store/hooks';
import { space, useThemed, type AppTheme } from '../../theme';
import { formatDuration, formatTime } from '../../utils/dateUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'RingingAlarm'>;

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

function AttemptDots({ used }: { used: number }) {
  const { styles } = useThemed(makeStyles);
  return (
    <View style={styles.dots} accessible accessibilityLabel={`Attempt ${Math.min(used + 1, MAX_SPEECH_ATTEMPTS)} of ${MAX_SPEECH_ATTEMPTS}`}>
      {Array.from({ length: MAX_SPEECH_ATTEMPTS }, (_, i) => (
        <View key={i} style={[styles.dot, i < used && styles.dotUsed]} />
      ))}
    </View>
  );
}

export function RingingAlarmScreen({ navigation }: Props) {
  const { t, styles } = useThemed(makeStyles);
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const now = useClock();
  const reduceMotion = useReduceMotion();
  const {
    active,
    micStatus,
    level,
    tokenFlags,
    startListening,
    requestMic,
    switchToPuzzle,
    answerPuzzle,
  } = useVoiceChallenge();
  const { status, prompt } = active;

  const finished = status === 'SUCCESS' || status === 'DISMISSED';

  // Android back button and navigation gestures must never end the challenge.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => status !== 'IDLE');
    return () => sub.remove();
  }, [status]);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', e => {
        if (status !== 'IDLE') e.preventDefault();
      }),
    [navigation, status],
  );

  const progress = finished
    ? 1
    : tokenFlags.length
    ? tokenFlags.filter(Boolean).length / tokenFlags.length
    : 0;

  const listening = status === 'LISTENING';
  const verifying = status === 'VERIFYING';
  const canSpeak = (status === 'RINGING' || status === 'RETRYING') && micStatus === 'granted';

  const micLabel = listening ? 'Listening…' : verifying ? 'Checking…' : status === 'RETRYING' ? 'Tap and try again' : 'Tap, then read aloud';

  const delayMs = active.scheduledAt ? Date.now() - active.scheduledAt : 0;

  const renderVoice = () => {
    if (!prompt) return null;
    return (
      <>
        <OrnamentDivider style={{ alignSelf: 'flex-start', marginBottom: space.md }} />
        <Text style={styles.instruction}>{t.copy.readInstruction ?? 'Read this aloud'}</Text>
        <PromptDisplay text={prompt.text} tokenFlags={tokenFlags} />

        {active.feedback && status === 'RETRYING' ? (
          <View style={styles.feedback} accessibilityLiveRegion="assertive">
            <Text style={styles.feedbackText}>{active.feedback}</Text>
          </View>
        ) : null}

        <View style={{ marginTop: space.xl }}>
          <SpeechTranscript
            text={active.partialText}
            placeholder={listening ? 'Start reading…' : 'Your words will appear here.'}
          />
        </View>
      </>
    );
  };

  const renderBottom = () => {
    if (status === 'FALLBACK' || finished || status === 'TRIGGERING') return null;
    if (micStatus === 'needs_permission' || micStatus === 'blocked') {
      return (
        <PermissionCard
          dark
          title="Microphone access"
          body="VOCA needs your microphone so it can hear you read the wake-up sentence. Nothing is recorded or uploaded."
          actionLabel={micStatus === 'blocked' ? 'Open settings' : 'Allow microphone'}
          onAction={() => (micStatus === 'blocked' ? AlarmService.openSystemSettings('app') : requestMic())}
          secondaryLabel="Use a puzzle instead"
          onSecondary={switchToPuzzle}
        />
      );
    }
    return (
      <View style={styles.bottom}>
        <AttemptDots used={active.attempts} />
        <VoiceIndicator
          listening={listening}
          level={level}
          disabled={!canSpeak && !listening}
          onPress={startListening}
          label={micLabel}
          reduceMotion={reduceMotion}
        />
        <Text style={styles.engineNote}>
          {active.engine === 'on_device'
            ? 'Recognized on this phone. Nothing is recorded.'
            : active.engine === 'system_prefer_offline'
            ? 'Using the system recognizer (offline if an English pack is installed).'
            : active.engine === 'system_online'
            ? 'Using the system recognizer online (no offline English pack found).'
            : 'The alarm pauses while you speak.'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      {t.effects.risingSun ? (
        <RisingSun progress={progress} reduceMotion={reduceMotion} />
      ) : (
        <ThemeDecor variant="hero" />
      )}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl }]}
        bounces={false}>
        <View>
          <Text style={styles.clock} accessibilityRole="header">
            {formatTime(now.getHours(), now.getMinutes())}
          </Text>
          <Text style={styles.greeting}>
            {finished ? t.copy.successTitle ?? "You're up." : active.isTest ? 'Test alarm' : 'Good morning'}
          </Text>
          {active.audioError && !finished ? (
            <Text style={styles.audioError}>The alarm sound couldn't play on this phone. Vibration only.</Text>
          ) : null}
        </View>

        <View style={styles.middle}>
          {status === 'TRIGGERING' ? <Text style={styles.instruction}>Waking up…</Text> : null}

          {status === 'FALLBACK' && active.puzzle ? (
            <>
              <Text style={styles.instruction}>{active.fallbackReason ?? 'Solve this to turn off the alarm'}</Text>
              <PuzzleView puzzle={active.puzzle} mistakes={active.puzzleMistakes} onAnswer={answerPuzzle} />
            </>
          ) : null}

          {finished ? (
            <View>
              {prompt && active.dismissalMethod === 'speech' ? (
                <PromptDisplay text={prompt.text} tokenFlags={tokenFlags} />
              ) : null}
              <View style={styles.summary}>
                <Text style={styles.summaryLine}>
                  Turned off {active.dismissalMethod === 'speech' ? 'by voice' : 'with the puzzle'} in{' '}
                  {formatDuration(delayMs)}.
                </Text>
                {active.dismissalMethod === 'speech' && active.lastScore !== null ? (
                  <Text style={styles.summaryMeta}>
                    Match {Math.round(active.lastScore * 100)}%, attempt {active.attempts}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {!finished && status !== 'FALLBACK' && status !== 'TRIGGERING' ? renderVoice() : null}
        </View>

        {finished ? (
          <PrimaryButton
            label="Start my day"
            tone="light"
            disabled={status !== 'DISMISSED'}
            onPress={() => dispatch(finishDismissedAlarm())}
          />
        ) : (
          renderBottom()
        )}

        {status === 'RETRYING' && active.attempts > 0 ? (
          <SecondaryButton label="My voice isn't working, use a puzzle" tone="light" onPress={switchToPuzzle} />
        ) : null}
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.hero },
  content: { flexGrow: 1, paddingHorizontal: space.xl, justifyContent: 'space-between' },
  clock: { ...t.type.clockHero, color: t.colors.onHero },
  greeting: { ...t.type.heading, color: t.colors.accent, marginTop: -6 },
  audioError: { ...t.type.small, color: t.colors.accentSoft, marginTop: space.sm },
  middle: { flex: 1, justifyContent: 'center', paddingVertical: space.xl },
  instruction: { ...t.type.smallStrong, color: t.colors.onHeroSoft, marginBottom: space.md },
  feedback: { marginTop: space.lg, padding: space.md, borderRadius: t.radius.md, backgroundColor: t.colors.heroRaised, borderLeftWidth: 3, borderLeftColor: t.colors.accent },
  feedbackText: { ...t.type.body, color: t.colors.accentSoft },
  bottom: { alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 8, marginBottom: space.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.onHero, opacity: 0.85 },
  dotUsed: { opacity: 0.2 },
  engineNote: { ...t.type.caption, color: t.colors.onHeroSoft, marginTop: space.md, textAlign: 'center' },
  summary: { marginTop: space.xl },
  summaryLine: { ...t.type.heading, color: t.colors.onHero },
  summaryMeta: { ...t.type.small, color: t.colors.accentSoft, marginTop: 4 },
});
