import { NativeModules } from 'react-native';
import { log } from '../../utils/logger';

type NativeKV = {
  storageGet(key: string): Promise<string | null>;
  storageSet(key: string, value: string): Promise<void>;
  storageRemove(key: string): Promise<void>;
};

const native: NativeKV | undefined = NativeModules.VocaAlarm;
const memory = new Map<string, string>();

if (!native) log.warn('Native storage unavailable; using in-memory storage (data will not persist).');

/** Local persistent key-value storage (SharedPreferences on Android). No server involved. */
export const StorageService = {
  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const raw = native ? await native.storageGet(key) : memory.get(key) ?? null;
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (e) {
      log.error('Storage read failed', e);
      return null;
    }
  },
  async setJSON(key: string, value: unknown): Promise<void> {
    const raw = JSON.stringify(value);
    if (native) await native.storageSet(key, raw);
    else memory.set(key, raw);
  },
  async remove(key: string): Promise<void> {
    if (native) await native.storageRemove(key);
    else memory.delete(key);
  },
};
