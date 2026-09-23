import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemed, type AppTheme } from '../../theme';

/** Live "what we heard" line. Display only: never used to dismiss. */
export function SpeechTranscript({ text, placeholder }: { text: string; placeholder: string }) {
  const { styles } = useThemed(makeStyles);
  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite">
      <Text style={styles.label}>We heard</Text>
      <Text style={[styles.text, !text && styles.placeholder]} numberOfLines={3}>
        {text ? `“${text}”` : placeholder}
      </Text>
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
  wrap: { minHeight: 64 },
  label: { ...t.type.caption, color: t.colors.onHeroSoft, marginBottom: 4 },
  text: { ...t.type.body, color: t.colors.onHero },
  placeholder: { color: t.colors.onHeroSoft, fontStyle: 'italic' },
});
