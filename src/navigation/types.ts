import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
  AlarmEditor: { alarmId?: string } | undefined;
  RingingAlarm: undefined;
  Themes: undefined;
};
