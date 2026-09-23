import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemed, type AppTheme } from '../../theme';
import { tokenize } from '../../utils/textNormalization';

/**
 * Maps per-token match flags back onto the words as written, so punctuation and
 * contractions display naturally while highlighting follows what was actually recognized.
 */
export function mapFlagsToDisplayWords(text: string, tokenFlags: boolean[]): { word: string; lit: boolean }[] {
  const words = text.split(/\s+/).filter(Boolean);
  let cursor = 0;
  return words.map(word => {
    const n = tokenize(word).length;
    const flags = tokenFlags.slice(cursor, cursor + n);
    cursor += n;
    return { word, lit: n > 0 && flags.length === n && flags.every(Boolean) };
  });
}

export function PromptDisplay({ text, tokenFlags, dark = true }: { text: string; tokenFlags: boolean[]; dark?: boolean }) {
  const { t, styles } = useThemed(makeStyles);
  const words = useMemo(() => mapFlagsToDisplayWords(text, tokenFlags), [text, tokenFlags]);
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={`Read aloud: ${text}`}>
      <Text style={[styles.prompt, { color: dark ? t.colors.onHeroSoft : t.colors.textSecondary }]} maxFontSizeMultiplier={1.4}>
        {words.map((w, i) => (
          <Text key={i} style={w.lit ? styles.lit : dark ? styles.darkIdle : undefined}>
            {w.word}
            {i < words.length - 1 ? ' ' : ''}
          </Text>
        ))}
      </Text>
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
  prompt: { ...t.type.prompt },
  darkIdle: { color: t.colors.onHero },
  lit: { color: t.colors.accent },
});
