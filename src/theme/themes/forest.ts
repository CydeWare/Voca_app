import { FONTS } from '../fonts';
import { defineTheme } from '../buildTheme';

/** Moss and gold: botanical calm. */
export const forestTheme = defineTheme({
  id: 'forest',
  name: 'Forest',
  tagline: 'Moss and gold',
  isPremium: true,
  isDark: true,
  colors: {
    background: '#0F1712', surface: '#16211A', surfaceSecondary: '#1C2A21', border: '#2A3A2F', outline: '#3A4A30',
    textPrimary: '#EDE8D5', textSecondary: '#C9C7B2', textMuted: '#96A08E',
    hero: '#0B120E', heroRaised: '#18241C', heroLine: '#2F4034', onHero: '#EDE8D5', onHeroSoft: '#A9B3A0',
    heroPrimary: '#D9BE6C', onHeroPrimary: '#0F1712',
    primary: '#D9BE6C', primaryDeep: '#E6CF8C', primarySoft: '#26301E', onPrimary: '#0F1712',
    secondary: '#8FA66B', accent: '#E3C86F', accentSoft: '#F0E2B0', onAccent: '#0F1712',
    success: '#9CCB86', warning: '#E3B45F', error: '#E08070', errorSoft: '#3A1C18',
    switchThumb: '#EDE8D5',
  },
  typography: {
    displayFont: FONTS.serif, headingFont: FONTS.serif, accentFont: FONTS.serif,
    displayWeight: '400', headingWeight: '400', promptWeight: '400',
  },
  radius: { sm: 10, md: 16, lg: 20 },
  shape: { cardBorderWidth: 1 },
  effects: { glow: false, gradients: false, decorativeElements: true, decor: 'glow', risingSun: false },
  copy: { homeTagline: 'Rest now. Rise on purpose.', successTitle: 'Awake, and gently so.' },
});
