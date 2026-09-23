import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../rootReducer';
import { getNextOccurrence } from '../../utils/dateUtils';

export const selectAlarms = (s: RootState) => s.alarms.items;
export const selectScheduleError = (s: RootState) => s.alarms.scheduleError;
export const selectSchedule = (s: RootState) => s.alarms.schedule;
export const selectActiveAlarm = (s: RootState) => s.activeAlarm;
export const selectSettings = (s: RootState) => s.settings;

export const selectAlarmById = (id: string | undefined) => (s: RootState) =>
  id ? s.alarms.items.find(a => a.id === id) : undefined;

export const selectSortedAlarms = createSelector([selectAlarms], alarms =>
  [...alarms].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)),
);

export const selectEnabledAlarms = createSelector([selectAlarms], alarms => alarms.filter(a => a.enabled));

/** Soonest enabled alarm. `now` is passed in so the selector stays pure. */
export const selectNextAlarm = createSelector(
  [selectEnabledAlarms, (_: RootState, now: number) => now],
  (alarms, now) => {
    let best: { alarmId: string; at: Date } | null = null;
    for (const a of alarms) {
      const at = getNextOccurrence(a, new Date(now));
      if (!best || at < best.at) best = { alarmId: a.id, at };
    }
    return best;
  },
);

export const selectHasInexactSchedule = createSelector([selectSchedule], schedule =>
  Object.values(schedule).some(s => !s.exact),
);
