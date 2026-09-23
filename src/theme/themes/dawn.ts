import { FONTS } from '../fonts';
import { defineTheme } from '../buildTheme';

/** A sunrise in the dark: plum ground, coral glow, soft serif. */
export const dawnTheme = defineTheme({
  id: 'dawn',
  name: 'Dawn',
  tagline: 'A sunrise in the dark',
  isPremium: true,
  isDark: true,
  colors: {
    background: '#1B1024', surface: '#26182F', surfaceSecondary: '#2F1F3A', border: '#3B2A47', outline: '#3B2A47',
    textPrimary: '#F7EDE8', textSecondary: '#D6C3CF', textMuted: '#A993A6',
    hero: '#140B1C', heroRaised: '#2A1A35', heroLine: '#43304F', onHero: '#F7EDE8', onHeroSoft: '#C4AFC0',
    heroPrimary: '#F08A5D', onHeroPrimary: '#1B1024',
    primary: '#F08A5D', primaryDeep: '#F6A884', primarySoft: '#3A2230', onPrimary: '#1B1024',
    secondary: '#D9678A', accent: '#FF9F7A', accentSoft: '#FFD2BF', onAccent: '#1B1024',
    success: '#7FC8A0', warning: '#F2B66B', error: '#F07B7B', errorSoft: '#3D1A26',
    switchThumb: '#FFFFFF',
  },
  typography: {
    displayFont: FONTS.serif, headingFont: FONTS.serif, displayWeight: '400', headingWeight: '400', promptWeight: '400',
  },
  radius: { sm: 12, md: 18, lg: 24 },
  effects: {
    glow: true, gradients: true, decorativeElements: true, decor: 'glow', risingSun: true,
    sunriseSky: ['#140B1C', '#3B1A3A', '#7A3A48'],
  },
  copy: { homeTagline: 'Sleep well, wake for real.', successTitle: 'You rose with the sun.' },
});
