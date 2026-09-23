import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { MAX_SPEECH_ATTEMPTS } from '../../constants';
import type { AlarmState, DismissalMethod, RingingAlarmInfo } from '../../types/alarm';
import type { Prompt } from '../../types/prompt';
import type { Puzzle } from '../../types/puzzle';
import type { SpeechEngine, SpeechErrorCode } from '../../types/speech';

export type ActiveAlarmState = {
  status: AlarmState;
  alarmId: string | null;
  scheduledAt: number | null;
  triggeredAt: number | null;
  isTest: boolean;
  audioError: boolean;
  prompt: Prompt | null;
  partialText: string;
  recognizedText: string;
  attempts: number;
  lastScore: number | null;
  bestScore: number | null;
  feedback: string | null;
  speechError: SpeechErrorCode | null;
  engine: SpeechEngine;
  puzzle: Puzzle | null;
  puzzleMistakes: number;
  fallbackReason: string | null;
  dismissalMethod: DismissalMethod | null;
};

export const initialActiveAlarmState: ActiveAlarmState = {
  status: 'IDLE',
  alarmId: null,
  scheduledAt: null,
  triggeredAt: null,
  isTest: false,
  audioError: false,
  prompt: null,
  partialText: '',
  recognizedText: '',
  attempts: 0,
  lastScore: null,
  bestScore: null,
  feedback: null,
  speechError: null,
  engine: 'none',
  puzzle: null,
  puzzleMistakes: 0,
  fallbackReason: null,
  dismissalMethod: null,
};

/** The only legal transitions. Anything else is ignored (and logged in dev). */
export const TRANSITIONS: Record<AlarmState, AlarmState[]> = {
  IDLE: ['TRIGGERING'],
  TRIGGERING: ['RINGING'],
  RINGING: ['LISTENING', 'FALLBACK'],
  LISTENING: ['VERIFYING', 'RETRYING', 'FALLBACK'],
  VERIFYING: ['SUCCESS', 'RETRYING', 'FALLBACK'],
  RETRYING: ['LISTENING', 'FALLBACK'],
  FALLBACK: ['SUCCESS'],
  SUCCESS: ['DISMISSED'],
  DISMISSED: ['IDLE', 'TRIGGERING'],
};

export const canTransition = (from: AlarmState, to: AlarmState) => TRANSITIONS[from].includes(to);

function go(state: ActiveAlarmState, to: AlarmState): boolean {
  if (!canTransition(state.status, to)) {
    if (__DEV__) console.warn(`[VOCA] Ignored alarm transition ${state.status} -> ${to}`);
    return false;
  }
  state.status = to;
  return true;
}

const activeAlarmSlice = createSlice({
  name: 'activeAlarm',
  initialState: initialActiveAlarmState,
  reducers: {
    alarmTriggered(state, action: PayloadAction<RingingAlarmInfo>) {
      const info = action.payload;
      const inProgress = state.status !== 'IDLE' && state.status !== 'DISMISSED';
      if (inProgress && state.alarmId === info.alarmId && state.triggeredAt === info.triggeredAt) {
        return; // same ring reported twice (event + startup query)
      }
      // A new alarm (or a new ring) always starts a fresh challenge.
      return {
        ...initialActiveAlarmState,
        status: 'TRIGGERING',
        alarmId: info.alarmId,
        scheduledAt: info.scheduledAt,
        triggeredAt: info.triggeredAt,
        isTest: info.isTest,
        audioError: info.audioError,
      };
    },
    ringingStarted(state, action: PayloadAction<{ prompt: Prompt }>) {
      if (go(state, 'RINGING')) state.prompt = action.payload.prompt;
    },
    listeningStarted(state, action: PayloadAction<{ engine: SpeechEngine }>) {
      if (!go(state, 'LISTENING')) return;
      state.engine = action.payload.engine;
      state.partialText = '';
      state.recognizedText = '';
      state.feedback = null;
      state.speechError = null;
    },
    partialResult(state, action: PayloadAction<string>) {
      // Display only. Partial results never dismiss the alarm.
      if (state.status === 'LISTENING') state.partialText = action.payload;
    },
    verificationStarted(state, action: PayloadAction<string>) {
      if (go(state, 'VERIFYING')) {
        state.recognizedText = action.payload;
        state.partialText = action.payload;
      }
    },
    verificationPassed(state, action: PayloadAction<{ score: number }>) {
      if (!go(state, 'SUCCESS')) return;
      state.attempts += 1;
      state.lastScore = action.payload.score;
      state.bestScore = Math.max(state.bestScore ?? 0, action.payload.score);
      state.dismissalMethod = 'speech';
      state.feedback = null;
    },
    /** A reading that didn't match, or silence / a recognizer error. Counts as one attempt. */
    attemptFailed(
      state,
      action: PayloadAction<{
        feedback: string;
        score?: number;
        errorCode?: SpeechErrorCode;
        fallbackPuzzle: Puzzle;
        maxAttempts?: number;
      }>,
    ) {
      if (state.status !== 'LISTENING' && state.status !== 'VERIFYING') return;
      const max = action.payload.maxAttempts ?? MAX_SPEECH_ATTEMPTS;
      state.attempts += 1;
      state.feedback = action.payload.feedback;
      state.speechError = action.payload.errorCode ?? null;
      if (action.payload.score !== undefined) {
        state.lastScore = action.payload.score;
        state.bestScore = Math.max(state.bestScore ?? 0, action.payload.score);
      }
      if (state.attempts >= max) {
        go(state, 'FALLBACK');
        state.puzzle = action.payload.fallbackPuzzle;
        state.fallbackReason = 'Voice attempts used up.';
      } else {
        go(state, 'RETRYING');
      }
    },
    /** Voice isn't possible at all (no mic permission, no recognizer): go straight to the puzzle. */
    fallbackRequested(state, action: PayloadAction<{ puzzle: Puzzle; reason: string }>) {
      if (!go(state, 'FALLBACK')) return;
      state.puzzle = action.payload.puzzle;
      state.fallbackReason = action.payload.reason;
    },
    puzzleAnswered(state, action: PayloadAction<{ correct: boolean; nextPuzzle: Puzzle }>) {
      if (state.status !== 'FALLBACK') return;
      if (action.payload.correct) {
        go(state, 'SUCCESS');
        state.dismissalMethod = 'fallback';
      } else {
        state.puzzleMistakes += 1;
        state.puzzle = action.payload.nextPuzzle;
      }
    },
    alarmDismissed(state) {
      go(state, 'DISMISSED');
    },
    activeAlarmReset() {
      return initialActiveAlarmState;
    },
  },
});

export const {
  alarmTriggered,
  ringingStarted,
  listeningStarted,
  partialResult,
  verificationStarted,
  verificationPassed,
  attemptFailed,
  fallbackRequested,
  puzzleAnswered,
  alarmDismissed,
  activeAlarmReset,
} = activeAlarmSlice.actions;
export default activeAlarmSlice.reducer;
