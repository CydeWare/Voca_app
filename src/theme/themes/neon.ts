import { FONTS } from '../fonts';
import { defineTheme } from '../buildTheme';

/** Nocturne: violet ground, magenta and cyan glow. */
export const neonTheme = defineTheme({
  id: 'neon',
  name: 'Neon',
  tagline: 'Magenta and cyan glow',
  isPremium: true,
  isDark: true,
  colors: {
    background: '#0E0A1F', surface: '#171130', surfaceSecondary: '#1F1740', border: '#2E2352', outline: '#3D2E6B',
    textPrimary: '#F3EEFF', textSecondary: '#CFC4F0', textMuted: '#9A8DC4',
    hero: '#09061A', heroRaised: '#1A1236', heroLine: '#34285E', onHero: '#F3EEFF', onHeroSoft: '#B3A6D9',
    heroPrimary: '#FF3EA5', onHeroPrimary: '#1A0620',
    primary: '#FF3EA5', primaryDeep: '#FF7CC3', primarySoft: '#3A1234', onPrimary: '#1A0620',
    secondary: '#8A5CFF', accent: '#3EE8FF', accentSoft: '#B6F6FF', onAccent: '#08061A',
    success: '#3EE8B0', warning: '#FFC93E', error: '#FF5C7A', errorSoft: '#3A0F22',
    switchThumb: '#FFFFFF',
  },
  typography: {
    displayFont: FONTS.condensed, headingFont: FONTS.condensed,
    displayWeight: '700', headingWeight: '700', promptWeight: '700', captionUppercase: true,
  },
  radius: { sm: 12, md: 18, lg: 22 },
  shape: { cardBorderWidth: 1 },
  effects: { glow: true, gradients: true, decorativeElements: true, decor: 'glow', risingSun: false },
  copy: { readInstruction: 'Say this out loud', successTitle: 'Fully online.' },
});
