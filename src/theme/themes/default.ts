import { defineTheme } from '../buildTheme';

/** VOCA's original look: cool paper surfaces, a night-indigo hero that warms to dawn. */
export const defaultTheme = defineTheme({
  id: 'default',
  name: 'VOCA Classic',
  tagline: 'Night to dawn',
  isPremium: false,
  isDark: false,
  colors: {
    background: '#F3F5FB', surface: '#FFFFFF', surfaceSecondary: '#E9ECF6', border: '#DDE1EE', outline: '#DDE1EE',
    textPrimary: '#1C2140', textSecondary: '#4A5173', textMuted: '#6E7596',
    hero: '#161A3A', heroRaised: '#232861', heroLine: '#3A3F7A', onHero: '#FFFFFF', onHeroSoft: '#B9BDE6',
    heroPrimary: '#3B6BD9', onHeroPrimary: '#FFFFFF',
    primary: '#3B6BD9', primaryDeep: '#2A52B5', primarySoft: '#E3EAFB', onPrimary: '#FFFFFF',
    secondary: '#6C7BD9', accent: '#FF9F43', accentSoft: '#FFE3C4', onAccent: '#161A3A',
    success: '#2E9E6A', warning: '#B8741A', error: '#B83239', errorSoft: '#FBE4E5',
    switchThumb: '#FFFFFF',
  },
  typography: {},
  effects: {
    glow: false, gradients: false, decorativeElements: false, decor: 'none', risingSun: true,
    sunriseSky: ['#161A3A', '#2B2458', '#5A3A5E'],
  },
});
