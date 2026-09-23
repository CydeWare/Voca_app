import type { AppTheme } from './themeTypes';
import { defaultTheme } from './themes/default';
import { starlightTheme } from './themes/starlight';
import { grimoireTheme } from './themes/grimoire';
import { dawnTheme } from './themes/dawn';
import { moonlakeTheme } from './themes/moonlake';
import { fireflyTheme } from './themes/firefly';
import { auroraTheme } from './themes/aurora';
import { forestTheme } from './themes/forest';
import { tideTheme } from './themes/tide';
import { neonTheme } from './themes/neon';
import { gridTheme } from './themes/grid';
import { paperTheme } from './themes/paper';
import { cloudTheme } from './themes/cloud';
import { sketchTheme } from './themes/sketch';
import { flipTheme } from './themes/flip';
import { zenTheme } from './themes/zen';

/**
 * To add a theme: create themes/<name>.ts with defineTheme(...) and add it to this list.
 * Order here is the order shown in the theme picker.
 */
export const THEME_LIST: readonly AppTheme[] = [
  defaultTheme,
  starlightTheme,
  grimoireTheme,
  dawnTheme,
  moonlakeTheme,
  fireflyTheme,
  auroraTheme,
  forestTheme,
  tideTheme,
  neonTheme,
  gridTheme,
  paperTheme,
  cloudTheme,
  sketchTheme,
  flipTheme,
  zenTheme,
];

export const DEFAULT_THEME_ID = defaultTheme.id;

const BY_ID: Readonly<Record<string, AppTheme>> = Object.fromEntries(THEME_LIST.map(t => [t.id, t]));

export function isThemeId(id: unknown): id is string {
  return typeof id === 'string' && id in BY_ID;
}

/** Always returns a valid theme; unknown ids fall back to the default. */
export function getTheme(id: string | null | undefined): AppTheme {
  return (id && BY_ID[id]) || defaultTheme;
}
