import { FONTS } from '../fonts';
import { defineTheme } from '../buildTheme';

/** Northern lights: mint and violet ribbons, thin type. */
export const auroraTheme = defineTheme({
  id: 'aurora',
  name: 'Aurora',
  tagline: 'Northern lights',
  isPremium: true,
  isDark: true,
  colors: {
    background: '#0B1020', surface: '#131A30', surfaceSecondary: '#19213B', border: '#26304F', outline: '#2E3A5C',
    textPrimary: '#EAF2FF', textSecondary: '#BDC8E4', textMuted: '#8C9ABC',
    hero: '#070B18', heroRaised: '#141C33', heroLine: '#2A3456', onHero: '#EAF2FF', onHeroSoft: '#A7B4D6',
    heroPrimary: '#A99BFF', onHeroPrimary: '#0B1020',
    primary: '#7EF2C4', primaryDeep: '#A6F7D7', primarySoft: '#173A36', onPrimary: '#07131A',
    secondary: '#A99BFF', accent: '#7EF2C4', accentSoft: '#C9FBE6', onAccent: '#07131A',
    success: '#7EF2C4', warning: '#F4C76B', error: '#FF7F95', errorSoft: '#3A1826',
    switchThumb: '#FFFFFF',
  },
  typography: {
    displayFont: FONTS.sansLight, headingFont: FONTS.sansLight, displayWeight: '400', headingWeight: '400',
    promptWeight: '400', captionUppercase: true,
  },
  radius: { sm: 12, md: 18, lg: 24 },
  shape: { cardBorderWidth: 1 },
  effects: { glow: true, gradients: true, decorativeElements: true, decor: 'aurora', risingSun: false },
  copy: { homeTagline: 'Under the lights', successTitle: 'The sky cleared.' },
});
