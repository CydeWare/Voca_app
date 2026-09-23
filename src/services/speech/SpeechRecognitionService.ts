import type {
  SpeechCapabilities,
  SpeechEngine,
  SpeechListeningState,
  SpeechRecognitionError,
  SpeechStartOptions,
} from '../../types/speech';

/**
 * The only speech API the app uses. Screens never import a speech package directly,
 * so the engine (Android SpeechRecognizer today; Vosk/Whisper.cpp later) is replaceable.
 */
export interface SpeechRecognitionService {
  getCapabilities(): Promise<SpeechCapabilities>;
  start(options: SpeechStartOptions): Promise<{ engine: SpeechEngine }>;
  stop(): Promise<void>;
  cancel(): Promise<void>;
  onPartialResult(callback: (text: string) => void): () => void;
  /** All alternative transcriptions, best first. */
  onFinalResult(callback: (candidates: string[]) => void): () => void;
  onError(callback: (error: SpeechRecognitionError) => void): () => void;
  onStateChange(callback: (state: SpeechListeningState) => void): () => void;
  /** Input level in dB-ish units, roughly -2..10. Throttled. */
  onVolume(callback: (value: number) => void): () => void;
}
