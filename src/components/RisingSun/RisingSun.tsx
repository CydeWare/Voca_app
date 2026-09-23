import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';
import { useThemed, type AppTheme } from '../../theme';

const { width } = Dimensions.get('window');
const SUN = width * 1.3;

/**
 * The ringing screen's one orchestrated motion: a sun that rises as more of the sentence
 * is read, and warms the night sky. `progress` is 0..1.
 */
export function RisingSun({ progress, reduceMotion }: { progress: number; reduceMotion: boolean }) {
  const { t, styles } = useThemed(makeStyles);
  const anim = useRef(new Animated.Value(progress)).current;
  useEffect(() => {
    if (reduceMotion) anim.setValue(progress);
    else Animated.spring(anim, { toValue: progress, useNativeDriver: false, speed: 6, bounciness: 2 }).start();
  }, [progress, reduceMotion, anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [SUN * 0.86, SUN * 0.52] });
  const sky = anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: t.effects.sunriseSky });

  return (
    <>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: sky }]} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          { transform: [{ translateY }], opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.3] }) },
        ]}
      />
      <Animated.View pointerEvents="none" style={[styles.sun, { transform: [{ translateY: Animated.add(translateY, SUN * 0.18) }] }]} />
    </>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
  glow: {
    position: 'absolute',
    bottom: 0,
    left: (width - SUN * 1.4) / 2,
    width: SUN * 1.4,
    height: SUN * 1.4,
    borderRadius: SUN * 0.7,
    backgroundColor: t.colors.accent,
  },
  sun: {
    position: 'absolute',
    bottom: 0,
    left: (width - SUN) / 2,
    width: SUN,
    height: SUN,
    borderRadius: SUN / 2,
    backgroundColor: t.colors.accent,
    opacity: 0.9,
  },
});
