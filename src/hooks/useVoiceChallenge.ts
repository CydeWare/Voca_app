import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useStore } from 'react-redux';
import { LISTENING_TIMEOUT_MS, MAX_SPEECH_ATTEMPTS, SPEECH_LANGUAGE } from '../constants';
import { AlarmService } from '../services/alarm';
import { dismissAlarm } from '../services/alarm/alarmFlow';
import { generatePuzzle, isPuzzleAnswerCorrect } from '../services/puzzle/PuzzleGenerator';
import { SpeechMatcher, speechRecognition } from '../services/speech';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { RootState } from '../store/rootReducer';
import {
  attemptFailed,
  fallbackRequested,
  listeningStarted,
  partialResult,
  puzzleAnswered,
  verificationPassed,
  verificationStarted,
} from '../store/slices/activeAlarmSlice';
import type { SpeechRecognitionError } from '../types/speech';
import { log } from '../utils/logger';
import { checkMicrophone, requestMicrophone, type PermissionResult } from '../utils/permissions';

export type MicStatus = 'checking' | 'granted' | 'needs_permission' | 'blocked';

const RETRY_FEEDBACK = "That didn't quite match. Try reading it exactly as shown.";

// Gives the alarm audio time to actually go silent before the mic starts listening —
// on a real phone there's a brief moment where the tail of the tone can bleed into
// the very start of the recording and throw off the recognizer.
const DUCK_SETTLE_MS = 350;

function feedbackForError(e: SpeechRecognitionError): string {
  switch (e.code) {
    case 'no_speech':
      return "We didn't hear anything. Hold the phone closer and read it out loud.";
    case 'no_match':
      return "We couldn't make out the words. Speak a bit slower and clearly, closer to the mic.";
    case 'audio':
      return "We couldn't access your microphone. Try again or use the puzzle.";
    case 'network':
      return 'Voice recognition needs an offline English speech pack or a connection. Try again or use the puzzle.';
    case 'busy':
      return 'The microphone was busy. Try again.';
    default:
      return RETRY_FEEDBACK;
  }
}

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Drives LISTENING -> VERIFYING -> SUCCESS / RETRYING / FALLBACK.
 * Speech events are read against the live store (not render-time state) to avoid stale closures.
 */
export function useVoiceChallenge() {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const active = useAppSelector(s => s.activeAlarm);
  const strictness = useAppSelector(s => s.settings.voiceStrictness);
  const preferOnDevice = useAppSelector(s => s.settings.preferOnDeviceSpeech);

  const [micStatus, setMicStatus] = useState<MicStatus>('checking');
  const [speechAvailable, setSpeechAvailable] = useState<boolean | null>(null);
  const [level, setLevel] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const status = useCallback(() => store.getState().activeAlarm.status, [store]);

  const clearListeningTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const resumeRinging = useCallback(() => {
    AlarmService.setRingingDucked(false).catch(() => {});
  }, []);

  const failAttempt = useCallback(
    (feedback: string, extra: { score?: number; errorCode?: SpeechRecognitionError['code'] } = {}) => {
      clearListeningTimeout();
      dispatch(
        attemptFailed({ feedback, ...extra, fallbackPuzzle: generatePuzzle(), maxAttempts: MAX_SPEECH_ATTEMPTS }),
      );
      resumeRinging();
    },
    [dispatch, resumeRinging, clearListeningTimeout],
  );

  const goToFallback = useCallback(
    (reason: string) => {
      clearListeningTimeout();
      speechRecognition.cancel().catch(() => {});
      dispatch(fallbackRequested({ puzzle: generatePuzzle(), reason }));
      resumeRinging();
    },
    [dispatch, resumeRinging, clearListeningTimeout],
  );

  // ---- Capabilities + microphone permission (checked, not requested, on mount) ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const caps = await speechRecognition.getCapabilities().catch(() => ({ available: false, onDeviceAvailable: false }));
      const mic = await checkMicrophone().catch(() => false);
      if (cancelled) return;
      setSpeechAvailable(caps.available);
      setMicStatus(mic ? 'granted' : 'needs_permission');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // No recognizer on this device at all: go straight to the puzzle rather than trapping the user.
  useEffect(() => {
    if (speechAvailable === false && (active.status === 'RINGING' || active.status === 'RETRYING')) {
      goToFallback("Voice recognition isn't available right now. Use the fallback challenge.");
    }
  }, [speechAvailable, active.status, goToFallback]);

  // ---- Speech event subscriptions (cleaned up on unmount) ----
  useEffect(() => {
    const unsubs = [
      speechRecognition.onPartialResult(text => {
        if (status() === 'LISTENING') dispatch(partialResult(text));
      }),
      speechRecognition.onVolume(v => setLevel(v)),
      speechRecognition.onFinalResult(candidates => {
        if (status() !== 'LISTENING') return;
        clearListeningTimeout();
        const prompt = store.getState().activeAlarm.prompt;
        if (!prompt) return;
        const result = SpeechMatcher.verify(prompt.text, candidates, strictness);
        dispatch(verificationStarted(result.text));
        log.info(`Verification score: ${result.score.toFixed(2)} (threshold ${result.threshold})`);
        if (result.passed) {
          dispatch(verificationPassed({ score: result.score }));
          dispatch(dismissAlarm({ method: 'speech' }));
        } else {
          failAttempt(RETRY_FEEDBACK, { score: result.score });
        }
      }),
      speechRecognition.onError(err => {
        if (status() !== 'LISTENING') return;
        log.warn(`Speech error: ${err.code}`);
        if (err.code === 'permission') {
          setMicStatus('needs_permission');
          goToFallback("We couldn't access your microphone. Use the fallback challenge.");
          return;
        }
        if (err.code === 'unavailable') {
          goToFallback("Voice recognition isn't available right now. Use the fallback challenge.");
          return;
        }
        failAttempt(feedbackForError(err), { errorCode: err.code });
      }),
    ];
    return () => {
      unsubs.forEach(u => u());
      clearListeningTimeout();
      speechRecognition.cancel().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, strictness, failAttempt, goToFallback]);

  // If the app is backgrounded mid-listen, abandon this listen (and keep ringing).
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => {
      if (s !== 'active' && status() === 'LISTENING') {
        speechRecognition.cancel().catch(() => {});
        failAttempt(RETRY_FEEDBACK, { errorCode: 'client' });
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failAttempt]);

  // ---- Actions ----
  const startListening = useCallback(async () => {
    const s = status();
    if (s !== 'RINGING' && s !== 'RETRYING') return;
    const prompt = store.getState().activeAlarm.prompt;
    if (!prompt) return;
    try {
      await AlarmService.setRingingDucked(true); // silence the alarm so the mic can hear you
      await delay(DUCK_SETTLE_MS); // let it actually go quiet before we start recording
      if (status() !== s) return; // user backed out or the alarm state moved on while we waited
      const { engine } = await speechRecognition.start({
        language: SPEECH_LANGUAGE,
        preferOnDevice,
        biasingText: prompt.text,
      });
      dispatch(listeningStarted({ engine }));
      log.info(`Speech recognition started (${engine})`);
      clearListeningTimeout();
      timeoutRef.current = setTimeout(() => {
        if (status() === 'LISTENING') {
          speechRecognition.cancel().catch(() => {});
          failAttempt("We didn't hear the whole sentence. Try again.", { errorCode: 'timeout' });
        }
      }, LISTENING_TIMEOUT_MS);
    } catch (e: any) {
      log.error('Speech start failed', e);
      resumeRinging();
      goToFallback("Voice recognition isn't available right now. Use the fallback challenge.");
    }
  }, [dispatch, store, status, clearListeningTimeout, preferOnDevice, failAttempt, goToFallback, resumeRinging]);

  const requestMic = useCallback(async (): Promise<PermissionResult> => {
    const r = await requestMicrophone();
    setMicStatus(r === 'granted' ? 'granted' : r === 'blocked' ? 'blocked' : 'needs_permission');
    return r;
  }, []);

  const switchToPuzzle = useCallback(() => {
    goToFallback('Voice not available. Solve a quick puzzle instead.');
  }, [goToFallback]);

  const answerPuzzle = useCallback(
    (optionId: string) => {
      const puzzle = store.getState().activeAlarm.puzzle;
      if (!puzzle) return;
      const correct = isPuzzleAnswerCorrect(puzzle, optionId);
      dispatch(puzzleAnswered({ correct, nextPuzzle: generatePuzzle() }));
      if (correct) dispatch(dismissAlarm({ method: 'fallback' }));
    },
    [dispatch, store],
  );

  const { prompt, status: alarmStatus, partialText } = active;
  const tokenFlags = useMemo(() => {
    if (!prompt) return [];
    if (alarmStatus === 'SUCCESS' || alarmStatus === 'DISMISSED') {
      return new Array<boolean>(SpeechMatcher.targetWordCount(prompt.text)).fill(true);
    }
    if (alarmStatus === 'LISTENING' || alarmStatus === 'VERIFYING') {
      return SpeechMatcher.spokenWordFlags(prompt.text, partialText);
    }
    return [];
  }, [prompt, alarmStatus, partialText]);

  return {
    active,
    micStatus,
    speechAvailable,
    level,
    tokenFlags,
    startListening,
    requestMic,
    switchToPuzzle,
    answerPuzzle,
  };
}
