import React, { createContext, useContext } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectCurrentTheme } from '../store/slices/themeSlice';
import { defaultTheme } from './themes/default';
import type { AppTheme } from './themeTypes';

const ThemeContext = createContext<AppTheme>(defaultTheme);

/** Supplies the user's selected theme to the whole tree. Theme objects are static, so this only re-renders on a change. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppSelector(selectCurrentTheme);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** Renders children with a specific theme (used by the picker's live previews). */
export function ThemeScope({ theme, children }: { theme: AppTheme; children: React.ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}

type Factory<S> = (t: AppTheme) => S;
// Styles are built once per (factory, theme) pair and reused by every component instance.
const cache = new WeakMap<Factory<unknown>, WeakMap<AppTheme, unknown>>();

export function getThemedStyles<S>(factory: Factory<S>, theme: AppTheme): S {
  let perTheme = cache.get(factory as Factory<unknown>);
  if (!perTheme) {
    perTheme = new WeakMap();
    cache.set(factory as Factory<unknown>, perTheme);
  }
  if (!perTheme.has(theme)) perTheme.set(theme, factory(theme));
  return perTheme.get(theme) as S;
}

/** `const { t, styles } = useThemed(makeStyles);` */
export function useThemed<S>(factory: Factory<S>): { t: AppTheme; styles: S } {
  const t = useTheme();
  return { t, styles: getThemedStyles(factory, t) };
}
