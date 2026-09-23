import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { MAX_HISTORY_ENTRIES, RECENT_PROMPT_MEMORY } from '../../constants';
import type { AlarmHistoryEntry } from '../../types/history';
import { appHydrated } from '../actions';

export type HistoryState = {
  entries: AlarmHistoryEntry[]; // newest first
  recentPromptIds: string[]; // oldest first
};

const initialState: HistoryState = { entries: [], recentPromptIds: [] };

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    historyEntryAdded(state, action: PayloadAction<AlarmHistoryEntry>) {
      state.entries.unshift(action.payload);
      if (state.entries.length > MAX_HISTORY_ENTRIES) state.entries.length = MAX_HISTORY_ENTRIES;
    },
    historyCleared(state) {
      state.entries = [];
    },
    promptUsed(state, action: PayloadAction<string>) {
      state.recentPromptIds = state.recentPromptIds.filter(id => id !== action.payload);
      state.recentPromptIds.push(action.payload);
      if (state.recentPromptIds.length > RECENT_PROMPT_MEMORY) {
        state.recentPromptIds.splice(0, state.recentPromptIds.length - RECENT_PROMPT_MEMORY);
      }
    },
  },
  extraReducers: builder => {
    builder.addCase(appHydrated, (state, action) => {
      if (action.payload.history) state.entries = action.payload.history;
      if (action.payload.recentPromptIds) state.recentPromptIds = action.payload.recentPromptIds;
    });
  },
});

export const { historyEntryAdded, historyCleared, promptUsed } = historySlice.actions;
export default historySlice.reducer;
