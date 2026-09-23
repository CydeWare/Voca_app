import React, { useEffect, useMemo, useState } from 'react';
import { AppState, StatusBar, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AlarmService } from './src/services/alarm';
import { beginAlarm, reconcileWithNative } from './src/services/alarm/alarmFlow';
import { appHydrated } from './src/store/actions';
import { loadPersistedState, startPersistence } from './src/store/persistence';
import { store } from './src/store/store';
import { ThemeProvider, useTheme } from './src/theme';
import { log } from './src/utils/logger';


/**
 * Boot order matters:
 * 1. listen for native "ringing" events first so nothing is missed
 * 2. load persisted state, then start persisting
 * 3. reconcile with native (fired one-shots, an alarm that is ringing right now)
 */
function useBootstrap() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stopPersistence: (() => void) | undefined;
    let hydrated = false;

    const offRinging = AlarmService.isSupported
      ? AlarmService.onRinging(info => {
          store.dispatch(beginAlarm(info));
        })
      : () => {};

    (async () => {
      try {
        const persisted = await loadPersistedState();
        store.dispatch(appHydrated(persisted));
      } catch (e) {
        log.error('Hydration failed', e);
      }
      stopPersistence = startPersistence(store);
      hydrated = true;
      setReady(true);
      try {
        await store.dispatch(reconcileWithNative());
      } catch (e) {
        log.error('Reconcile failed', e);
      }
    })();

    // Returning from background: an alarm may have fired while JS was paused.
    const appStateSub = AppState.addEventListener('change', s => {
      if (s === 'active' && hydrated) store.dispatch(reconcileWithNative());
    });

    return () => {
      offRinging();
      appStateSub.remove();
      stopPersistence?.();
    };
  }, []);

  return ready;
}

function Root() {
  const ready = useBootstrap();
  const t = useTheme();
  // React Navigation paints screen backgrounds during transitions; keep them on-theme.
  const navTheme = useMemo(() => {
    const base = t.isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: t.colors.background,
        card: t.colors.surface,
        text: t.colors.textPrimary,
        border: t.colors.border,
        primary: t.colors.primary,
      },
    };
  }, [t]);
  if (!ready) {
    return (
      <View style={[styles.splash, { backgroundColor: t.colors.hero }]}>
        <StatusBar barStyle="light-content" />
        <Text style={[styles.wordmark, { color: t.colors.onHero }]}>VOCA</Text>
      </View>
    );
  }
  return (
    <NavigationContainer theme={navTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <SafeAreaProvider>
          <Root />
        </SafeAreaProvider>
      </ThemeProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontSize: 28, fontWeight: '900', letterSpacing: 8 },
});
