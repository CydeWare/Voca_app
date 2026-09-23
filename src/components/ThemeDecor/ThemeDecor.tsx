import React, { memo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useTheme, type AppTheme } from '../../theme';

/**
 * Theme background art, drawn behind hero areas. Purely decorative: no touches, hidden from
 * screen readers, positioned with percentages so it adapts to any screen size.
 *
 * variant:
 *  - hero:    full art (ringing screen, onboarding, home header)
 *  - ambient: a light sprinkle for ordinary screens
 *  - preview: full art inside the theme picker cards
 */
type Variant = 'hero' | 'ambient' | 'preview';

type Star = { x: number; y: number; r: number; o: number };

/** Deterministic pseudo-random points so the sky doesn't reshuffle on every render. */
function makeStars(count: number, seed: number): Star[] {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return Array.from({ length: count }, () => ({
    x: rnd() * 100,
    y: rnd() * 100,
    r: rnd() < 0.2 ? 2.5 : rnd() < 0.5 ? 1.8 : 1.2,
    o: 0.35 + rnd() * 0.6,
  }));
}

const STARS_FULL = makeStars(34, 7);
const STARS_SPARSE = makeStars(12, 31);
const FIREFLIES = makeStars(14, 101);

// Constellation points as fractions of the container (top-right quadrant).
const CONSTELLATION = [
  [0.62, 0.1],
  [0.72, 0.16],
  [0.8, 0.12],
  [0.87, 0.22],
  [0.76, 0.27],
] as const;

function Stars({ list, color }: { list: Star[]; color: string }) {
  return (
    <>
      {list.map((st, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.r * 2,
            height: st.r * 2,
            borderRadius: st.r,
            backgroundColor: color,
            opacity: st.o,
          }}
        />
      ))}
    </>
  );
}

function Line({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  return (
    <View
      style={{
        position: 'absolute',
        left: (x1 + x2) / 2 - len / 2,
        top: (y1 + y2) / 2,
        width: len,
        height: StyleSheet.hairlineWidth * 2,
        backgroundColor: color,
        opacity: 0.35,
        transform: [{ rotate: `${angle}rad` }],
      }}
    />
  );
}

function Crescent({ w, t }: { w: number; t: AppTheme }) {
  const d = Math.max(22, w * 0.1);
  return (
    <View style={{ position: 'absolute', right: w * 0.08, top: d * 0.9, width: d, height: d }}>
      {t.effects.glow ? (
        <View
          style={{
            position: 'absolute',
            left: -d * 0.5,
            top: -d * 0.5,
            width: d * 2,
            height: d * 2,
            borderRadius: d,
            backgroundColor: t.colors.primary,
            opacity: 0.08,
          }}
        />
      ) : null}
      <View style={{ width: d, height: d, borderRadius: d / 2, backgroundColor: t.colors.primary }} />
      <View
        style={{
          position: 'absolute',
          left: d * 0.28,
          top: -d * 0.12,
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: t.colors.hero,
        }}
      />
    </View>
  );
}

function Circle({ size, color, opacity, style }: { size: string; color: string; opacity: number; style: object }) {
  return (
    <View
      style={[
        { position: 'absolute', width: size as `${number}%`, aspectRatio: 1, borderRadius: 9999, backgroundColor: color, opacity },
        style,
      ]}
    />
  );
}

export const ThemeDecor = memo(function ThemeDecorArt({ variant = 'hero' }: { variant?: Variant }) {
  const t = useTheme();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const kind = t.effects.decorativeElements ? t.effects.decor : 'none';
  if (kind === 'none') return null;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== box.w || height !== box.h) setBox({ w: width, h: height });
  };
  const full = variant !== 'ambient';
  const c = t.colors;
  let art: React.ReactNode = null;

  switch (kind) {
    case 'stars': {
      const pts = CONSTELLATION.map(([x, y]) => [x * box.w, y * box.h] as const);
      art = (
        <>
          <Stars list={full ? STARS_FULL : STARS_SPARSE} color={c.onHero} />
          {full && box.w > 0 ? (
            <>
              {pts.slice(1).map((p, i) => (
                <Line key={i} x1={pts[i][0]} y1={pts[i][1]} x2={p[0]} y2={p[1]} color={c.primary} />
              ))}
              {pts.map(([x, y], i) => (
                <View
                  key={`c${i}`}
                  style={{ position: 'absolute', left: x - 2, top: y - 2, width: 4, height: 4, borderRadius: 2, backgroundColor: c.primary }}
                />
              ))}
              {variant === 'hero' || variant === 'preview' ? <Crescent w={box.w} t={t} /> : null}
            </>
          ) : null}
        </>
      );
      break;
    }
    case 'fireflies':
      art = (full ? FIREFLIES : FIREFLIES.slice(0, 6)).map((f, i) => (
        <View key={i} style={{ position: 'absolute', left: `${f.x}%`, top: `${f.y}%` }}>
          <View style={{ position: 'absolute', left: -7, top: -7, width: 14, height: 14, borderRadius: 7, backgroundColor: c.accent, opacity: 0.16 }} />
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.accent, opacity: f.o }} />
        </View>
      ));
      break;
    case 'glow':
      if (!full) return null;
      art = (
        <>
          <Circle size="160%" color={c.accent} opacity={0.07} style={{ left: '-30%', top: '62%' }} />
          <Circle size="120%" color={c.secondary} opacity={0.08} style={{ left: '-10%', top: '74%' }} />
          <Circle size="80%" color={c.accent} opacity={0.1} style={{ left: '10%', top: '86%' }} />
        </>
      );
      break;
    case 'aurora':
      art = [
        { top: '6%', color: c.primary, o: 0.13, r: '-9deg' },
        { top: '14%', color: c.secondary, o: 0.14, r: '-5deg' },
        { top: '22%', color: c.primary, o: 0.08, r: '-13deg' },
      ]
        .slice(0, full ? 3 : 1)
        .map((b, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: b.top as `${number}%`,
              left: '-30%',
              width: '160%',
              height: '12%',
              borderRadius: 9999,
              backgroundColor: b.color,
              opacity: b.o,
              transform: [{ rotate: b.r }],
            }}
          />
        ));
      break;
    case 'moon': {
      const d = box.w * 0.26;
      art = (
        <>
          <Stars list={STARS_SPARSE} color={c.onHero} />
          {full && box.w > 0 ? (
            <View style={{ position: 'absolute', right: box.w * 0.08, top: d * 0.35, width: d, height: d }}>
              <View style={{ position: 'absolute', left: -d * 0.35, top: -d * 0.35, width: d * 1.7, height: d * 1.7, borderRadius: d, backgroundColor: c.accent, opacity: 0.06 }} />
              <View style={{ width: d, height: d, borderRadius: d / 2, backgroundColor: c.accent, opacity: 0.92 }} />
            </View>
          ) : null}
        </>
      );
      break;
    }
    case 'ornate': {
      if (!full) return null;
      const g = t.effects.ornament ?? '✦';
      const diamond = { position: 'absolute' as const, width: 7, height: 7, backgroundColor: c.primary, transform: [{ rotate: '45deg' }] };
      art = (
        <>
          <View style={[styles.frame, { top: 10, left: 10, right: 10, bottom: 10, borderColor: c.primary, opacity: 0.45 }]} />
          <View style={[styles.frame, { top: 15, left: 15, right: 15, bottom: 15, borderColor: c.primary, opacity: 0.2 }]} />
          <View style={[diamond, { top: 7, left: 7 }]} />
          <View style={[diamond, { top: 7, right: 7 }]} />
          <View style={[diamond, { bottom: 7, left: 7 }]} />
          <View style={[diamond, { bottom: 7, right: 7 }]} />
          <Text style={[styles.glyph, { top: 1, color: c.primary, backgroundColor: c.hero }]}>{` ${g} `}</Text>
          <Text style={[styles.glyph, { bottom: 1, color: c.primary, backgroundColor: c.hero }]}>{` ${g} `}</Text>
        </>
      );
      break;
    }
  }

  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {art}
    </View>
  );
});

/** "——— ✦ ———" divider for themes that define an ornament glyph. Renders nothing otherwise. */
export function OrnamentDivider({ onHero = true, style }: { onHero?: boolean; style?: object }) {
  const t = useTheme();
  if (!t.effects.ornament) return null;
  const color = t.colors.primary;
  return (
    <View style={[styles.divider, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.rule, { backgroundColor: color, opacity: onHero ? 0.5 : 0.35 }]} />
      <Text style={[styles.dividerGlyph, { color }]}>{t.effects.ornament}</Text>
      <View style={[styles.rule, { backgroundColor: color, opacity: onHero ? 0.5 : 0.35 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { position: 'absolute', borderWidth: 1 },
  glyph: { position: 'absolute', alignSelf: 'center', fontSize: 12 },
  divider: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', width: 120, gap: 8 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
  dividerGlyph: { fontSize: 11 },
});
