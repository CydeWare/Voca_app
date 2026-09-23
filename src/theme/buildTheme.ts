import type { TextStyle } from 'react-native';
import type { AppTheme, ThemeDefinition, ThemeTypography, TypeScale } from './themeTypes';

/** VOCA's original scale; themes change families/weights, not sizes, so layouts stay stable. */
const BASE: TypeScale = {
  clockHero: { fontSize: 76, fontWeight: '800', letterSpacing: -3, fontVariant: ['tabular-nums'] },
  clockLarge: { fontSize: 44, fontWeight: '800', letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  clockRow: { fontSize: 34, fontWeight: '700', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  heading: { fontSize: 19, fontWeight: '700' },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 23 },
  bodyStrong: { fontSize: 16, fontWeight: '600', lineHeight: 23 },
  small: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  smallStrong: { fontSize: 14, fontWeight: '600' },
  caption: { fontSize: 12.5, fontWeight: '500' },
  prompt: { fontSize: 34, fontWeight: '800', lineHeight: 44, letterSpacing: -0.5 },
  accent: { fontSize: 16, fontWeight: '400', lineHeight: 23, fontStyle: 'italic' },
};

const fam = (f?: string): TextStyle => (f ? { fontFamily: f } : {});

export function buildTypeScale(tp: ThemeTypography): TypeScale {
  const display: TextStyle = {
    ...fam(tp.displayFont),
    ...(tp.displayWeight ? { fontWeight: tp.displayWeight } : {}),
    ...(tp.displayLetterSpacing !== undefined ? { letterSpacing: tp.displayLetterSpacing } : {}),
  };
  const heading: TextStyle = {
    ...fam(tp.headingFont),
    ...(tp.headingWeight ? { fontWeight: tp.headingWeight } : {}),
    ...(tp.headingItalic ? { fontStyle: 'italic' } : {}),
  };
  const body = fam(tp.bodyFont);
  return {
    clockHero: { ...BASE.clockHero, ...display },
    clockLarge: { ...BASE.clockLarge, ...display },
    clockRow: { ...BASE.clockRow, ...display, ...(tp.displayWeight ? { fontWeight: tp.displayWeight } : {}) },
    title: { ...BASE.title, ...heading },
    heading: { ...BASE.heading, ...heading },
    body: { ...BASE.body, ...body },
    bodyStrong: { ...BASE.bodyStrong, ...body },
    small: { ...BASE.small, ...body },
    smallStrong: { ...BASE.smallStrong, ...body },
    caption: {
      ...BASE.caption,
      ...body,
      ...(tp.captionUppercase ? { textTransform: 'uppercase', letterSpacing: 1.6, fontSize: 11.5 } : {}),
    },
    prompt: {
      ...BASE.prompt,
      ...fam(tp.displayFont),
      ...(tp.promptWeight ? { fontWeight: tp.promptWeight } : {}),
    },
    accent: {
      ...BASE.accent,
      ...fam(tp.accentFont ?? tp.headingFont),
      fontStyle: tp.accentItalic === false ? 'normal' : 'italic',
    },
  };
}

function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    Object.values(o as object).forEach(deepFreeze);
  }
  return o;
}

/** Turns a theme definition into the immutable object components consume. Called once per theme. */
export function defineTheme(def: ThemeDefinition): AppTheme {
  return deepFreeze({
    ...def,
    type: buildTypeScale(def.typography),
    radius: { sm: 10, md: 16, lg: 24, pill: 999, ...def.radius },
    shape: { cardBorderWidth: 0, ...def.shape },
    effects: {
      ...def.effects,
      sunriseSky: def.effects.sunriseSky ?? [def.colors.hero, def.colors.heroRaised, def.colors.heroLine],
    },
    copy: def.copy ?? {},
  });
}
