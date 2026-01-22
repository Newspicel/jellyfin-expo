/**
 * Progress reporting hook for Jellyfin playback
 *
 * Reports playback progress to the server for:
 * - Continue Watching
 * - Watched status
 * - Playback statistics
 *
 * Reports:
 * - On playback start
 * - Every 10 seconds during playback
 * - On pause/resume
 * - On playback stop
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  reportPlaybackStart,
  reportPlaybackProgress,
  reportPlaybackStopped,
} from '@/api/generated/sdk.gen';
import type { PlayMethod } from '@/api/generated/types.gen';

// Report progress every 10 seconds
const PROGRESS_REPORT_INTERVAL_MS = 10000;

// Convert seconds to ticks (10 million ticks per second)
const TICKS_PER_SECOND = 10000000;

export interface ProgressReportingOptions {
  /** Item ID being played */
  itemId: string;
  /** Media source ID */
  mediaSourceId: string | null;
  /** Play session ID from playback info */
  playSessionId: string | null;
  /** How the media is being played */
  playMethod: PlayMethod;
  /** Current playback position in seconds */
  currentTimeSeconds: number;
  /** Total duration in seconds */
  durationSeconds: number;
  /** Whether playback is currently paused */
  isPaused: boolean;
  /** Whether playback has started (player is ready) */
  isReady: boolean;
  /** Selected audio track index */
  audioStreamIndex?: number | null;
  /** Selected subtitle track index */
  subtitleStreamIndex?: number | null;
  /** Volume level (0-100) */
  volumeLevel?: number;
  /** Whether audio is muted */
  isMuted?: boolean;
  /** Whether the hook is enabled */
  enabled?: boolean;
}

/**
 * Hook that reports playback progress to the Jellyfin server
 *
 * @example
 * ```tsx
 * useProgressReporting({
 *   itemId: 'abc123',
 *   mediaSourceId: playbackInfo.mediaSource.Id,
 *   playSessionId: playbackInfo.playSessionId,
 *   playMethod: playbackInfo.playMethod,
 *   currentTimeSeconds: currentTime,
 *   durationSeconds: duration,
 *   isPaused: !isPlaying,
 *   isReady: true,
 * });
 * ```
 */
export function useProgressReporting(options: ProgressReportingOptions): void {
  const {
    itemId,
    mediaSourceId,
    playSessionId,
    playMethod,
    currentTimeSeconds,
    // durationSeconds not needed - server tracks this
    isPaused,
    isReady,
    audioStreamIndex,
    subtitleStreamIndex,
    volumeLevel = 100,
    isMuted = false,
    enabled = true,
  } = options;

  // Track whether we've reported playback start
  const hasReportedStart = useRef(false);

  // Track the last reported position to avoid duplicate reports
  const lastReportedPosition = useRef(0);

  // Track the last pause state to detect changes
  const lastPauseState = useRef<boolean | null>(null);

  // Timer for periodic progress reports
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Convert seconds to ticks
  const positionTicks = Math.floor(currentTimeSeconds * TICKS_PER_SECOND);

  // Report playback start
  const reportStart = useCallback(async () => {
    if (!enabled || !itemId) return;

    try {
      await reportPlaybackStart({
        body: {
          ItemId: itemId,
          MediaSourceId: mediaSourceId ?? undefined,
          PlaySessionId: playSessionId ?? undefined,
          PlayMethod: playMethod,
          PositionTicks: positionTicks,
          AudioStreamIndex: audioStreamIndex ?? undefined,
          SubtitleStreamIndex: subtitleStreamIndex ?? undefined,
          VolumeLevel: volumeLevel,
          IsMuted: isMuted,
          IsPaused: isPaused,
          CanSeek: true,
        },
      });
      console.log('[Progress] Reported playback start');
    } catch (error) {
      console.error('[Progress] Failed to report playback start:', error);
    }
  }, [
    enabled,
    itemId,
    mediaSourceId,
    playSessionId,
    playMethod,
    positionTicks,
    audioStreamIndex,
    subtitleStreamIndex,
    volumeLevel,
    isMuted,
    isPaused,
  ]);

  // Report playback progress
  const reportProgress = useCallback(async () => {
    if (!enabled || !itemId || !isReady) return;

    // Skip if position hasn't changed significantly (within 1 second)
    const positionDiff = Math.abs(currentTimeSeconds - lastReportedPosition.current);
    if (positionDiff < 1 && lastPauseState.current === isPaused) {
      return;
    }

    lastReportedPosition.current = currentTimeSeconds;
    lastPauseState.current = isPaused;

    try {
      await reportPlaybackProgress({
        body: {
          ItemId: itemId,
          MediaSourceId: mediaSourceId ?? undefined,
          PlaySessionId: playSessionId ?? undefined,
          PlayMethod: playMethod,
          PositionTicks: positionTicks,
          AudioStreamIndex: audioStreamIndex ?? undefined,
          SubtitleStreamIndex: subtitleStreamIndex ?? undefined,
          VolumeLevel: volumeLevel,
          IsMuted: isMuted,
          IsPaused: isPaused,
          CanSeek: true,
        },
      });
      console.log('[Progress] Reported progress:', {
        position: currentTimeSeconds.toFixed(1),
        isPaused,
      });
    } catch (error) {
      console.error('[Progress] Failed to report progress:', error);
    }
  }, [
    enabled,
    itemId,
    isReady,
    mediaSourceId,
    playSessionId,
    playMethod,
    positionTicks,
    currentTimeSeconds,
    audioStreamIndex,
    subtitleStreamIndex,
    volumeLevel,
    isMuted,
    isPaused,
  ]);

  // Report start when player becomes ready
  useEffect(() => {
    if (!enabled || !isReady || hasReportedStart.current) return;

    hasReportedStart.current = true;
    reportStart();
  }, [enabled, isReady, reportStart]);

  // Report progress on pause state change
  useEffect(() => {
    if (!enabled || !isReady || !hasReportedStart.current) return;

    // Only report if pause state actually changed
    if (lastPauseState.current !== null && lastPauseState.current !== isPaused) {
      reportProgress();
    }
  }, [enabled, isReady, isPaused, reportProgress]);

  // Set up periodic progress reporting
  useEffect(() => {
    if (!enabled || !isReady || isPaused) {
      // Clear timer if paused or not ready
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      return;
    }

    // Start periodic progress reporting
    progressTimerRef.current = setInterval(() => {
      reportProgress();
    }, PROGRESS_REPORT_INTERVAL_MS);

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [enabled, isReady, isPaused, reportProgress]);

  // Report stopped on unmount
  useEffect(() => {
    return () => {
      if (hasReportedStart.current) {
        // Fire and forget - don't wait for the promise
        reportPlaybackStopped({
          body: {
            ItemId: itemId,
            MediaSourceId: mediaSourceId ?? undefined,
            PlaySessionId: playSessionId ?? undefined,
            PositionTicks: Math.floor(currentTimeSeconds * TICKS_PER_SECOND),
          },
        }).catch((error) => {
          console.error('[Progress] Failed to report playback stopped on unmount:', error);
        });
      }
    };
  }, [itemId, mediaSourceId, playSessionId, currentTimeSeconds]);

  // Reset state when item changes
  useEffect(() => {
    hasReportedStart.current = false;
    lastReportedPosition.current = 0;
    lastPauseState.current = null;
  }, [itemId]);
}
