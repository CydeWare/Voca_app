import { FONTS } from '../fonts';
import { defineTheme } from '../buildTheme';

/** An ancient magical book: antique gold on black-purple, ornamental frames. */
export const grimoireTheme = defineTheme({
  id: 'grimoire',
  name: 'Grimoire',
  tagline: 'Mystical spellbook',
  isPremium: true,
  isDark: true,
  colors: {
    background: '#100817', surface: '#1A1024', surfaceSecondary: '#221531', border: '#33243F', outline: '#5A4526',
    textPrimary: '#F1E6CF', textSecondary: '#D0C2B6', textMuted: '#A99BB0',
    hero: '#0B0510', heroRaised: '#1C1127', heroLine: '#3A2A46', onHero: '#F1E6CF', onHeroSoft: '#B7A8BD',
    heroPrimary: '#C8A45D', onHeroPrimary: '#1A0E14',
    primary: '#C8A45D', primaryDeep: '#DDBE7E', primarySoft: '#2B1C2F', onPrimary: '#1A0E14',
    secondary: '#8E6C35', accent: '#E8A857', accentSoft: '#F2D5A6', onAccent: '#1A0E14',
    success: '#8CC49A', warning: '#E3B061', error: '#E08080', errorSoft: '#3A1624',
    switchThumb: '#F1E6CF',
  },
  typography: {
    displayFont: FONTS.serif, headingFont: FONTS.serif, accentFont: FONTS.serif,
    displayWeight: '700', headingWeight: '700', promptWeight: '400', captionUppercase: true, displayLetterSpacing: -1,
  },
  radius: { sm: 4, md: 8, lg: 10 },
  shape: { cardBorderWidth: 1 },
  effects: {
    glow: true, gradients: false, decorativeElements: true, decor: 'ornate', risingSun: false, ornament: '✦',
  },
  copy: {
    homeTagline: 'Book of Mornings',
    readInstruction: 'Speak the incantation',
    successTitle: 'The spell is broken. You are risen.',
  },
});
