import { DeviceEventEmitter, NativeModules } from 'react-native';
import type { SpeechRecognitionService } from './SpeechRecognitionService';
import type { SpeechRecognitionError } from '../../types/speech';

const Native = NativeModules.VocaSpeech;

function listen<T>(event: string, map: (payload: any) => T, cb: (v: T) => void) {
  const sub = DeviceEventEmitter.addListener(event, payload => cb(map(payload)));
  return () => sub.remove();
}

/** Android SpeechRecognizer wrapper (see VocaSpeechModule.kt for engine selection). */
export const speechRecognition: SpeechRecognitionService = {
  async getCapabilities() {
    if (!Native) return { available: false, onDeviceAvailable: false };
    return Native.getCapabilities();
  },
  async start(options) {
    if (!Native) throw new Error('VocaSpeech native module is not linked.');
    return Native.start(options);
  },
  stop: async () => Native?.stop(),
  cancel: async () => Native?.cancel(),
  onPartialResult: cb => listen('VocaSpeechPartial', p => String(p?.text ?? ''), cb),
  onFinalResult: cb =>
    listen('VocaSpeechFinal', p => (Array.isArray(p?.candidates) ? p.candidates.map(String) : []), cb),
  onError: cb =>
    listen<SpeechRecognitionError>('VocaSpeechError', p => ({ code: p?.code ?? 'unknown', message: p?.message ?? '' }), cb),
  onStateChange: cb => listen('VocaSpeechState', p => p?.state, cb),
  onVolume: cb => listen('VocaSpeechVolume', p => Number(p?.value ?? 0), cb),
};
