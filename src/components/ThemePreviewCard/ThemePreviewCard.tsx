import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { space, ThemeScope, useThemed, type AppTheme } from '../../theme';
import { ThemeDecor } from '../ThemeDecor/ThemeDecor';

/** The miniature UI inside a card, rendered with the PREVIEWED theme (via ThemeScope). */
function MiniApp() {
  const { t, styles } = useThemed(makeMiniStyles);
  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <ThemeDecor variant="preview" />
        <Text style={styles.kicker}>Next alarm</Text>
        <Text style={styles.clock}>06:40</Text>
        <Text style={styles.line} numberOfLines={1}>
          {t.copy.homeTagline ?? 'Wake up your brain.'}
        </Text>
        <Text style={styles.prompt} numberOfLines={2}>
          <Text style={{ color: t.colors.accent }}>The restless </Text>lighthouse argues
        </Text>
      </View>
      <View style={styles.list}>
        <View style={styles.row}>
          <Text style={styles.rowTime}>07:15</Text>
          <Text style={styles.rowMeta}>Sat, Sun</Text>
          <View style={{ flex: 1 }} />
          <View style={styles.track}>
            <View style={styles.thumb} />
          </View>
        </View>
        <View style={styles.button}>
          <Text style={styles.buttonText}>Done</Text>
        </View>
      </View>
    </View>
  );
}

const makeMiniStyles = (t: AppTheme) =>
  StyleSheet.create({
    root: { borderRadius: t.radius.md, overflow: 'hidden', backgroundColor: t.colors.background },
    hero: { backgroundColor: t.colors.hero, paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.lg, minHeight: 150, overflow: 'hidden' },
    kicker: { ...t.type.caption, fontSize: 10.5, color: t.colors.accent },
    clock: { ...t.type.clockLarge, fontSize: 40, lineHeight: 46, color: t.colors.onHero },
    line: { ...t.type.accent, fontSize: 14, lineHeight: 19, color: t.colors.onHeroSoft },
    prompt: { ...t.type.prompt, fontSize: 18, lineHeight: 23, letterSpacing: 0, color: t.colors.onHero, marginTop: space.sm },
    list: { padding: space.md, gap: space.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.sm,
      paddingHorizontal: space.md,
      paddingVertical: 10,
      borderWidth: t.shape.cardBorderWidth,
      borderColor: t.colors.outline,
    },
    rowTime: { ...t.type.clockRow, fontSize: 20, letterSpacing: 0, color: t.colors.textPrimary },
    rowMeta: { ...t.type.caption, fontSize: 10.5, color: t.colors.textMuted },
    track: { width: 34, height: 20, borderRadius: Math.min(10, t.radius.pill), backgroundColor: t.colors.primary, padding: 3, alignItems: 'flex-end' },
    thumb: { width: 14, height: 14, borderRadius: Math.min(7, t.radius.pill), backgroundColor: t.colors.switchThumb },
    button: { height: 34, borderRadius: t.radius.pill, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center' },
    buttonText: { ...t.type.smallStrong, color: t.colors.onPrimary },
  });

type Props = { theme: AppTheme; selected: boolean; onSelect: (id: string) => void };

/** A selectable card showing a live miniature of `theme`. The frame uses the CURRENT app theme. */
export const ThemePreviewCard = memo(function ThemePreviewCardInner({ theme, selected, onSelect }: Props) {
  const { t, styles } = useThemed(makeCardStyles);
  return (
    <Pressable
      onPress={() => onSelect(theme.id)}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${theme.name}, ${theme.tagline}${selected ? ', selected' : ''}`}
      style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && { opacity: 0.85 }]}>
      <ThemeScope theme={theme}>
        <MiniApp />
      </ThemeScope>
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { fontFamily: theme.type.title.fontFamily }]}>{theme.name}</Text>
          <Text style={styles.tagline}>{theme.tagline}</Text>
        </View>
        {selected ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✓ Selected</Text>
          </View>
        ) : (
          <Text style={styles.use}>Use</Text>
        )}
      </View>
      {/* palette strip: quick read of the theme's key colours */}
      <View style={styles.swatches} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {[theme.colors.hero, theme.colors.background, theme.colors.primary, theme.colors.accent].map((c, i) => (
          <View key={i} style={[styles.swatch, { backgroundColor: c, borderColor: t.colors.border }]} />
        ))}
      </View>
    </Pressable>
  );
});

const makeCardStyles = (t: AppTheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.lg,
      padding: space.md,
      marginBottom: space.lg,
      borderWidth: 2,
      borderColor: t.colors.border,
    },
    cardSelected: { borderColor: t.colors.primary, borderWidth: 3 },
    footer: { flexDirection: 'row', alignItems: 'center', marginTop: space.md, paddingHorizontal: space.xs },
    name: { ...t.type.heading, color: t.colors.textPrimary },
    tagline: { ...t.type.small, color: t.colors.textMuted },
    badge: { backgroundColor: t.colors.primary, borderRadius: t.radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
    badgeText: { ...t.type.smallStrong, color: t.colors.onPrimary },
    use: { ...t.type.smallStrong, color: t.colors.primaryDeep, paddingHorizontal: 12 },
    swatches: { flexDirection: 'row', gap: 6, marginTop: space.sm, paddingHorizontal: space.xs },
    swatch: { width: 16, height: 16, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  });
