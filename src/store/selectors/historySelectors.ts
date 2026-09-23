import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../rootReducer';

export const selectHistory = (s: RootState) => s.history.entries;
export const selectRecentPromptIds = (s: RootState) => s.history.recentPromptIds;

export const wakeUpDelayMs = (e: { scheduledAt: string; dismissedAt: string }) =>
  Math.max(0, new Date(e.dismissedAt).getTime() - new Date(e.scheduledAt).getTime());

export const selectRealHistory = createSelector([selectHistory], entries => entries.filter(e => !e.isTest));

export const selectHistoryStats = createSelector([selectRealHistory], entries => {
  if (!entries.length) return null;
  const delays = entries.map(wakeUpDelayMs);
  const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
  const byVoice = entries.filter(e => e.dismissalMethod === 'speech').length;
  const avgAttempts = entries.reduce((a, e) => a + e.speechAttempts, 0) / entries.length;
  return {
    count: entries.length,
    avgDelayMs: avgDelay,
    voiceRate: byVoice / entries.length,
    avgAttempts,
  };
});
