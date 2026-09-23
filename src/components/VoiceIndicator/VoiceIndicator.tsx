import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemed, type AppTheme } from '../../theme';

type Props = {
  listening: boolean;
  /** Input level from the recognizer, roughly -2..10 */
  level: number;
  disabled?: boolean;
  onPress: () => void;
  label: string;
  reduceMotion: boolean;
};

/** Drawn microphone glyph (no icon font dependency). */
function MicGlyph({ color }: { color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 16, height: 26, borderRadius: 8, backgroundColor: color }} />
      <View
        style={{
          width: 26,
          height: 14,
          marginTop: -8,
          borderBottomLeftRadius: 13,
          borderBottomRightRadius: 13,
          borderWidth: 3,
          borderTopWidth: 0,
          borderColor: color,
        }}
      />
      <View style={{ width: 3, height: 6, backgroundColor: color }} />
    </View>
  );
}

export function VoiceIndicator({ listening, level, disabled, onPress, label, reduceMotion }: Props) {
  const { t, styles } = useThemed(makeStyles);
  const levelAnim = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const normalized = Math.max(0, Math.min(1, (level + 2) / 12));
    Animated.timing(levelAnim, {
      toValue: listening ? normalized : 0,
      duration: 90,
      useNativeDriver: true,
    }).start();
  }, [level, listening, levelAnim]);

  useEffect(() => {
    if (listening || reduceMotion || disabled) {
      breathe.stopAnimation();
      breathe.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [listening, reduceMotion, disabled, breathe]);

  const ringScale = Animated.add(
    levelAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }),
    breathe.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] }),
  );

  return (
    <View style={styles.wrap}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          { transform: [{ scale: ringScale }], opacity: listening ? 0.35 : 0.18 },
          listening && { backgroundColor: t.colors.accent },
        ]}
      />
      <Pressable
        onPress={onPress}
        disabled={disabled || listening}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled, busy: listening }}
        style={({ pressed }) => [
          styles.button,
          listening && styles.buttonListening,
          disabled && { opacity: 0.4 },
          pressed && { transform: [{ scale: 0.96 }] },
        ]}>
        <MicGlyph color={listening ? t.colors.onAccent : t.colors.onHeroPrimary} />
      </Pressable>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const SIZE = 96;
const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    top: 0,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: t.effects.glow ? t.colors.heroPrimary : t.colors.onHero,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: t.colors.heroPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonListening: { backgroundColor: t.colors.accent },
  label: { ...t.type.bodyStrong, color: t.colors.onHero, marginTop: 14 },
});
