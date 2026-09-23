import type { Alarm, AlarmSoundId, RingingAlarmInfo } from '../../types/alarm';
import type { ScheduleInfo } from '../../store/slices/alarmSlice';

export type SystemStatus = {
  supported: boolean;
  sdkInt: number;
  exactAlarms: boolean;
  notifications: boolean;
  fullScreenIntent: boolean;
  batteryUnrestricted: boolean;
  manufacturer: string;
};

export type SettingsTarget = 'exact_alarm' | 'full_screen' | 'notifications' | 'battery' | 'app';

/** Everything the app needs from the OS alarm layer. */
export interface AlarmServiceApi {
  readonly isSupported: boolean;
  /** Replace the OS schedule with exactly these (enabled) alarms. */
  syncAlarms(alarms: Alarm[]): Promise<ScheduleInfo[]>;
  scheduleTestAlarm(
    seconds: number,
    soundId: AlarmSoundId,
    vibration: boolean,
    volume: number,
  ): Promise<ScheduleInfo>;
  consumeFiredOneShots(): Promise<string[]>;
  getRingingAlarm(): Promise<RingingAlarmInfo | null>;
  /** Stops audio, vibration, the foreground service, and lock-screen mode. */
  stopRinging(): Promise<void>;
  /** Pauses audio + vibration while the user speaks. */
  setRingingDucked(ducked: boolean): Promise<void>;
  getSystemStatus(): Promise<SystemStatus>;
  openSystemSettings(target: SettingsTarget): Promise<boolean>;
  onRinging(cb: (info: RingingAlarmInfo) => void): () => void;
}
