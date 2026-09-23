import { FONTS } from '../fonts';
import { defineTheme } from '../buildTheme';

/** An editorial timetable: cream, ink, one red rule. */
export const paperTheme = defineTheme({
  id: 'paper',
  name: 'Paper',
  tagline: 'Editorial timetable',
  isPremium: true,
  isDark: false,
  colors: {
    background: '#F3EEE3', surface: '#FBF8F1', surfaceSecondary: '#EDE6D6', border: '#D9D0BC', outline: '#CFC4AC',
    textPrimary: '#1C1A17', textSecondary: '#4A443B', textMuted: '#736B5D',
    hero: '#1C1A17', heroRaised: '#2B2824', heroLine: '#45403A', onHero: '#F3EEE3', onHeroSoft: '#B8B0A0',
    heroPrimary: '#F3EEE3', onHeroPrimary: '#1C1A17',
    primary: '#1C1A17', primaryDeep: '#1C1A17', primarySoft: '#E6DDCB', onPrimary: '#F3EEE3',
    secondary: '#7A6F5E', accent: '#E8664F', accentSoft: '#F0C9B8', onAccent: '#FBF8F1',
    success: '#3F7A4F', warning: '#A86A1A', error: '#B8321F', errorSoft: '#F5DCD3',
    switchThumb: '#FFFFFF',
  },
  typography: {
    displayFont: FONTS.serif, headingFont: FONTS.serif, accentFont: FONTS.serif,
    displayWeight: '400', headingWeight: '700', promptWeight: '400', captionUppercase: true,
  },
  radius: { sm: 4, md: 6, lg: 8 },
  shape: { cardBorderWidth: 1 },
  effects: { glow: false, gradients: false, decorativeElements: false, decor: 'none', risingSun: false },
  copy: { readInstruction: 'Read aloud', successTitle: 'Clear as a bell.' },
});
