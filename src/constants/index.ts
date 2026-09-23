import type { VoiceStrictness } from '../types/speech';
import type { AlarmSoundId } from '../types/alarm';

/** Similarity (0..1) needed to accept a reading. Tune after real-device testing. */
export const SPEECH_MATCH_THRESHOLD = 0.8;

export const STRICTNESS_THRESHOLDS: Record<VoiceStrictness, number> = {
  relaxed: 0.7,
  normal: SPEECH_MATCH_THRESHOLD,
  strict: 0.9,
};

/** Failed readings before the fallback puzzle appears. */
export const MAX_SPEECH_ATTEMPTS = 3;

/** Hard cap on one listening session (engines normally stop on silence much sooner). */
export const LISTENING_TIMEOUT_MS = 15000;

/** Fuzzy match needed for a single word to count as "read" (handles lorry/lori). */
export const WORD_MATCH_THRESHOLD = 0.72;

/** How many recent prompts to avoid repeating. */
export const RECENT_PROMPT_MEMORY = 40;

export const SPEECH_LANGUAGE = 'en-US';

export const MAX_HISTORY_ENTRIES = 200;

export const STORAGE_KEY = 'voca/state/v1';

export const SOUND_OPTIONS: { id: AlarmSoundId; label: string; description: string }[] = [
  { id: 'voca_sunrise', label: 'Sunrise', description: 'Rising four-note chime' },
  { id: 'voca_pulse', label: 'Pulse', description: 'Urgent beeping' },
  { id: 'system_default', label: 'Phone default', description: 'Your system alarm tone' },
];

/**
 * Alarm loudness as a fraction (0..1) of the phone's max alarm-stream volume. While an alarm
 * rings, VOCA sets the system alarm volume to exactly this level, then restores the user's
 * original level afterwards.
 */
export const DEFAULT_ALARM_VOLUME = 0.7;
export const MIN_ALARM_VOLUME = 0.3; // still has to function as an alarm

/**
 * TEMP (testing): when set, EVERY alarm rings at this loudness regardless of its own setting.
 * Set back to null before release.
 */
export const TEST_VOLUME_OVERRIDE: number | null = null;

export const VOLUME_OPTIONS: { id: string; label: string; value: number }[] = [
  { id: 'test', label: '20% (test)', value: 0.2 }, // TEMP: remove this line when done testing
  { id: 'quiet', label: 'Quiet', value: 0.4 },
  { id: 'normal', label: 'Normal', value: 0.7 },
  { id: 'loud', label: 'Loud', value: 0.85 },
  { id: 'max', label: 'Max', value: 1.0 },
];

export const LOG_PREFIX = '[VOCA]';
