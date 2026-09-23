import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Alarm, AlarmDraft } from '../../types/alarm';
import { createId } from '../../utils/id';
import { appHydrated } from '../actions';

export type ScheduleInfo = { id: string; triggerAt: number; exact: boolean };

export type AlarmSliceState = {
  items: Alarm[];
  schedule: Record<string, ScheduleInfo>;
  scheduleError: string | null;
};

const initialState: AlarmSliceState = { items: [], schedule: {}, scheduleError: null };

const alarmSlice = createSlice({
  name: 'alarms',
  initialState,
  reducers: {
    addAlarm: {
      reducer(state, action: PayloadAction<Alarm>) {
        state.items.push(action.payload);
      },
      prepare(draft: AlarmDraft) {
        const now = new Date().toISOString();
        return { payload: { ...draft, id: createId('alarm'), createdAt: now, updatedAt: now } };
      },
    },
    updateAlarm(state, action: PayloadAction<{ id: string; changes: Partial<AlarmDraft> }>) {
      const alarm = state.items.find(a => a.id === action.payload.id);
      if (!alarm) return;
      Object.assign(alarm, action.payload.changes, { updatedAt: new Date().toISOString() });
    },
    deleteAlarm(state, action: PayloadAction<string>) {
      state.items = state.items.filter(a => a.id !== action.payload);
      delete state.schedule[action.payload];
    },
    setAlarmEnabled(state, action: PayloadAction<{ id: string; enabled: boolean }>) {
      const alarm = state.items.find(a => a.id === action.payload.id);
      if (!alarm) return;
      alarm.enabled = action.payload.enabled;
      alarm.updatedAt = new Date().toISOString();
    },
    /** One-shot alarms turn themselves off after ringing. */
    oneShotAlarmsFired(state, action: PayloadAction<string[]>) {
      for (const alarm of state.items) {
        if (action.payload.includes(alarm.id) && alarm.repeatDays.length === 0) alarm.enabled = false;
      }
    },
    scheduleSynced(state, action: PayloadAction<ScheduleInfo[]>) {
      state.schedule = Object.fromEntries(action.payload.map(s => [s.id, s]));
      state.scheduleError = null;
    },
    scheduleFailed(state, action: PayloadAction<string>) {
      state.scheduleError = action.payload;
    },
  },
  extraReducers: builder => {
    builder.addCase(appHydrated, (state, action) => {
      if (action.payload.alarms) state.items = action.payload.alarms;
    });
  },
});

export const {
  addAlarm,
  updateAlarm,
  deleteAlarm,
  setAlarmEnabled,
  oneShotAlarmsFired,
  scheduleSynced,
  scheduleFailed,
} = alarmSlice.actions;
export default alarmSlice.reducer;
