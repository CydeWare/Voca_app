import { FONTS } from '../fonts';
import { defineTheme } from '../buildTheme';

/** An elegant observatory at night: gold on indigo, stars, a crescent moon. */
export const starlightTheme = defineTheme({
  id: 'starlight',
  name: 'Starlight',
  tagline: 'Celestial night',
  isPremium: true,
  isDark: true,
  colors: {
    background: '#080A24', surface: '#101333', surfaceSecondary: '#161A40', border: '#262A55', outline: '#4E4530',
    textPrimary: '#F4EEDC', textSecondary: '#CFC8B0', textMuted: '#A09A83',
    hero: '#06071C', heroRaised: '#12153A', heroLine: '#2E3160', onHero: '#F4EEDC', onHeroSoft: '#B8B29C',
    heroPrimary: '#D6B76A', onHeroPrimary: '#14122A',
    primary: '#D6B76A', primaryDeep: '#E4CB8A', primarySoft: '#23223E', onPrimary: '#14122A',
    secondary: '#A98B45', accent: '#E8CD84', accentSoft: '#F1DFB0', onAccent: '#14122A',
    success: '#8FD0A8', warning: '#E0B458', error: '#E88080', errorSoft: '#3A1A2A',
    switchThumb: '#F4EEDC',
  },
  typography: {
    displayFont: FONTS.serif, headingFont: FONTS.serif, accentFont: FONTS.serif,
    displayWeight: '400', headingWeight: '400', promptWeight: '400', captionUppercase: true, displayLetterSpacing: -1,
  },
  radius: { sm: 8, md: 14, lg: 18 },
  shape: { cardBorderWidth: 1 },
  effects: {
    glow: true, gradients: false, decorativeElements: true, decor: 'stars', risingSun: false, ornament: '✦',
  },
  copy: {
    homeTagline: 'The Night Watch',
    readInstruction: 'Speak the words',
    successTitle: 'The stars have let you go.',
  },
});
