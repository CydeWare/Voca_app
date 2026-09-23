import { PermissionsAndroid, Platform } from 'react-native';

export type PermissionResult = 'granted' | 'denied' | 'blocked';

function map(result: string): PermissionResult {
  if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return 'blocked';
  return 'denied';
}

export async function checkMicrophone(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
}

export async function requestMicrophone(): Promise<PermissionResult> {
  if (Platform.OS !== 'android') return 'denied';
  if (await checkMicrophone()) return 'granted';
  return map(await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO));
}

/** POST_NOTIFICATIONS is a runtime permission from Android 13 (API 33). */
export async function requestNotifications(): Promise<PermissionResult> {
  if (Platform.OS !== 'android') return 'denied';
  if (typeof Platform.Version === 'number' && Platform.Version < 33) return 'granted';
  const perm = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
  if (await PermissionsAndroid.check(perm)) return 'granted';
  return map(await PermissionsAndroid.request(perm));
}
