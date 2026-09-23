import { DEFAULT_THEME_ID, getTheme, isThemeId, THEME_LIST } from '../src/theme';
import type { ThemeColors } from '../src/theme';
import { defaultTheme } from '../src/theme/themes/default';

const REQUIRED_COLORS: (keyof ThemeColors)[] = [
  'background', 'surface', 'surfaceSecondary', 'border', 'outline', 'textPrimary', 'textSecondary', 'textMuted',
  'hero', 'heroRaised', 'heroLine', 'onHero', 'onHeroSoft', 'heroPrimary', 'onHeroPrimary',
  'primary', 'primaryDeep', 'primarySoft', 'onPrimary', 'secondary', 'accent', 'accentSoft', 'onAccent',
  'success', 'warning', 'error', 'errorSoft', 'switchThumb',
];

// WCAG relative luminance / contrast ratio.
function lum(hex: string) {
  const ch = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe('theme registry', () => {
  it('has the required themes', () => {
    for (const id of ['default', 'starlight', 'grimoire']) expect(isThemeId(id)).toBe(true);
  });
  it('ids are unique', () => {
    expect(new Set(THEME_LIST.map(t => t.id)).size).toBe(THEME_LIST.length);
  });
  it('getTheme returns the matching theme and falls back to default', () => {
    for (const t of THEME_LIST) expect(getTheme(t.id)).toBe(t);
    expect(getTheme('does-not-exist')).toBe(defaultTheme);
    expect(getTheme(undefined).id).toBe(DEFAULT_THEME_ID);
  });
  it('theme objects are static (frozen)', () => {
    for (const t of THEME_LIST) {
      expect(Object.isFrozen(t)).toBe(true);
      expect(Object.isFrozen(t.colors)).toBe(true);
    }
  });
});

describe.each(THEME_LIST.map(t => [t.id, t] as const))('theme "%s"', (_id, theme) => {
  it('defines every colour token as a hex colour', () => {
    for (const k of REQUIRED_COLORS) expect(theme.colors[k]).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
  it('has name, tagline, type scale and effects', () => {
    expect(theme.name.length).toBeGreaterThan(0);
    expect(theme.tagline.length).toBeGreaterThan(0);
    expect(theme.type.prompt.fontSize).toBeGreaterThan(0);
    expect(theme.effects.sunriseSky).toHaveLength(3);
    expect(typeof theme.isPremium).toBe('boolean');
  });
  it('keeps text readable (WCAG AA)', () => {
    const c = theme.colors;
    expect(contrast(c.textPrimary, c.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.textPrimary, c.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.textSecondary, c.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.textMuted, c.surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(c.onHero, c.hero)).toBeGreaterThanOrEqual(7);
    expect(contrast(c.onHeroSoft, c.hero)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.onHeroPrimary, c.heroPrimary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.accent, c.hero)).toBeGreaterThanOrEqual(4.5); // lit words in the sentence
    expect(contrast(c.primaryDeep, c.primarySoft)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.error, c.errorSoft)).toBeGreaterThanOrEqual(4.5);
  });
});
