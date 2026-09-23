import { FONTS } from '../fonts';
import { defineTheme } from '../buildTheme';

/** A dark glade lit by fireflies. */
export const fireflyTheme = defineTheme({
  id: 'firefly',
  name: 'Firefly',
  tagline: 'Lights in the glade',
  isPremium: true,
  isDark: true,
  colors: {
    background: '#0B130D', surface: '#121D15', surfaceSecondary: '#17261B', border: '#22342A', outline: '#2B4232',
    textPrimary: '#EAF2DF', textSecondary: '#C3D1BA', textMuted: '#93A68D',
    hero: '#070D09', heroRaised: '#13201A', heroLine: '#26382C', onHero: '#EAF2DF', onHeroSoft: '#A6B89E',
    heroPrimary: '#D6F26B', onHeroPrimary: '#0B130D',
    primary: '#D6F26B', primaryDeep: '#E4F79A', primarySoft: '#26331A', onPrimary: '#0B130D',
    secondary: '#9FC24A', accent: '#D6F26B', accentSoft: '#EEF9C4', onAccent: '#0B130D',
    success: '#D6F26B', warning: '#F2C46B', error: '#F08A7A', errorSoft: '#33190F',
    switchThumb: '#EAF2DF',
  },
  typography: {
    displayFont: FONTS.serif, headingFont: FONTS.serif, accentFont: FONTS.serif,
    displayWeight: '400', headingWeight: '400', promptWeight: '400',
  },
  radius: { sm: 12, md: 18, lg: 22 },
  shape: { cardBorderWidth: 1 },
  effects: { glow: true, gradients: false, decorativeElements: true, decor: 'fireflies', risingSun: false },
  copy: { homeTagline: 'In the glade', readInstruction: 'Say it into the dark', successTitle: 'Out of the woods.' },
});
