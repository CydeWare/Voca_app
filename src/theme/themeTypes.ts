import type { ImageSourcePropType, TextStyle } from 'react-native';

/**
 * Every theme must provide every token. Components never use raw hex values; they read these.
 *
 * Two "zones" exist in VOCA:
 *  - app zone (background / surface / text*): lists, forms, settings
 *  - hero zone (hero / onHero*): immersive dark areas — the ringing screen, onboarding, home header
 */
export type ThemeColors = {
  // App zone
  background: string;
  surface: string;
  surfaceSecondary: string;
  border: string; // dividers
  outline: string; // card / control outlines (only drawn when shape.cardBorderWidth > 0)
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Hero zone
  hero: string;
  heroRaised: string;
  heroLine: string;
  onHero: string;
  onHeroSoft: string;
  heroPrimary: string; // main control on the hero (mic button)
  onHeroPrimary: string;

  // Brand
  primary: string;
  primaryDeep: string; // primary used as text on primarySoft / background
  primarySoft: string;
  onPrimary: string;
  secondary: string;
  accent: string; // warm highlight: lit words, "next alarm", listening state
  accentSoft: string; // light accent text on the hero
  onAccent: string;

  // Status
  success: string;
  warning: string;
  error: string;
  errorSoft: string;

  switchThumb: string;
};

export type ThemeTypography = {
  /** Font family names (see fonts.ts). Undefined = platform default sans. */
  displayFont?: string; // clocks, big numbers, the sentence to read
  headingFont?: string;
  bodyFont?: string;
  accentFont?: string; // decorative one-liners (theme copy)
  displayWeight?: TextStyle['fontWeight'];
  headingWeight?: TextStyle['fontWeight'];
  promptWeight?: TextStyle['fontWeight'];
  headingItalic?: boolean;
  accentItalic?: boolean;
  /** Small labels in SMALL CAPS style ("THE NEXT SUMMONING"). */
  captionUppercase?: boolean;
  displayLetterSpacing?: number;
};

export type TypeScale = {
  clockHero: TextStyle;
  clockLarge: TextStyle;
  clockRow: TextStyle;
  title: TextStyle;
  heading: TextStyle;
  body: TextStyle;
  bodyStrong: TextStyle;
  small: TextStyle;
  smallStrong: TextStyle;
  caption: TextStyle;
  prompt: TextStyle;
  accent: TextStyle;
};

export type DecorKind = 'none' | 'stars' | 'fireflies' | 'ornate' | 'glow' | 'aurora' | 'moon';

export type ThemeEffects = {
  glow: boolean;
  gradients: boolean;
  decorativeElements: boolean;
  /** Background art drawn behind hero areas (see components/ThemeDecor). */
  decor: DecorKind;
  /** Keep VOCA's rising-sun progress animation on the ringing screen. */
  risingSun: boolean;
  /** Sky colours the rising sun moves through: [start, middle, end]. */
  sunriseSky: [string, string, string];
  /** Small glyph used in decorative dividers, e.g. ✦. */
  ornament?: string;
};

/** Optional theme voice. Anything missing falls back to VOCA's standard wording. */
export type ThemeCopy = {
  homeTagline?: string;
  readInstruction?: string;
  successTitle?: string;
};

export type ThemeAssets = {
  backgroundImage?: ImageSourcePropType;
  logo?: ImageSourcePropType;
  decorativeImages?: ImageSourcePropType[];
};

export type ThemeDefinition = {
  id: string;
  name: string;
  tagline: string;
  /** Future entitlement flag. NOT enforced anywhere yet. */
  isPremium: boolean;
  /** Is the app zone dark? Drives status-bar icons and keyboard appearance. */
  isDark: boolean;
  colors: ThemeColors;
  typography: ThemeTypography;
  radius?: Partial<{ sm: number; md: number; lg: number; pill: number }>;
  shape?: Partial<{ cardBorderWidth: number }>;
  effects: Omit<ThemeEffects, 'sunriseSky'> & { sunriseSky?: [string, string, string] };
  copy?: ThemeCopy;
  assets?: ThemeAssets;
};

export type AppTheme = Readonly<
  Omit<ThemeDefinition, 'radius' | 'shape' | 'effects'> & {
    type: TypeScale;
    radius: { sm: number; md: number; lg: number; pill: number };
    shape: { cardBorderWidth: number };
    effects: ThemeEffects;
    copy: ThemeCopy;
  }
>;
