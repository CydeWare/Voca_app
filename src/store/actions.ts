import { createAction } from '@reduxjs/toolkit';
import type { Alarm } from '../types/alarm';
import type { AlarmHistoryEntry } from '../types/history';
import type { SettingsState } from './slices/settingsSlice';

export type PersistedState = {
  alarms?: Alarm[];
  settings?: Partial<SettingsState>;
  history?: AlarmHistoryEntry[];
  recentPromptIds?: string[];
  themeId?: string;
};

/** Dispatched once at startup with whatever was loaded from disk. */
export const appHydrated = createAction<PersistedState>('app/hydrated');
