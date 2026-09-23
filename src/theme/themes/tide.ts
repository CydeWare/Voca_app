import { FONTS } from '../fonts';
import { defineTheme } from '../buildTheme';

/** Deep water and frosted glass: aqua light. */
export const tideTheme = defineTheme({
  id: 'tide',
  name: 'Tide',
  tagline: 'Deep water, aqua light',
  isPremium: true,
  isDark: true,
  colors: {
    background: '#0B1B22', surface: '#12272F', surfaceSecondary: '#173039', border: '#21404A', outline: '#2A4E58',
    textPrimary: '#E6F7F6', textSecondary: '#B7D4D4', textMuted: '#86A9AC',
    hero: '#081419', heroRaised: '#13272F', heroLine: '#24434C', onHero: '#E6F7F6', onHeroSoft: '#9CC2C3',
    heroPrimary: '#5EE6C8', onHeroPrimary: '#062024',
    primary: '#5EE6C8', primaryDeep: '#8CF0DA', primarySoft: '#143A3A', onPrimary: '#062024',
    secondary: '#3BAFC4', accent: '#7FF5DC', accentSoft: '#C8FBF0', onAccent: '#062024',
    success: '#5EE6A0', warning: '#F2C46B', error: '#FF7B7B', errorSoft: '#3A1A1E',
    switchThumb: '#FFFFFF',
  },
  typography: { displayFont: FONTS.sansLight, headingFont: FONTS.sansMedium, displayWeight: '400', headingWeight: '600' },
  radius: { sm: 12, md: 18, lg: 24 },
  shape: { cardBorderWidth: 1 },
  effects: { glow: true, gradients: true, decorativeElements: true, decor: 'glow', risingSun: false },
  copy: { successTitle: 'Surfaced.' },
});
