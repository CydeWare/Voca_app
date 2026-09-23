import { FONTS } from '../fonts';
import { defineTheme } from '../buildTheme';

/** Soft, round and friendly: lavender white with a violet core. */
export const cloudTheme = defineTheme({
  id: 'cloud',
  name: 'Cloud',
  tagline: 'Soft and friendly',
  isPremium: true,
  isDark: false,
  colors: {
    background: '#F1EFFB', surface: '#FFFFFF', surfaceSecondary: '#ECE9FA', border: '#E0DCF3', outline: '#E0DCF3',
    textPrimary: '#1F1B3D', textSecondary: '#4E4873', textMuted: '#7C77A0',
    hero: '#1F1B3D', heroRaised: '#2C2752', heroLine: '#3E3868', onHero: '#FFFFFF', onHeroSoft: '#C1BCE6',
    heroPrimary: '#B7AEFF', onHeroPrimary: '#1F1B3D',
    primary: '#6C5CE7', primaryDeep: '#5343C9', primarySoft: '#E7E3FD', onPrimary: '#FFFFFF',
    secondary: '#7ED8A9', accent: '#8EF0C1', accentSoft: '#D6FBE9', onAccent: '#1F1B3D',
    success: '#2E9E6A', warning: '#B8801A', error: '#B8304C', errorSoft: '#FDE4EA',
    switchThumb: '#FFFFFF',
  },
  typography: { headingFont: FONTS.sansMedium, displayFont: FONTS.sans, displayWeight: '800', headingWeight: '800' },
  radius: { sm: 14, md: 22, lg: 30 },
  effects: { glow: false, gradients: false, decorativeElements: false, decor: 'none', risingSun: false },
  copy: { homeTagline: 'Good morning', successTitle: 'Up and out. Nice.' },
});
