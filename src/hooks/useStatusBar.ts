import { useCallback } from 'react';
import { StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';

/**
 * Sets status-bar icon colour whenever the screen gains focus (tabs stay mounted, so a
 * <StatusBar> element isn't enough). `hero` = the screen's top is a dark hero area;
 * `app` = the top is the theme's normal background, which may be light or dark.
 */
export function useStatusBar(zone: 'hero' | 'app') {
  const dark = useTheme().isDark;
  const style = zone === 'hero' || dark ? 'light-content' : 'dark-content';
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(style, true);
    }, [style]),
  );
}
