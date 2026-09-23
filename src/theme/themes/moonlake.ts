import { FONTS } from '../fonts';
import { defineTheme } from '../buildTheme';

/** Still water under a full moon. */
export const moonlakeTheme = defineTheme({
  id: 'moonlake',
  name: 'Moonlake',
  tagline: 'Still water, full moon',
  isPremium: true,
  isDark: true,
  colors: {
    background: '#0C0E1A', surface: '#141727', surfaceSecondary: '#1A1E31', border: '#262A40', outline: '#2E3350',
    textPrimary: '#EDEBF5', textSecondary: '#C3C1D6', textMuted: '#9190AA',
    hero: '#080A14', heroRaised: '#161A2B', heroLine: '#2B3048', onHero: '#EDEBF5', onHeroSoft: '#A9A8BF',
    heroPrimary: '#E4E1F2', onHeroPrimary: '#0C0E1A',
    primary: '#E4E1F2', primaryDeep: '#F2F0FA', primarySoft: '#252839', onPrimary: '#0C0E1A',
    secondary: '#9A97B8', accent: '#F3EFFF', accentSoft: '#D8D4EE', onAccent: '#0C0E1A',
    success: '#9AD4B0', warning: '#E8C27A', error: '#E88A9A', errorSoft: '#361A24',
    switchThumb: '#FFFFFF',
  },
  typography: {
    displayFont: FONTS.serif, headingFont: FONTS.serif, accentFont: FONTS.serif,
    displayWeight: '400', headingWeight: '400', promptWeight: '400', headingItalic: false, captionUppercase: true,
  },
  radius: { sm: 12, md: 18, lg: 22 },
  shape: { cardBorderWidth: 1 },
  effects: { glow: true, gradients: false, decorativeElements: true, decor: 'moon', risingSun: false },
  copy: { homeTagline: 'Still water, steady morning.', successTitle: 'The surface is calm.' },
});
