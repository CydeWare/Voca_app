import { combineReducers } from '@reduxjs/toolkit';
import alarms from './slices/alarmSlice';
import activeAlarm from './slices/activeAlarmSlice';
import settings from './slices/settingsSlice';
import history from './slices/historySlice';
import theme from './slices/themeSlice';

export const rootReducer = combineReducers({ alarms, activeAlarm, settings, history, theme });
export type RootState = ReturnType<typeof rootReducer>;
