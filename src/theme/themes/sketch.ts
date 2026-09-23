import { FONTS } from '../fonts';
import { defineTheme } from '../buildTheme';

/** A notebook by day, a chalkboard at 6am. */
export const sketchTheme = defineTheme({
  id: 'sketch',
  name: 'Sketch',
  tagline: 'Notebook and chalkboard',
  isPremium: true,
  isDark: false,
  colors: {
    background: '#FBF7EC', surface: '#FFFDF6', surfaceSecondary: '#F2ECDB', border: '#D8CFB8', outline: '#2B2B2B',
    textPrimary: '#232323', textSecondary: '#4A4A4A', textMuted: '#6F6A5C',
    hero: '#253229', heroRaised: '#2F3E34', heroLine: '#4A5A4E', onHero: '#F4F1E6', onHeroSoft: '#BFC6B8',
    heroPrimary: '#F2C94C', onHeroPrimary: '#253229',
    primary: '#3D4E9E', primaryDeep: '#2F3E86', primarySoft: '#E2E6F6', onPrimary: '#FFFFFF',
    secondary: '#E07A3F', accent: '#F2C94C', accentSoft: '#FBE7A6', onAccent: '#253229',
    success: '#3B8C54', warning: '#A8720F', error: '#A8341F', errorSoft: '#F7DCD4',
    switchThumb: '#FFFFFF',
  },
  typography: {
    displayFont: FONTS.handwritten, headingFont: FONTS.handwritten, bodyFont: FONTS.handwritten, accentFont: FONTS.handwritten,
    displayWeight: '700', headingWeight: '700', promptWeight: '700',
  },
  radius: { sm: 8, md: 12, lg: 14 },
  shape: { cardBorderWidth: 1.5 },
  effects: { glow: false, gradients: false, decorativeElements: false, decor: 'none', risingSun: false },
  copy: { readInstruction: 'Say this out loud', successTitle: 'You made it up. Nice one.' },
});
