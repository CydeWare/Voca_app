import type { PromptCategory, PromptDifficulty } from './prompt';

export type AlarmDifficulty = PromptDifficulty;
export type AlarmSoundId = 'voca_sunrise' | 'voca_pulse' | 'system_default';

/** 0 = Sunday ... 6 = Saturday (same as Date.getDay()). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Alarm = {
  id: string;
  hour: number;
  minute: number;
  label: string;
  enabled: boolean;
  repeatDays: Weekday[];
  soundId: AlarmSoundId;
  /** Fraction (0..1) of max alarm-stream volume; see DEFAULT_ALARM_VOLUME. */
  volume: number;
  promptCategory: PromptCategory;
  difficulty: AlarmDifficulty;
  vibrationEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AlarmDraft = Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'>;

/** Explicit state machine for the ringing experience. */
export type AlarmState =
  | 'IDLE'
  | 'TRIGGERING'
  | 'RINGING'
  | 'LISTENING'
  | 'VERIFYING'
  | 'RETRYING'
  | 'FALLBACK'
  | 'SUCCESS'
  | 'DISMISSED';

export type DismissalMethod = 'speech' | 'fallback';

/** What the native layer reports about the alarm that is ringing right now. */
export type RingingAlarmInfo = {
  alarmId: string;
  scheduledAt: number;
  triggeredAt: number;
  soundId: string;
  vibration: boolean;
  isTest: boolean;
  audioError: boolean;
};
