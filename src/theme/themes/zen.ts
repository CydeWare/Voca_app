import { FONTS } from '../fonts';
import { defineTheme } from '../buildTheme';

/** Almost nothing: thin numerals, grey, one orange dot. */
export const zenTheme = defineTheme({
  id: 'zen',
  name: 'Zen',
  tagline: 'Almost nothing',
  isPremium: true,
  isDark: false,
  colors: {
    background: '#F2F2F0', surface: '#FAFAF8', surfaceSecondary: '#ECECE9', border: '#E1E1DD', outline: '#E1E1DD',
    textPrimary: '#111111', textSecondary: '#4B4B48', textMuted: '#767672',
    hero: '#0A0A0A', heroRaised: '#1A1A1A', heroLine: '#2E2E2E', onHero: '#F2F2F0', onHeroSoft: '#9A9A96',
    heroPrimary: '#262626', onHeroPrimary: '#F2F2F0',
    primary: '#111111', primaryDeep: '#111111', primarySoft: '#E4E4E0', onPrimary: '#FAFAF8',
    secondary: '#6E6E6A', accent: '#FF6A2B', accentSoft: '#FFD2BD', onAccent: '#0A0A0A',
    success: '#3F8F5B', warning: '#A86F14', error: '#A83522', errorSoft: '#F8DDD6',
    switchThumb: '#FFFFFF',
  },
  typography: { displayFont: FONTS.sansThin, headingFont: FONTS.sansLight, displayWeight: '400', headingWeight: '400', promptWeight: '400' },
  radius: { sm: 10, md: 14, lg: 18 },
  effects: { glow: false, gradients: false, decorativeElements: false, decor: 'none', risingSun: false },
  copy: { readInstruction: 'Say this out loud', successTitle: 'Awake.' },
});
