import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlarmEditorScreen } from '../screens/AlarmEditor/AlarmEditorScreen';
import { AlarmHistoryScreen } from '../screens/AlarmHistory/AlarmHistoryScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { OnboardingScreen } from '../screens/Onboarding/OnboardingScreen';
import { RingingAlarmScreen } from '../screens/RingingAlarm/RingingAlarmScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import { useAppSelector } from '../store/hooks';
import { useTheme } from '../theme';
import { ThemesScreen } from '../screens/Themes/ThemesScreen';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

/* Tiny drawn icons so we don't pull in an icon font for three glyphs. */
function ClockIcon({ color }: { color: string }) {
  return (
    <View style={[icon.circle, { borderColor: color }]}>
      <View style={[icon.handV, { backgroundColor: color }]} />
      <View style={[icon.handH, { backgroundColor: color }]} />
    </View>
  );
}
function BarsIcon({ color }: { color: string }) {
  return (
    <View style={icon.bars}>
      {[8, 16, 11].map((h, i) => (
        <View key={i} style={{ width: 4, height: h, borderRadius: 2, backgroundColor: color }} />
      ))}
    </View>
  );
}
function SlidersIcon({ color }: { color: string }) {
  const t = useTheme();
  return (
    <View style={{ width: 20, gap: 5 }}>
      {[4, 12].map((x, i) => (
        <View key={i} style={{ height: 2, backgroundColor: color, borderRadius: 1, justifyContent: 'center' }}>
          <View style={[icon.knob, { left: x, borderColor: color, backgroundColor: t.colors.surface }]} />
        </View>
      ))}
    </View>
  );
}

function MainTabs() {
  const t = useTheme();
  // Android 15+ draws edge-to-edge: the tab bar must sit above the gesture / 3-button nav bar.
  const insets = useSafeAreaInsets();
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarStyle: {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.border,
          height: 64 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginBottom: 6, fontFamily: t.type.caption.fontFamily },
      }}>
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Alarms', tabBarIcon: ({ color }) => <ClockIcon color={color} /> }}
      />
      <Tabs.Screen
        name="History"
        component={AlarmHistoryScreen}
        options={{ title: 'Wake-ups', tabBarIcon: ({ color }) => <BarsIcon color={color} /> }}
      />
      <Tabs.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings', tabBarIcon: ({ color }) => <SlidersIcon color={color} /> }}
      />
    </Tabs.Navigator>
  );
}

/**
 * Screens are chosen by state, not by navigate() calls:
 *  - an active alarm replaces everything with the challenge (no back stack to escape into)
 *  - first launch shows onboarding
 *  - otherwise the normal app
 */
export function AppNavigator() {
  const ringing = useAppSelector(s => s.activeAlarm.status !== 'IDLE');
  const onboarded = useAppSelector(s => s.settings.onboardingComplete);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {ringing ? (
        <Stack.Screen name="RingingAlarm" component={RingingAlarmScreen} options={{ gestureEnabled: false }} />
      ) : !onboarded ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="AlarmEditor"
            component={AlarmEditorScreen}
            options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
          />
          <Stack.Screen name="Themes" component={ThemesScreen} options={{ animation: 'slide_from_right' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

const icon = StyleSheet.create({
  circle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  handV: { position: 'absolute', width: 2, height: 6, top: 3, borderRadius: 1 },
  handH: { position: 'absolute', width: 5, height: 2, left: 8, top: 8, borderRadius: 1 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 18 },
  knob: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 2,
  },
});