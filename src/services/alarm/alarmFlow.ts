import { createAppAsyncThunk } from '../../store/hooks';
import {
  activeAlarmReset,
  alarmDismissed,
  alarmTriggered,
  ringingStarted,
} from '../../store/slices/activeAlarmSlice';
import { oneShotAlarmsFired, scheduleFailed, scheduleSynced } from '../../store/slices/alarmSlice';
import { historyEntryAdded, promptUsed } from '../../store/slices/historySlice';
import type { DismissalMethod, RingingAlarmInfo } from '../../types/alarm';
import { createId } from '../../utils/id';
import { log } from '../../utils/logger';
import { PromptGenerator } from '../prompts/PromptGenerator';
import { speechRecognition } from '../speech';
import { AlarmService } from './AlarmService';

/** Push the enabled alarms to the OS scheduler. Called whenever alarms change. */
export const syncSchedules = createAppAsyncThunk('alarms/sync', async (_, { getState, dispatch }) => {
  if (!AlarmService.isSupported) return;
  try {
    const results = await AlarmService.syncAlarms(getState().alarms.items);
    dispatch(scheduleSynced(results));
  } catch (e: any) {
    log.error('Scheduling failed', e);
    dispatch(scheduleFailed("We couldn't schedule this alarm. Please check your alarm permissions."));
  }
});

/** Pick up state that changed while JS wasn't running (fired one-shots, an alarm ringing now). */
export const reconcileWithNative = createAppAsyncThunk('alarms/reconcile', async (_, { dispatch }) => {
  if (!AlarmService.isSupported) return;
  const fired = await AlarmService.consumeFiredOneShots();
  if (fired.length) dispatch(oneShotAlarmsFired(fired));
  await dispatch(syncSchedules());
  const ringing = await AlarmService.getRingingAlarm();
  if (ringing) await dispatch(beginAlarm(ringing));
});

/** Native reported a ringing alarm: set up the challenge with a fresh prompt. */
export const beginAlarm = createAppAsyncThunk(
  'activeAlarm/begin',
  async (info: RingingAlarmInfo, { getState, dispatch }) => {
    const before = getState().activeAlarm;
    dispatch(alarmTriggered(info));
    const after = getState().activeAlarm;
    if (after === before || after.status !== 'TRIGGERING') return; // duplicate report

    const state = getState();
    const alarm = state.alarms.items.find(a => a.id === info.alarmId);
    if (!alarm && !info.isTest) {
      // Deleted in JS but still delivered: nothing sensible to show; stop cleanly.
    }
    if (alarm && alarm.repeatDays.length === 0) dispatch(oneShotAlarmsFired([alarm.id]));

    const prompt = PromptGenerator.generatePrompt({
      category: alarm?.promptCategory ?? state.settings.defaultPromptCategory,
      difficulty: alarm?.difficulty ?? state.settings.defaultDifficulty,
      recentIds: state.history.recentPromptIds,
    });
    dispatch(promptUsed(prompt.id));
    dispatch(ringingStarted({ prompt }));
    log.info(`Alarm triggered; prompt selected: ${prompt.id}`);
  },
);

/**
 * The single dismissal path used by both voice and fallback success.
 * Order matters: silence the phone first, then record, then update UI state.
 */
export const dismissAlarm = createAppAsyncThunk(
  'activeAlarm/dismiss',
  async ({ method }: { method: DismissalMethod }, { getState, dispatch }) => {
    const active = getState().activeAlarm;
    if (active.status !== 'SUCCESS') {
      log.warn(`dismissAlarm called in state ${active.status}; ignoring`);
      return;
    }
    try {
      await AlarmService.stopRinging(); // audio + vibration + foreground service + lock-screen mode
    } catch (e) {
      log.error('stopRinging failed', e);
    }
    try {
      await speechRecognition.cancel();
    } catch {}

    const dismissedAt = new Date();
    dispatch(
      historyEntryAdded({
        id: createId('hist'),
        alarmId: active.alarmId ?? 'unknown',
        scheduledAt: new Date(active.scheduledAt ?? active.triggeredAt ?? Date.now()).toISOString(),
        dismissedAt: dismissedAt.toISOString(),
        dismissalMethod: method,
        speechAttempts: active.attempts,
        promptId: active.prompt?.id ?? 'none',
        promptText: active.prompt?.text ?? '',
        bestScore: active.bestScore,
        isTest: active.isTest,
      }),
    );
    dispatch(alarmDismissed());
    log.info(`Alarm dismissed via ${method}`);
  },
);

export const finishDismissedAlarm = createAppAsyncThunk('activeAlarm/finish', async (_, { dispatch }) => {
  dispatch(activeAlarmReset());
});
