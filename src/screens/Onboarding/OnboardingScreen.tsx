import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { AlarmService } from '../../services/alarm';
import { useAppDispatch } from '../../store/hooks';
import { settingsChanged } from '../../store/slices/settingsSlice';
import { space, useThemed, type AppTheme } from '../../theme';
import { ThemeDecor } from '../../components/ThemeDecor/ThemeDecor';
import { requestMicrophone, requestNotifications } from '../../utils/permissions';

type Page = { kicker: string; title: string; body: string; sample?: string };

const PAGES: Page[] = [
  {
    kicker: 'VOCA',
    title: 'Wake up your brain,\nnot just your phone.',
    body: 'Most alarms can be swiped away before you are even awake. VOCA asks for one small thing first.',
  },
  {
    kicker: 'HOW IT WORKS',
    title: 'Read one sentence\nout loud.',
    body: 'When the alarm rings, a short sentence appears. Say it, and the alarm stops. Speaking gets your brain moving faster than tapping a button.',
    sample: '“Red lorry, yellow lorry.”',
  },
  {
    kicker: 'NEVER STUCK',
    title: 'Morning voice?\nThat’s fine.',
    body: 'Matching is forgiving. If VOCA still can’t hear you after three tries, you get a quick tap puzzle instead. Your voice is never recorded or uploaded.',
  },
];

export function OnboardingScreen() {
  const { styles } = useThemed(makeStyles);
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const isPermissions = index === PAGES.length;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (cancelled) return;
      if (reduce) return fade.setValue(1);
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    });
    return () => {
      cancelled = true;
    };
  }, [index, fade]);

  const finish = () => dispatch(settingsChanged({ onboardingComplete: true }));

  const grantAll = async () => {
    setBusy(true);
    try {
      await requestNotifications();
      await requestMicrophone();
      const status = await AlarmService.getSystemStatus().catch(() => null);
      if (status && !status.exactAlarms) await AlarmService.openSystemSettings('exact_alarm');
    } finally {
      setBusy(false);
      finish();
    }
  };

  const page = PAGES[index];

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xl }]}>
      <StatusBar barStyle="light-content" />
      <ThemeDecor variant="hero" />
      <View style={styles.sun} pointerEvents="none" />

      <Animated.View style={[styles.content, { opacity: fade }]}>
        {isPermissions ? (
          <>
            <Text style={styles.kicker}>ONE LAST THING</Text>
            <Text style={styles.title}>Let VOCA{'\n'}actually ring.</Text>
            <View style={styles.list}>
              {[
                ['Notifications', 'so the alarm can take over your lock screen'],
                ['Alarms & reminders', 'so it rings at the exact minute'],
                ['Microphone', 'so it can hear you read (used only while an alarm rings)'],
              ].map(([label, d]) => (
                <View key={label} style={styles.item}>
                  <View style={styles.dot} />
                  <Text style={styles.itemText}>
                    <Text style={styles.itemStrong}>{label}</Text> {d}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.kicker}>{page.kicker}</Text>
            <Text style={styles.title}>{page.title}</Text>
            <Text style={styles.body}>{page.body}</Text>
            {page.sample ? (
              <View style={styles.sample}>
                <Text style={styles.sampleLabel}>Read this aloud</Text>
                <Text style={styles.sampleText}>{page.sample}</Text>
              </View>
            ) : null}
          </>
        )}
      </Animated.View>

      <View style={styles.dots} accessibilityLabel={`Step ${index + 1} of ${PAGES.length + 1}`}>
        {[...PAGES, null].map((_, i) => (
          <View key={i} style={[styles.pageDot, i === index && styles.pageDotOn]} />
        ))}
      </View>

      {isPermissions ? (
        <>
          <PrimaryButton label="Allow and continue" tone="dawn" onPress={grantAll} loading={busy} />
          <SecondaryButton label="I'll do it later" tone="light" onPress={finish} />
        </>
      ) : (
        <>
          <PrimaryButton label={index === 0 ? 'Get started' : 'Next'} tone="dawn" onPress={() => setIndex(i => i + 1)} />
          {index > 0 ? <SecondaryButton label="Back" tone="light" onPress={() => setIndex(i => i - 1)} /> : null}
        </>
      )}
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.hero, paddingHorizontal: space.xl, overflow: 'hidden' },
  sun: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: t.colors.accent,
    opacity: 0.14,
    bottom: -330,
    alignSelf: 'center',
  },
  content: { flex: 1, justifyContent: 'center' },
  kicker: { ...t.type.smallStrong, color: t.colors.accent, letterSpacing: 3 },
  title: { fontSize: 36, lineHeight: 42, fontWeight: '800', letterSpacing: -0.8, color: t.colors.onHero, marginTop: space.md },
  body: { ...t.type.body, color: t.colors.onHeroSoft, marginTop: space.lg, maxWidth: 360 },
  sample: { marginTop: space.xxl, backgroundColor: t.colors.heroRaised, borderRadius: t.radius.lg, padding: space.xl },
  sampleLabel: { ...t.type.caption, color: t.colors.accent, letterSpacing: 1 },
  sampleText: { ...t.type.heading, fontSize: 24, color: t.colors.onHero, marginTop: space.sm },
  list: { marginTop: space.xl, gap: space.lg },
  item: { flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.accent, marginTop: 8, marginRight: space.md },
  itemText: { ...t.type.body, color: t.colors.onHeroSoft, flex: 1 },
  itemStrong: { color: t.colors.onHero, fontWeight: '700' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: space.xl },
  pageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: t.colors.heroLine },
  pageDotOn: { width: 22, backgroundColor: t.colors.accent },
});
