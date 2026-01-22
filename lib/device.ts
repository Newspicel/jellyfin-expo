import * as Application from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'jellyfin_device_id';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    const storedId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (storedId) {
      cachedDeviceId = storedId;
      return storedId;
    }
  } catch {
    // SecureStore not available (e.g., web)
  }

  const newId = generateUUID();
  cachedDeviceId = newId;

  try {
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
  } catch {
    // SecureStore not available
  }

  return newId;
}

export function getDeviceName(): string {
  const platformName = Platform.isTV
    ? Platform.OS === 'ios'
      ? 'Apple TV'
      : 'Android TV'
    : Platform.OS === 'ios'
      ? 'iPhone'
      : Platform.OS === 'android'
        ? 'Android'
        : Platform.OS === 'macos'
          ? 'Mac'
          : Platform.OS === 'windows'
            ? 'Windows'
            : 'Device';

  return platformName;
}

export function getClientName(): string {
  return 'Jellyfin Expo';
}

export function getClientVersion(): string {
  return Application.default?.expoConfig?.version ?? '1.0.0';
}
