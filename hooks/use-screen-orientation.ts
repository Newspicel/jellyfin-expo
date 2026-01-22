/**
 * Screen Orientation Hook
 *
 * Locks the screen to landscape orientation on mount and unlocks on unmount.
 * Used by the video player to ensure proper video viewing experience.
 */

import { useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { isTV } from '@/theme';

/**
 * Lock screen to landscape orientation on mount, unlock on unmount.
 * Only applies to mobile devices (TV is already landscape).
 */
export function useScreenOrientation() {
  useEffect(() => {
    // TV platforms are always landscape, no need to lock
    if (isTV) return;

    const lockOrientation = async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
      } catch (error) {
        // Orientation lock not supported on this device/platform
        console.warn('Failed to lock screen orientation:', error);
      }
    };

    lockOrientation();

    return () => {
      ScreenOrientation.unlockAsync().catch(() => {
        // Ignore unlock errors on unmount
      });
    };
  }, []);
}
