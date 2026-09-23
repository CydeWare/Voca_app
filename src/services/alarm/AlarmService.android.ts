import { DeviceEventEmitter, NativeModules } from 'react-native';
import type { AlarmServiceApi, SystemStatus } from './types';
import type { RingingAlarmInfo } from '../../types/alarm';
import { log } from '../../utils/logger';
import { TEST_VOLUME_OVERRIDE } from '../../constants';

const Native = NativeModules.VocaAlarm;

function requireNative() {
  if (!Native) throw new Error('VocaAlarm native module is not linked. Rebuild the Android app.');
  return Native;
}

/** Android implementation: AlarmManager.setAlarmClock + foreground ringing service (Kotlin). */
export const AlarmService: AlarmServiceApi = {
  isSupported: true,

  async syncAlarms(alarms) {
    const specs = alarms
      .filter(a => a.enabled)
      .map(a => ({
        id: a.id,
        hour: a.hour,
        minute: a.minute,
        repeatDays: a.repeatDays,
        soundId: a.soundId,
        vibration: a.vibrationEnabled,
        volume: TEST_VOLUME_OVERRIDE ?? a.volume,
      }));
    const result = await requireNative().syncAlarms(JSON.stringify(specs));
    log.info(`Alarms synced: ${specs.length} scheduled`);
    return result;
  },

  async scheduleTestAlarm(seconds, soundId, vibration, volume) {
    const r = await requireNative().scheduleTestAlarm(seconds, soundId, vibration, TEST_VOLUME_OVERRIDE ?? volume);
    return { id: '__voca_test__', triggerAt: r.triggerAt, exact: r.exact };
  },

  consumeFiredOneShots: () => requireNative().consumeFiredOneShots(),
  getRingingAlarm: () => requireNative().getRingingAlarm(),
  stopRinging: () => requireNative().stopRinging(),
  setRingingDucked: ducked => requireNative().setRingingDucked(ducked),

  async getSystemStatus(): Promise<SystemStatus> {
    const s = await requireNative().getSystemStatus();
    return { supported: true, ...s };
  },

  openSystemSettings: target => requireNative().openSystemSettings(target),

  onRinging(cb: (info: RingingAlarmInfo) => void) {
    const sub = DeviceEventEmitter.addListener('VocaAlarmRinging', cb);
    return () => sub.remove();
  },
};
