import type { AlarmServiceApi } from './types';

/**
 * iOS is not implemented in the MVP. iOS does not let third-party apps run code or keep
 * looping audio at an arbitrary future time the way Android's AlarmManager does; a real
 * implementation needs AlarmKit (iOS 26+) or time-sensitive notifications with sounds
 * limited to 30 seconds. See README "iOS status".
 */
const unsupported = async (): Promise<never> => {
  throw new Error('Alarms are not supported on iOS in this MVP yet.');
};

export const AlarmService: AlarmServiceApi = {
  isSupported: false,
  syncAlarms: async () => [],
  scheduleTestAlarm: unsupported,
  consumeFiredOneShots: async () => [],
  getRingingAlarm: async () => null,
  stopRinging: async () => {},
  setRingingDucked: async () => {},
  getSystemStatus: async () => ({
    supported: false,
    sdkInt: 0,
    exactAlarms: false,
    notifications: false,
    fullScreenIntent: false,
    batteryUnrestricted: true,
    manufacturer: 'Apple',
  }),
  openSystemSettings: async () => false,
  onRinging: () => () => {},
};
