import type { DismissalMethod } from './alarm';

export type AlarmHistoryEntry = {
  id: string;
  alarmId: string;
  scheduledAt: string;
  dismissedAt: string;
  dismissalMethod: DismissalMethod;
  speechAttempts: number;
  promptId: string;
  promptText: string;
  bestScore: number | null;
  isTest: boolean;
};
