/**
 * Playback hook for fetching playback info and building stream URLs
 *
 * This hook handles:
 * - Fetching playback info with the appropriate device profile
 * - Selecting the best media source for playback
 * - Building stream URLs based on play method (DirectPlay, DirectStream, Transcode)
 * - Managing audio and subtitle track selection
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useCallback } from 'react';
import {
  getPostedPlaybackInfoOptions,
  getPostedPlaybackInfoQueryKey,
} from '@/api/generated/@tanstack/react-query.gen';
import type {
  MediaSourceInfo,
  MediaStream,
  PlaybackInfoResponse,
} from '@/api/generated/types.gen';
import { getDeviceProfile } from '@/api/device-profile';
import { useServerStore } from '@/stores/server.store';
import { useAuthStore } from '@/stores/auth.store';

// =============================================================================
// TYPES
// =============================================================================

export type PlayMethod = 'DirectPlay' | 'DirectStream' | 'Transcode';

export interface PlaybackInfo {
  /** The URL to use for playback */
  streamUrl: string;
  /** How the media will be played */
  playMethod: PlayMethod;
  /** Selected media source info */
  mediaSource: MediaSourceInfo;
  /** Play session ID for progress reporting */
  playSessionId: string | null;
  /** Available audio tracks */
  audioTracks: MediaStream[];
  /** Available subtitle tracks */
  subtitleTracks: MediaStream[];
  /** Selected audio track index */
  selectedAudioIndex: number | null;
  /** Selected subtitle track index (-1 for off) */
  selectedSubtitleIndex: number | null;
  /** Start position in ticks */
  startPositionTicks: number;
}

export interface UsePlaybackOptions {
  /** Item ID to play */
  itemId: string;
  /** Media source ID to use (optional, will select best if not provided) */
  mediaSourceId?: string;
  /** Audio stream index to use */
  audioStreamIndex?: number;
  /** Subtitle stream index to use (-1 for off) */
  subtitleStreamIndex?: number;
  /** Start position in ticks */
  startTimeTicks?: number;
  /** Maximum streaming bitrate */
  maxStreamingBitrate?: number;
  /** Whether to enable the query */
  enabled?: boolean;
}

export interface UsePlaybackResult {
  /** Playback info if available */
  playbackInfo: PlaybackInfo | null;
  /** Whether playback info is loading */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
  /** Refetch playback info */
  refetch: () => void;
  /** Change audio track */
  setAudioTrack: (index: number) => void;
  /** Change subtitle track (-1 for off) */
  setSubtitleTrack: (index: number) => void;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Determine the play method from a media source
 */
function getPlayMethod(source: MediaSourceInfo): PlayMethod {
  if (source.SupportsDirectPlay) {
    return 'DirectPlay';
  }
  if (source.SupportsDirectStream) {
    return 'DirectStream';
  }
  return 'Transcode';
}

/**
 * Select the best media source from available sources
 * Prioritizes: DirectPlay > DirectStream > Transcode
 */
function selectBestMediaSource(
  sources: MediaSourceInfo[],
  preferredId?: string
): MediaSourceInfo | null {
  if (!sources || sources.length === 0) {
    return null;
  }

  // If a specific source is requested, use it if available
  if (preferredId) {
    const preferred = sources.find((s) => s.Id === preferredId);
    if (preferred) {
      return preferred;
    }
  }

  // Sort by play capability: DirectPlay > DirectStream > Transcode
  const sorted = [...sources].sort((a, b) => {
    const aScore = a.SupportsDirectPlay ? 3 : a.SupportsDirectStream ? 2 : 1;
    const bScore = b.SupportsDirectPlay ? 3 : b.SupportsDirectStream ? 2 : 1;
    return bScore - aScore;
  });

  return sorted[0];
}

/**
 * Filter media streams by type
 */
function filterStreamsByType(
  streams: MediaStream[] | null | undefined,
  type: 'Audio' | 'Subtitle' | 'Video'
): MediaStream[] {
  if (!streams) return [];
  return streams.filter((s) => s.Type === type);
}

/**
 * Get default audio stream index
 */
function getDefaultAudioIndex(source: MediaSourceInfo): number | null {
  if (source.DefaultAudioStreamIndex !== undefined) {
    return source.DefaultAudioStreamIndex;
  }
  const audioStreams = filterStreamsByType(source.MediaStreams, 'Audio');
  if (audioStreams.length > 0 && audioStreams[0].Index !== undefined) {
    return audioStreams[0].Index;
  }
  return null;
}

/**
 * Get default subtitle stream index
 */
function getDefaultSubtitleIndex(source: MediaSourceInfo): number | null {
  if (source.DefaultSubtitleStreamIndex !== undefined) {
    return source.DefaultSubtitleStreamIndex;
  }
  return null; // No subtitle by default
}

// =============================================================================
// STREAM URL BUILDER
// =============================================================================

/**
 * Build the stream URL based on play method
 */
function buildStreamUrl(
  serverUrl: string,
  itemId: string,
  source: MediaSourceInfo,
  playMethod: PlayMethod,
  options: {
    audioStreamIndex?: number | null;
    subtitleStreamIndex?: number | null;
    startTimeTicks?: number;
    maxStreamingBitrate?: number;
    playSessionId?: string | null;
  }
): string {
  const {
    audioStreamIndex,
    subtitleStreamIndex,
    startTimeTicks,
    maxStreamingBitrate,
    playSessionId,
  } = options;

  // For transcoding, server provides the URL
  if (playMethod === 'Transcode' && source.TranscodingUrl) {
    // TranscodingUrl is relative to the server
    const url = new URL(source.TranscodingUrl, serverUrl);
    return url.toString();
  }

  // Build direct play/stream URL
  const url = new URL(`/Videos/${itemId}/stream`, serverUrl);
  const params = url.searchParams;

  // Static=true for direct play (no server processing)
  if (playMethod === 'DirectPlay') {
    params.set('static', 'true');
  }

  // Media source ID
  if (source.Id) {
    params.set('mediaSourceId', source.Id);
  }

  // Container
  if (source.Container) {
    params.set('container', source.Container);
  }

  // Audio stream
  if (audioStreamIndex !== undefined && audioStreamIndex !== null) {
    params.set('audioStreamIndex', String(audioStreamIndex));
  }

  // Subtitle stream
  if (subtitleStreamIndex !== undefined && subtitleStreamIndex !== null && subtitleStreamIndex >= 0) {
    params.set('subtitleStreamIndex', String(subtitleStreamIndex));
  }

  // Start position
  if (startTimeTicks) {
    params.set('startTimeTicks', String(startTimeTicks));
  }

  // Bitrate limit
  if (maxStreamingBitrate) {
    params.set('maxStreamingBitrate', String(maxStreamingBitrate));
  }

  // Play session ID for progress tracking
  if (playSessionId) {
    params.set('playSessionId', playSessionId);
  }

  return url.toString();
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for managing video playback
 *
 * @example
 * ```tsx
 * const { playbackInfo, isLoading, error, setAudioTrack, setSubtitleTrack } = usePlayback({
 *   itemId: 'abc123',
 * });
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error error={error} />;
 * if (!playbackInfo) return <NoContent />;
 *
 * return (
 *   <VideoPlayer
 *     source={{ uri: playbackInfo.streamUrl }}
 *     audioTracks={playbackInfo.audioTracks}
 *     selectedAudioTrack={playbackInfo.selectedAudioIndex}
 *     onAudioTrackChange={setAudioTrack}
 *   />
 * );
 * ```
 */
export function usePlayback(options: UsePlaybackOptions): UsePlaybackResult {
  const {
    itemId,
    mediaSourceId,
    audioStreamIndex: initialAudioIndex,
    subtitleStreamIndex: initialSubtitleIndex,
    startTimeTicks = 0,
    maxStreamingBitrate,
    enabled = true,
  } = options;

  // State for track selection
  const [selectedAudioIndex, setSelectedAudioIndex] = useState<number | null>(
    initialAudioIndex ?? null
  );
  const [selectedSubtitleIndex, setSelectedSubtitleIndex] = useState<number | null>(
    initialSubtitleIndex ?? null
  );

  // Get server URL and user ID
  const server = useServerStore((s) => s.getCurrentServer());
  const credentials = useAuthStore((s) => {
    if (!server) return null;
    return s.getCredentials(server.id);
  });

  // Get device profile for this platform
  const deviceProfile = useMemo(() => getDeviceProfile(), []);

  // Fetch playback info
  const {
    data: playbackInfoResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...getPostedPlaybackInfoOptions({
      path: { itemId },
      body: {
        UserId: credentials?.userId,
        MaxStreamingBitrate: maxStreamingBitrate ?? deviceProfile.MaxStreamingBitrate,
        StartTimeTicks: startTimeTicks,
        AudioStreamIndex: selectedAudioIndex,
        SubtitleStreamIndex: selectedSubtitleIndex,
        MediaSourceId: mediaSourceId,
        DeviceProfile: deviceProfile,
      },
    }),
    enabled: enabled && !!server && !!credentials,
  });

  // Process playback info
  const playbackInfo = useMemo((): PlaybackInfo | null => {
    if (!playbackInfoResponse || !server) {
      return null;
    }

    const { MediaSources, PlaySessionId, ErrorCode } = playbackInfoResponse;

    // Check for errors
    if (ErrorCode) {
      console.warn('Playback error:', ErrorCode);
      return null;
    }

    // Select best media source
    const source = selectBestMediaSource(MediaSources ?? [], mediaSourceId);
    if (!source) {
      return null;
    }

    // Determine play method
    const playMethod = getPlayMethod(source);

    // Get available tracks
    const audioTracks = filterStreamsByType(source.MediaStreams, 'Audio');
    const subtitleTracks = filterStreamsByType(source.MediaStreams, 'Subtitle');

    // Use selected indices or defaults
    const audioIndex = selectedAudioIndex ?? getDefaultAudioIndex(source);
    const subtitleIndex = selectedSubtitleIndex ?? getDefaultSubtitleIndex(source);

    // Build stream URL
    const streamUrl = buildStreamUrl(server.url, itemId, source, playMethod, {
      audioStreamIndex: audioIndex,
      subtitleStreamIndex: subtitleIndex,
      startTimeTicks,
      maxStreamingBitrate: maxStreamingBitrate ?? deviceProfile.MaxStreamingBitrate ?? undefined,
      playSessionId: PlaySessionId,
    });

    return {
      streamUrl,
      playMethod,
      mediaSource: source,
      playSessionId: PlaySessionId ?? null,
      audioTracks,
      subtitleTracks,
      selectedAudioIndex: audioIndex,
      selectedSubtitleIndex: subtitleIndex,
      startPositionTicks: startTimeTicks,
    };
  }, [
    playbackInfoResponse,
    server,
    itemId,
    mediaSourceId,
    selectedAudioIndex,
    selectedSubtitleIndex,
    startTimeTicks,
    maxStreamingBitrate,
    deviceProfile.MaxStreamingBitrate,
  ]);

  // Track selection handlers
  const setAudioTrack = useCallback((index: number) => {
    setSelectedAudioIndex(index);
  }, []);

  const setSubtitleTrack = useCallback((index: number) => {
    setSelectedSubtitleIndex(index);
  }, []);

  return {
    playbackInfo,
    isLoading,
    error: error as Error | null,
    refetch,
    setAudioTrack,
    setSubtitleTrack,
  };
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

export { getPlayMethod, selectBestMediaSource, buildStreamUrl, filterStreamsByType };
