import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AlarmDifficulty, AlarmSoundId } from '../../types/alarm';
import type { PromptCategory } from '../../types/prompt';
import type { VoiceMode, VoiceStrictness } from '../../types/speech';
import { appHydrated } from '../actions';
import { DEFAULT_ALARM_VOLUME } from '../../constants';

export type SettingsState = {
  onboardingComplete: boolean;
  defaultSoundId: AlarmSoundId;
  defaultVolume: number;
  defaultVibration: boolean;
  defaultPromptCategory: PromptCategory;
  defaultDifficulty: AlarmDifficulty;
  voiceStrictness: VoiceStrictness;
  /** Whisper is architected for but not enabled: no engine here reliably recognizes whispers. */
  voiceMode: VoiceMode;
  preferOnDeviceSpeech: boolean;
};

export const initialSettings: SettingsState = {
  onboardingComplete: false,
  defaultSoundId: 'voca_sunrise',
  defaultVolume: DEFAULT_ALARM_VOLUME,
  defaultVibration: true,
  defaultPromptCategory: 'random',
  defaultDifficulty: 'normal',
  voiceStrictness: 'normal',
  voiceMode: 'normal',
  preferOnDeviceSpeech: true,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: initialSettings,
  reducers: {
    settingsChanged(state, action: PayloadAction<Partial<SettingsState>>) {
      Object.assign(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder.addCase(appHydrated, (state, action) => {
      if (action.payload.settings) Object.assign(state, action.payload.settings);
    });
  },
});

export const { settingsChanged } = settingsSlice.actions;
export default settingsSlice.reducer;
