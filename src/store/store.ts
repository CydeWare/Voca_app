import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { rootReducer } from './rootReducer';
import {
  addAlarm,
  deleteAlarm,
  oneShotAlarmsFired,
  setAlarmEnabled,
  updateAlarm,
} from './slices/alarmSlice';
import { syncSchedules } from '../services/alarm/alarmFlow';

/** Keeps the OS alarm schedule in step with Redux. Redux holds intent; native holds the timers. */
const scheduleListener = createListenerMiddleware();
scheduleListener.startListening({
  matcher: isAnyOf(addAlarm, updateAlarm, deleteAlarm, setAlarmEnabled, oneShotAlarmsFired),
  effect: async (_action, api) => {
    api.cancelActiveListeners();
    await api.delay(150); // coalesce rapid toggles
    await api.dispatch(syncSchedules() as any);
  },
});

export function createStore() {
  return configureStore({
    reducer: rootReducer,
    middleware: getDefault => getDefault().prepend(scheduleListener.middleware),
  });
}

export const store = createStore();
export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;
