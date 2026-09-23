import { FONTS } from '../fonts';
import { defineTheme } from '../buildTheme';

/** A 70s departures board: split-flap tiles, cream, orange, brown. */
export const flipTheme = defineTheme({
  id: 'flip',
  name: 'Flip',
  tagline: '70s departures board',
  isPremium: true,
  isDark: false,
  colors: {
    background: '#EFE6D3', surface: '#F7F0E0', surfaceSecondary: '#E6DAC0', border: '#CBB994', outline: '#3A2A1C',
    textPrimary: '#2A1E15', textSecondary: '#5A4636', textMuted: '#7D6A54',
    hero: '#2A1E15', heroRaised: '#3A2A1C', heroLine: '#5A4330', onHero: '#F3E9D2', onHeroSoft: '#C8B597',
    heroPrimary: '#B94A22', onHeroPrimary: '#FFF6E8',
    primary: '#B4441D', primaryDeep: '#A63E19', primarySoft: '#F5D8C8', onPrimary: '#FFF6E8',
    secondary: '#3A2A1C', accent: '#F0A33A', accentSoft: '#F8D9A8', onAccent: '#2A1E15',
    success: '#4F8A3C', warning: '#A8680C', error: '#A8321A', errorSoft: '#F5D5CA',
    switchThumb: '#FFFFFF',
  },
  typography: {
    displayFont: FONTS.mono, headingFont: FONTS.condensed, displayWeight: '700', headingWeight: '700',
    promptWeight: '700', captionUppercase: true,
  },
  radius: { sm: 2, md: 4, lg: 6, pill: 4 },
  shape: { cardBorderWidth: 1 },
  effects: { glow: false, gradients: false, decorativeElements: false, decor: 'none', risingSun: false },
  copy: { readInstruction: 'Now boarding · say it aloud', successTitle: 'Arrived.' },
});
