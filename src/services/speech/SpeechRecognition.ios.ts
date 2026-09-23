import type { SpeechRecognitionService } from './SpeechRecognitionService';

/**
 * iOS placeholder that reports "unavailable" honestly, so the challenge routes to the fallback
 * puzzle. A future implementation would wrap SFSpeechRecognizer with
 * requiresOnDeviceRecognition = true.
 */
const noop = () => () => {};

export const speechRecognition: SpeechRecognitionService = {
  getCapabilities: async () => ({ available: false, onDeviceAvailable: false }),
  start: async () => {
    throw new Error('Speech recognition is not implemented on iOS yet.');
  },
  stop: async () => {},
  cancel: async () => {},
  onPartialResult: noop,
  onFinalResult: noop,
  onError: noop,
  onStateChange: noop,
  onVolume: noop,
};
