export type SpeechEngine = 'on_device' | 'system_prefer_offline' | 'system_online' | 'unsupported' | 'none';

export type SpeechErrorCode =
  | 'no_match'
  | 'no_speech'
  | 'audio'
  | 'permission'
  | 'network'
  | 'busy'
  | 'client'
  | 'unavailable'
  | 'timeout'
  | 'unknown';

export type SpeechRecognitionError = {
  code: SpeechErrorCode;
  message: string;
};

export type SpeechCapabilities = {
  available: boolean;
  onDeviceAvailable: boolean;
};

export type SpeechStartOptions = {
  language: string;
  preferOnDevice: boolean;
  /** Target sentence; used as recognition hints where the engine supports it. */
  biasingText?: string;
};

export type SpeechListeningState = 'ready' | 'speaking' | 'processing';

export type VoiceMode = 'normal' | 'whisper';
export type VoiceStrictness = 'relaxed' | 'normal' | 'strict';
