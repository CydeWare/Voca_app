import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Puzzle } from '../../types/puzzle';
import { space, useThemed, type AppTheme } from '../../theme';

export function PuzzleView({
  puzzle,
  onAnswer,
  mistakes,
}: {
  puzzle: Puzzle;
  onAnswer: (optionId: string) => void;
  mistakes: number;
}) {
  const { styles } = useThemed(makeStyles);
  const [pressedId, setPressedId] = useState<string | null>(null);
  return (
    <View>
      <Text style={styles.question} accessibilityRole="header">
        {puzzle.question}
      </Text>
      {mistakes > 0 && <Text style={styles.hint}>Not that one. Here's a fresh one.</Text>}
      <View style={styles.grid}>
        {puzzle.options.map(o => (
          <Pressable
            key={`${puzzle.id}_${o.id}`}
            accessibilityRole="button"
            accessibilityLabel={o.label}
            onPressIn={() => setPressedId(o.id)}
            onPressOut={() => setPressedId(null)}
            onPress={() => onAnswer(o.id)}
            style={[styles.option, pressedId === o.id && styles.optionPressed]}>
            <Text style={styles.optionText}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
  question: { ...t.type.title, fontSize: 30, color: t.colors.onHero, marginBottom: space.md },
  hint: { ...t.type.small, color: t.colors.accentSoft, marginBottom: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: space.md },
  option: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 72,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.heroRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionPressed: { backgroundColor: t.colors.heroLine },
  optionText: { ...t.type.heading, fontSize: 24, color: t.colors.onHero },
});
