/**
 * Controls Visibility Hook
 *
 * Manages auto-hide logic for video player controls.
 * Controls automatically hide after a delay when video is playing.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// Auto-hide controls after this delay (ms)
const CONTROLS_HIDE_DELAY = 4000;

export interface UseControlsVisibilityResult {
  /** Whether controls are currently visible */
  visible: boolean;
  /** Show controls and reset hide timer */
  show: () => void;
  /** Hide controls immediately */
  hide: () => void;
  /** Toggle controls visibility */
  toggle: () => void;
  /** Reset the auto-hide timer (call on user interaction) */
  resetTimer: () => void;
  /** Pause the auto-hide timer (call during seeking) */
  pauseTimer: () => void;
}

export interface UseControlsVisibilityOptions {
  /** Whether video is currently playing */
  isPlaying: boolean;
  /** Initial visibility state */
  initialVisible?: boolean;
}

/**
 * Hook to manage player controls visibility with auto-hide behavior.
 */
export function useControlsVisibility({
  isPlaying,
  initialVisible = true,
}: UseControlsVisibilityOptions): UseControlsVisibilityResult {
  const [visible, setVisible] = useState(initialVisible);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any existing timer
  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  // Start auto-hide timer
  const startHideTimer = useCallback(() => {
    clearHideTimer();
    if (isPlaying) {
      hideTimer.current = setTimeout(() => {
        setVisible(false);
      }, CONTROLS_HIDE_DELAY);
    }
  }, [isPlaying, clearHideTimer]);

  // Show controls and restart timer
  const show = useCallback(() => {
    setVisible(true);
    startHideTimer();
  }, [startHideTimer]);

  // Hide controls immediately
  const hide = useCallback(() => {
    clearHideTimer();
    setVisible(false);
  }, [clearHideTimer]);

  // Toggle visibility
  const toggle = useCallback(() => {
    setVisible((prev) => {
      if (!prev) {
        // Showing controls - start timer
        startHideTimer();
      } else {
        // Hiding controls - clear timer
        clearHideTimer();
      }
      return !prev;
    });
  }, [startHideTimer, clearHideTimer]);

  // Reset timer (for user interaction like seeking)
  const resetTimer = useCallback(() => {
    if (visible) {
      startHideTimer();
    }
  }, [visible, startHideTimer]);

  // Pause timer (during active seeking)
  const pauseTimer = useCallback(() => {
    clearHideTimer();
  }, [clearHideTimer]);

  // Handle play/pause state changes
  useEffect(() => {
    if (visible && isPlaying) {
      startHideTimer();
    } else if (!isPlaying) {
      // Pause - clear timer, keep controls visible
      clearHideTimer();
    }

    return clearHideTimer;
  }, [visible, isPlaying, startHideTimer, clearHideTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return clearHideTimer;
  }, [clearHideTimer]);

  return {
    visible,
    show,
    hide,
    toggle,
    resetTimer,
    pauseTimer,
  };
}
