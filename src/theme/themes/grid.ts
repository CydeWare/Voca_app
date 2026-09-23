import { FONTS } from '../fonts';
import { defineTheme } from '../buildTheme';

/** Brutalist mono: hairlines, zero radius, one acid signal. */
export const gridTheme = defineTheme({
  id: 'grid',
  name: 'Grid',
  tagline: 'Brutalist mono',
  isPremium: true,
  isDark: true,
  colors: {
    background: '#0A0A0A', surface: '#111111', surfaceSecondary: '#1A1A1A', border: '#2A2A2A', outline: '#3A3A3A',
    textPrimary: '#F2F2F2', textSecondary: '#BDBDBD', textMuted: '#8F8F8F',
    hero: '#000000', heroRaised: '#141414', heroLine: '#333333', onHero: '#F2F2F2', onHeroSoft: '#A0A0A0',
    heroPrimary: '#C6F432', onHeroPrimary: '#000000',
    primary: '#C6F432', primaryDeep: '#D8FF5C', primarySoft: '#1E2608', onPrimary: '#000000',
    secondary: '#8FB31F', accent: '#C6F432', accentSoft: '#E4FF9E', onAccent: '#000000',
    success: '#C6F432', warning: '#FFD23F', error: '#FF5A5A', errorSoft: '#2A0E0E',
    switchThumb: '#F2F2F2',
  },
  typography: {
    displayFont: FONTS.mono, headingFont: FONTS.mono, bodyFont: FONTS.mono,
    displayWeight: '700', headingWeight: '700', promptWeight: '700', captionUppercase: true,
  },
  radius: { sm: 0, md: 0, lg: 0, pill: 0 },
  shape: { cardBorderWidth: 1 },
  effects: { glow: false, gradients: false, decorativeElements: false, decor: 'none', risingSun: false },
  copy: { readInstruction: 'Say this', successTitle: 'Fully awake.' },
});
